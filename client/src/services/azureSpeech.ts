import * as speechsdk from 'microsoft-cognitiveservices-speech-sdk';

interface TranslationConfig {
  inputLanguage: string;
  outputLanguage: string;
  secondOutputLanguage?: string;
}

export class AzureSpeechService {
  private translationRecognizer: speechsdk.TranslationRecognizer | null = null;
  private isRecognizing: boolean = false;

  constructor(
    private onRecognizing: (original: string, translations: string[]) => void,
    private onRecognized: (original: string, translations: string[]) => void,
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

      speechConfig.speechRecognitionLanguage = config.inputLanguage;
      
      // Add target languages
      speechConfig.addTargetLanguage(config.outputLanguage);
      if (config.secondOutputLanguage) {
        speechConfig.addTargetLanguage(config.secondOutputLanguage);
      }

      // Configure audio
      console.log('Configuring audio input...');
      const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();

      // Set additional properties for better recognition
      speechConfig.setProperty(speechsdk.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, "5000");
      speechConfig.setProperty(speechsdk.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs, "1000");
      speechConfig.setProperty(speechsdk.PropertyId.SpeechServiceResponse_RequestDetailedResultTrueFalse, "true");

      // Create recognizer
      console.log('Creating translation recognizer...');
      this.translationRecognizer = new speechsdk.TranslationRecognizer(
        speechConfig,
        audioConfig
      );

      // Set up event handlers with better error handling
      this.translationRecognizer.recognizing = (_, event) => {
        const result = event.result;
        if (result.reason === speechsdk.ResultReason.TranslatingSpeech) {
          console.log('Recognizing speech...', {
            text: result.text,
            rawTranslations: result.translations,
          });
          
          // Extract translations properly from the PropertyCollection
          const translationsObj = result.translations as any;
          const translations = Object.values(translationsObj.privMap.privValues) as string[];
          
          console.log('Extracted interim translations:', translations);
          this.onRecognizing(result.text, translations);
        } else {
          console.log('Recognizing event with reason:', result.reason);
        }
      };

      this.translationRecognizer.recognized = (_, event) => {
        const result = event.result;
        if (result.reason === speechsdk.ResultReason.TranslatedSpeech) {
          console.log('Recognized speech:', {
            text: result.text,
            rawTranslations: result.translations,
          });
          
          // Extract translations properly from the PropertyCollection
          const translationsObj = result.translations as any;
          const translations = Object.values(translationsObj.privMap.privValues) as string[];
          
          console.log('Extracted final translations:', translations);
          this.onRecognized(result.text, translations);
        } else if (result.reason === speechsdk.ResultReason.NoMatch) {
          const noMatchDetail = speechsdk.NoMatchDetails.fromResult(result);
          if (noMatchDetail.reason === speechsdk.NoMatchReason.InitialSilenceTimeout ||
              noMatchDetail.reason === speechsdk.NoMatchReason.InitialBabbleTimeout ||
              noMatchDetail.reason === speechsdk.NoMatchReason.NotRecognized) {
            console.debug('Silence detected, continuing to listen...');
          } else {
            console.warn('No speech could be recognized:', noMatchDetail.reason);
            this.onError(`Speech recognition error: ${noMatchDetail.reason}`);
          }
        } else {
          console.log('Recognition event with reason:', result.reason);
        }
      };

      this.translationRecognizer.canceled = async (_, event) => {
        console.error('Speech recognition canceled:', {
          reason: event.reason,
          errorDetails: event.errorDetails,
          errorCode: event.errorCode
        });
        
        if (event.reason === speechsdk.CancellationReason.Error) {
          const errorMessage = `Error: ${event.errorDetails} (Code: ${event.errorCode})`;
          console.error(errorMessage);
          this.onError(errorMessage);
        }
        await this.stopTranslation();
      };

      // Start continuous recognition with error handling
      console.log('Starting continuous recognition...');
      try {
        await this.translationRecognizer.startContinuousRecognitionAsync();
        this.isRecognizing = true;
        console.log('Translation started successfully');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error('Error during speech recognition:', errorMessage);
        this.onError(errorMessage);
        await this.stopTranslation();
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error during speech recognition:', errorMessage);
      this.onError(errorMessage);
      await this.stopTranslation();
    }
  }

  async stopTranslation() {
    console.log('Stopping translation...');
    if (this.translationRecognizer) {
      try {
        await this.translationRecognizer.stopContinuousRecognitionAsync();
        this.translationRecognizer.close();
      } catch (error) {
        console.error('Error stopping translation:', error);
      }
      this.translationRecognizer = null;
    }
    this.isRecognizing = false;
  }
}
