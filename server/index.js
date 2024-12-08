require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const sdk = require('microsoft-cognitiveservices-speech-sdk');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // In production, replace with your frontend URL
    methods: ["GET", "POST"]
  }
});

// Store active translation recognizers
const activeRecognizers = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('startTranslation', async (config) => {
    try {
      const speechConfig = sdk.SpeechTranslationConfig.fromSubscription(
        process.env.SPEECH_KEY,
        process.env.SPEECH_REGION
      );

      // Configure speech recognition
      speechConfig.speechRecognitionLanguage = config.inputLanguage || 'en-US';
      
      // Add target languages
      if (config.outputLanguage) {
        speechConfig.addTargetLanguage(config.outputLanguage);
      }
      if (config.secondOutputLanguage) {
        speechConfig.addTargetLanguage(config.secondOutputLanguage);
      }

      // Create the push stream for audio data
      const pushStream = sdk.AudioInputStream.createPushStream();
      const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);

      // Create the translation recognizer
      const recognizer = new sdk.TranslationRecognizer(speechConfig, audioConfig);

      // Handle partial results
      recognizer.recognizing = (s, e) => {
        if (e.result.reason === sdk.ResultReason.TranslatingSpeech) {
          socket.emit('partialTranscript', {
            original: e.result.text,
            translations: e.result.translations
          });
        }
      };

      // Handle final results
      recognizer.recognized = (s, e) => {
        if (e.result.reason === sdk.ResultReason.TranslatedSpeech) {
          socket.emit('finalTranscript', {
            original: e.result.text,
            translations: e.result.translations
          });
        }
      };

      // Handle errors
      recognizer.canceled = (s, e) => {
        if (e.reason === sdk.CancellationReason.Error) {
          socket.emit('error', {
            message: `Error: ${e.errorDetails}`
          });
        }
        stopRecognition(socket.id);
      };

      // Start continuous recognition
      recognizer.startContinuousRecognitionAsync(
        () => {
          console.log('Recognition started');
          socket.emit('recognitionStarted');
        },
        (err) => {
          console.error('Error starting recognition:', err);
          socket.emit('error', { message: 'Failed to start recognition' });
        }
      );

      // Store the recognizer and push stream
      activeRecognizers.set(socket.id, {
        recognizer,
        pushStream
      });

      // Handle incoming audio data
      socket.on('audioData', (data) => {
        const active = activeRecognizers.get(socket.id);
        if (active && active.pushStream) {
          active.pushStream.write(data);
        }
      });

    } catch (error) {
      console.error('Error setting up translation:', error);
      socket.emit('error', { message: 'Failed to setup translation' });
    }
  });

  // Handle stop translation request
  socket.on('stopTranslation', () => {
    stopRecognition(socket.id);
  });

  // Clean up on disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    stopRecognition(socket.id);
  });
});

// Helper function to stop recognition
function stopRecognition(socketId) {
  const active = activeRecognizers.get(socketId);
  if (active) {
    const { recognizer, pushStream } = active;
    recognizer.stopContinuousRecognitionAsync(
      () => {
        console.log('Recognition stopped');
        pushStream.close();
        activeRecognizers.delete(socketId);
      },
      (err) => console.error('Error stopping recognition:', err)
    );
  }
}

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const port = process.env.PORT || 3001;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
