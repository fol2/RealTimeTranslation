import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import * as speechsdk from 'microsoft-cognitiveservices-speech-sdk';
import dotenv from 'dotenv';
import cors from 'cors';

// Load environment variables
dotenv.config();

// Validate environment variables
const REQUIRED_ENV_VARS = ['SPEECH_KEY', 'SPEECH_REGION', 'PORT', 'CORS_ORIGIN'] as const;
REQUIRED_ENV_VARS.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

// Types
interface TranslationConfig {
  inputLanguage: string;
  outputLanguage: string;
  secondOutputLanguage?: string;
}

// Constants
const PORT = process.env.PORT;
const CORS_ORIGIN = process.env.CORS_ORIGIN;

// Create Express app and Socket.io server
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Accept']
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Accept']
}));
app.use(express.json());

// Add debug logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use(express.static(process.cwd() + '/../client', {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.set("Content-Type", "application/javascript");
    } else if (path.endsWith('.css')) {
      res.set("Content-Type", "text/css");
    } else if (path.endsWith('.html')) {
      res.set("Content-Type", "text/html");
    }
  }
}));

// Basic route handler
app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/../client/index.html');
});

// API endpoint for Azure Speech token
app.get('/api/speech-token', async (req, res) => {
  console.log('Speech token requested');
  const speechKey = process.env.SPEECH_KEY;
  const speechRegion = process.env.SPEECH_REGION;

  if (!speechKey || !speechRegion) {
    const missingVars = [];
    if (!speechKey) missingVars.push('SPEECH_KEY');
    if (!speechRegion) missingVars.push('SPEECH_REGION');
    
    const errorMessage = `Azure Speech Service configuration missing. Please set the following environment variables: ${missingVars.join(', ')}`;
    console.error(errorMessage);
    res.status(500).json({ 
      error: errorMessage,
      details: {
        hasSpeechKey: !!speechKey,
        hasSpeechRegion: !!speechRegion
      }
    });
    return;
  }

  try {
    // Token generation URL
    const tokenEndpoint = `https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;
    
    // Make request to get token
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': speechKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get token: ${response.statusText}`);
    }

    const authToken = await response.text();
    console.log('Successfully generated speech token');
    
    res.json({
      token: authToken,
      region: speechRegion
    });
  } catch (error) {
    console.error('Error generating speech token:', error);
    res.status(500).json({
      success: false,
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', (reason) => {
    console.log('Client disconnected:', socket.id, 'Reason:', reason);
    cleanup();
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  let translationRecognizer: speechsdk.TranslationRecognizer | null = null;

  const cleanup = () => {
    console.log('Cleaning up resources for socket:', socket.id);
    if (translationRecognizer) {
      try {
        translationRecognizer.close();
        console.log('Translation recognizer closed successfully');
      } catch (error) {
        console.error('Error closing translation recognizer:', error);
      }
      translationRecognizer = null;
    }
  };

  const initializeTranslation = (config: TranslationConfig) => {
    cleanup();

    try {
      // Configure speech translation
      const speechConfig = speechsdk.SpeechTranslationConfig.fromSubscription(
        process.env.SPEECH_KEY!,
        process.env.SPEECH_REGION!
      );

      // Set languages
      speechConfig.speechRecognitionLanguage = config.inputLanguage;
      speechConfig.addTargetLanguage(config.outputLanguage);
      if (config.secondOutputLanguage) {
        speechConfig.addTargetLanguage(config.secondOutputLanguage);
      }

      // Create audio stream from client's audio data
      const pushStream = speechsdk.AudioInputStream.createPushStream();
      const audioConfig = speechsdk.AudioConfig.fromStreamInput(pushStream);

      // Create translation recognizer
      translationRecognizer = new speechsdk.TranslationRecognizer(
        speechConfig,
        audioConfig
      );

      // Handle partial results
      translationRecognizer.recognizing = (_, event) => {
        if (event.result.reason === speechsdk.ResultReason.TranslatingSpeech) {
          socket.emit('partialTranscript', {
            original: event.result.text,
            translations: event.result.translations
          });
        }
      };

      // Handle final results
      translationRecognizer.recognized = (_, event) => {
        if (event.result.reason === speechsdk.ResultReason.TranslatedSpeech) {
          socket.emit('finalTranscript', {
            original: event.result.text,
            translations: event.result.translations
          });
        } else if (event.result.reason === speechsdk.ResultReason.NoMatch) {
          socket.emit('error', { message: 'No speech could be recognized.' });
        }
      };

      // Handle errors
      translationRecognizer.canceled = (_, event) => {
        if (event.reason === speechsdk.CancellationReason.Error) {
          socket.emit('error', { message: `Error: ${event.errorDetails}` });
        }
        cleanup();
      };

      // Start continuous recognition
      translationRecognizer.startContinuousRecognitionAsync(
        () => console.log('Recognition started'),
        (error) => {
          console.error('Error starting recognition:', error);
          socket.emit('error', { message: 'Error starting recognition' });
          cleanup();
        }
      );

      // Return the pushStream for audio data
      return pushStream;
    } catch (error) {
      console.error('Error initializing translation:', error);
      socket.emit('error', { message: 'Error initializing translation' });
      cleanup();
      return null;
    }
  };

  // Handle start translation request
  socket.on('startTranslation', (config: TranslationConfig) => {
    const pushStream = initializeTranslation(config);
    if (pushStream) {
      // Handle incoming audio data
      socket.on('audioData', (data: Buffer) => {
        pushStream.write(data);
      });
    }
  });

  // Handle stop translation request
  socket.on('stopTranslation', cleanup);
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Basic health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});
