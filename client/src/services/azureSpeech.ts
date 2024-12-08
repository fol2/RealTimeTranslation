import * as speechsdk from 'microsoft-cognitiveservices-speech-sdk';
import config from '../config';

interface TranslationConfig {
  inputLanguage: string;
  outputLanguage: string;
  secondOutputLanguage?: string;
  server: {
    apiUrl: string;
  };
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

      // Get token from server
      const response = await fetch(`${config.server.apiUrl}/api/speech-token`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        },
        mode: 'cors'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to get speech token:', response.status, errorText);
        throw new Error(`Failed to get speech token: ${response.status} ${errorText}`);
      }

      console.log('Speech token response status:', response.status);
      
      const data = await response.json();
      console.log('Received speech token response:', {
        hasToken: !!data.token,
        hasRegion: !!data.region
      });

      if (!data.token || !data.region) {
        throw new Error('Failed to get speech token or region');
      }

      // Configure speech service
      console.log('Configuring speech translation...');
      const speechConfig = speechsdk.SpeechTranslationConfig.fromAuthorizationToken(
        data.token,
        data.region
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
          
          // Extract translations directly from the raw response
          const translationsObj = result.translations as any;
          const translations = translationsObj?.privMap?.privValues || [];
          
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
          
          // Extract translations directly from the raw response
          const translationsObj = result.translations as any;
          const translations = translationsObj?.privMap?.privValues || [];
          
          console.log('Extracted final translations:', translations);
          this.onRecognized(result.text, translations);
        } else if (result.reason === speechsdk.ResultReason.NoMatch) {
          const noMatchDetail = speechsdk.NoMatchDetails.fromResult(result);
          // Only log silence timeouts at debug level, don't show error
          if (noMatchDetail.reason === speechsdk.NoMatchReason.InitialSilenceTimeout ||
              noMatchDetail.reason === speechsdk.NoMatchReason.EndSilenceTimeout ||
              noMatchDetail.reason === 0) { // 0 is often returned for brief silence
            console.debug('Silence detected, continuing to listen...');
          } else {
            // Only show error for actual recognition problems
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
          
          // If it's an authorization error, try to restart with a new token
          if (event.errorCode === 4 || event.errorCode === 401) {
            console.log('Authorization error, stopping current session...');
            await this.stopTranslation();
            this.onError('Session expired. Please try again.');
          } else {
            this.onError(errorMessage);
          }
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
        const errorMessage = `Failed to start continuous recognition: ${error.message}`;
        console.error(errorMessage);
        this.onError(errorMessage);
        await this.stopTranslation();
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Failed to start translation:', errorMessage);
      this.onError(`Failed to start translation: ${errorMessage}`);
      await this.stopTranslation();
    }
  }

  async stopTranslation() {
    console.log('Stopping translation...');
    if (this.translationRecognizer) {
      try {
        if (this.isRecognizing) {
          await this.translationRecognizer.stopContinuousRecognitionAsync();
        }
        this.translationRecognizer.close();
        this.translationRecognizer = null;
        this.isRecognizing = false;
        console.log('Translation stopped successfully');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error stopping translation:', errorMessage);
        this.onError(`Error stopping translation: ${errorMessage}`);
      }
    }
  }
}
