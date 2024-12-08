import * as speechsdk from 'microsoft-cognitiveservices-speech-sdk';

interface TranslationConfig {
  inputLanguage: string;
  outputLanguage: string;
  secondOutputLanguage?: string;
}

export class AzureSpeechService {
  private translationRecognizer: speechsdk.TranslationRecognizer | null = null;
  private isRecognizing: boolean = false;
  private lastInterimResult: {
    text: string;
    translations: string[];
    language?: string;
  } | null = null;

  constructor(
    private onRecognizing: (original: string, translations: string[], detectedLanguage?: string) => void,
    private onRecognized: (original: string, translations: string[], detectedLanguage?: string) => void,
    private onError: (error: string) => void
  ) {}

  async startTranslation(config: TranslationConfig) {
    if (this.isRecognizing) {
      console.log('Translation already in progress, stopping current session...');
      await this.stopTranslation();
    }

    try {
      // Request microphone permission first
      console.log('Requesting microphone permission...');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop()); // Stop the stream since we just needed permission
        console.log('Microphone permission granted');
      } catch (error) {
        console.error('Microphone permission denied:', error);
        throw new Error('Microphone access is required for speech recognition. Please allow microphone access and try again.');
      }

      console.log('Starting translation with config:', config);

      // Configure speech service directly with subscription key
      const speechKey = import.meta.env.VITE_AZURE_SPEECH_KEY;
      const speechRegion = import.meta.env.VITE_AZURE_SPEECH_REGION;

      if (!speechKey || !speechRegion) {
        throw new Error('Azure Speech configuration is missing. Please check your environment variables.');
      }

      // Configure speech service
      console.log('Configuring speech translation...');
      const speechConfig = speechsdk.SpeechTranslationConfig.fromSubscription(
        speechKey,
        speechRegion
      );

      // Configure languages
      console.log('Setting languages:', {
        input: config.inputLanguage,
        output: config.outputLanguage,
        second: config.secondOutputLanguage
      });

      // For auto-detect, we need to:
      // 1. Set a default recognition language (required by Azure)
      // 2. Enable auto language detection
      if (config.inputLanguage === 'auto') {
        // Set a default language (English) as required by Azure
        speechConfig.speechRecognitionLanguage = 'en-US';
        
        // Enable auto language detection
        speechConfig.setProperty(
          speechsdk.PropertyId.SpeechServiceConnection_LanguageIdMode,
          'Continuous'
        );
        
        // Add top 10 most common languages for detection
        // Note: Azure Speech Service only supports 10 languages in auto-detect mode
        const autoDetectSourceLanguages = [
          'en-US',  // English
          'zh-CN',  // Chinese (Simplified)
          'es-ES',  // Spanish
          'hi-IN',  // Hindi
          'ar-SA',  // Arabic
          'fr-FR',  // French
          'ru-RU',  // Russian
          'pt-BR',  // Portuguese
          'ja-JP',  // Japanese
          'de-DE'   // German
        ].join(',');
        
        console.log('Setting auto-detect languages:', autoDetectSourceLanguages);
        
        speechConfig.setProperty(
          speechsdk.PropertyId.SpeechServiceConnection_AutoDetectSourceLanguages,
          autoDetectSourceLanguages
        );
      } else {
        speechConfig.speechRecognitionLanguage = config.inputLanguage;
      }
      
      // Add target languages
      speechConfig.addTargetLanguage(config.outputLanguage);
      if (config.secondOutputLanguage) {
        speechConfig.addTargetLanguage(config.secondOutputLanguage);
      }

      // Configure audio
      console.log('Configuring audio input...');
      const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();

      // Set additional properties for better recognition
      speechConfig.setProperty(speechsdk.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, "1250");
      speechConfig.setProperty(speechsdk.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs, "250");
      speechConfig.setProperty(speechsdk.PropertyId.SpeechServiceResponse_RequestDetailedResultTrueFalse, "true");
      speechConfig.enableDictation();
      
      // Create recognizer
      console.log('Creating translation recognizer...');
      this.translationRecognizer = new speechsdk.TranslationRecognizer(
        speechConfig,
        audioConfig
      );

      // Set up event handlers with better error handling
      this.setupRecognizer(this.translationRecognizer);

      // Start continuous recognition
      console.log('Starting continuous recognition...');
      await this.translationRecognizer.startContinuousRecognitionAsync();
      console.log('Translation started successfully');
      this.isRecognizing = true;
    } catch (error) {
      console.error('Error during speech recognition:', error);
      this.onError(error instanceof Error ? error.message : 'Unknown error occurred');
      throw error;
    }
  }

  private setupRecognizer(recognizer: speechsdk.TranslationRecognizer) {
    recognizer.recognizing = (_, event) => {
      const result = event.result;
      if (result.reason === speechsdk.ResultReason.TranslatingSpeech) {
        const detectedLanguage = result.language;
        console.log('Recognizing speech...', {
          text: result.text,
          rawTranslations: result.translations,
          detectedLanguage
        });
        
        // Extract translations properly from the PropertyCollection
        const translationsObj = result.translations as any;
        const translations = Object.values(translationsObj.privMap.privValues) as string[];
        
        // Store the interim result
        this.lastInterimResult = {
          text: result.text,
          translations,
          language: detectedLanguage
        };
        
        console.log('Extracted interim translations:', translations);
        this.onRecognizing(result.text, translations, detectedLanguage);
      } else {
        console.log('Recognizing event with reason:', result.reason);
      }
    };

    recognizer.recognized = (_, event) => {
      const result = event.result;
      if (result.reason === speechsdk.ResultReason.TranslatedSpeech) {
        const detectedLanguage = result.language;
        console.log('Recognized speech:', {
          text: result.text,
          rawTranslations: result.translations,
          detectedLanguage
        });
        
        // Extract translations properly from the PropertyCollection
        const translationsObj = result.translations as any;
        const translations = Object.values(translationsObj.privMap.privValues) as string[];
        
        // Clear the interim result if this is the final version
        if (this.lastInterimResult?.text === result.text) {
          this.lastInterimResult = null;
        }
        
        console.log('Extracted final translations:', translations);
        this.onRecognized(result.text, translations, detectedLanguage);
      } else {
        console.log('Recognition event with reason:', result.reason);
      }
    };

    recognizer.canceled = (_, event) => {
      if (event.reason === speechsdk.CancellationReason.Error) {
        console.error('Speech recognition canceled:', event);
        this.onError(`Error: ${event.errorDetails} (Code: ${event.errorCode})`);
      }
    };
  }

  async stopTranslation(): Promise<void> {
    if (this.translationRecognizer && this.isRecognizing) {
      console.log('Stopping translation...');
      try {
        // Return a promise that resolves when we get the final result
        return new Promise<void>((resolve, reject) => {
          let finalResultReceived = false;

          // Store the original recognized callback
          const originalRecognizedCallback = this.translationRecognizer!.recognized;
          
          // Override the recognized callback temporarily
          this.translationRecognizer!.recognized = (_, e) => {
            const result = e.result;
            if (result.reason === speechsdk.ResultReason.TranslatedSpeech) {
              // Extract translations
              const translationsObj = result.translations as any;
              const translations = Object.values(translationsObj.privMap.privValues) as string[];
              
              // Call onRecognized with the final result
              this.onRecognized(result.text, translations, result.language);
              
              finalResultReceived = true;
            }
          };

          // Stop recognition
          this.translationRecognizer?.stopContinuousRecognitionAsync(
            () => {
              this.isRecognizing = false;
              // Restore original callback
              if (this.translationRecognizer) {
                this.translationRecognizer.recognized = originalRecognizedCallback;
              }
              // If we got a final result or timed out, resolve
              setTimeout(() => {
                resolve();
              }, finalResultReceived ? 0 : 1000);
            },
            (err) => {
              console.error('Error stopping recognition:', err);
              // Restore original callback
              if (this.translationRecognizer) {
                this.translationRecognizer.recognized = originalRecognizedCallback;
              }
              reject(err);
            }
          );
        });
      } catch (error) {
        console.error('Error stopping translation:', error);
        throw error;
      }
    }
    return Promise.resolve();
  }
}
