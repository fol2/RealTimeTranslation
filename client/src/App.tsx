import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import TranscriptBox from './components/TranscriptBox';
import Settings from './components/Settings';
import History from './components/History';
import { TranscriptEntry, RecordingSession } from './types';
import { ThemeProvider } from './contexts/ThemeContext';
import { AzureSpeechService } from './services/azureSpeech';
import { SettingsService } from './services/settings';

const App: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'transcription' | 'history'>('transcription');
  
  // Get settings service instance
  const settingsService = SettingsService.getInstance();
  const initialSettings = settingsService.getSettings();
  
  // Language settings initialized from stored settings
  const [inputLanguage, setInputLanguage] = useState(initialSettings.inputLanguage);
  const [outputLanguage, setOutputLanguage] = useState(initialSettings.outputLanguage);
  const [secondOutputLanguage, setSecondOutputLanguage] = useState(initialSettings.secondOutputLanguage);

  const speechServiceRef = useRef<AzureSpeechService | null>(null);

  useEffect(() => {
    const saveTranscriptsToHistory = () => {
      const currentSessionId = localStorage.getItem('currentSessionId');
      if (!currentSessionId) return;

      const storedHistory = localStorage.getItem('transcriptionHistory');
      const history: RecordingSession[] = storedHistory ? JSON.parse(storedHistory) : [];
      const existingSessionIndex = history.findIndex(
        (session) => session.sessionId === currentSessionId
      );

      // Get only the finalized transcripts that haven't been saved yet
      const unsavedTranscripts = transcripts.filter(t => t.isFinal && !t.isSaved);
      if (unsavedTranscripts.length === 0) return;

      // Map the transcripts to be saved to the required format
      const transcriptsToSave = unsavedTranscripts.map(t => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: t.timestamp || new Date().toISOString(),
        originalText: t.original,
        translatedText: t.translations[0] || '',
        sourceLanguage: t.sourceLanguage || inputLanguage,
        targetLanguage: outputLanguage
      }));

      if (existingSessionIndex !== -1) {
        // Update existing session
        history[existingSessionIndex].transcriptions = [
          ...history[existingSessionIndex].transcriptions,
          ...transcriptsToSave
        ];
      } else {
        // Create new session
        history.unshift({
          sessionId: currentSessionId,
          timestamp: new Date().toISOString(),
          transcriptions: transcriptsToSave
        });
      }

      localStorage.setItem('transcriptionHistory', JSON.stringify(history));

      // Mark transcripts as saved
      setTranscripts(prev =>
        prev.map(t => (t.isFinal && !t.isSaved ? { ...t, isSaved: true } : t))
      );
    };

    // Save transcripts whenever a new finalized transcript is added
    const hasUnsavedFinalTranscript = transcripts.some(t => t.isFinal && !t.isSaved);
    if (hasUnsavedFinalTranscript) {
      saveTranscriptsToHistory();
    }

    // Save when recording stops
    if (!isRecording && transcripts.length > 0) {
      saveTranscriptsToHistory();
    }

    window.addEventListener('beforeunload', saveTranscriptsToHistory);

    return () => {
      window.removeEventListener('beforeunload', saveTranscriptsToHistory);
    };
  }, [isRecording, transcripts, inputLanguage, outputLanguage]);

  useEffect(() => {
    // Initialize speech service
    speechServiceRef.current = new AzureSpeechService(
      // Interim results
      (original, translations, detectedLanguage) => {
        setTranscripts(prev => {
          const updatedTranscripts = [...prev];
          // Find any existing interim transcript
          const interimIndex = updatedTranscripts.findIndex(t => !t.isFinal);
          
          const newTranscript = {
            original,
            translations: translations || [],
            isFinal: false,
            isSaved: false,
            timestamp: new Date().toISOString(),
            sourceLanguage: detectedLanguage || inputLanguage,
            targetLanguage: outputLanguage
          };

          if (interimIndex !== -1) {
            // Update existing interim transcript
            updatedTranscripts[interimIndex] = newTranscript;
          } else {
            // Add new interim transcript
            updatedTranscripts.push(newTranscript);
          }
          
          return updatedTranscripts;
        });
      },
      // Final results
      (original, translations, detectedLanguage) => {
        setTranscripts(prev => {
          const updatedTranscripts = [...prev];
          // Find any existing interim transcript
          const interimIndex = updatedTranscripts.findIndex(t => !t.isFinal);
          
          const finalTranscript = {
            original,
            translations: translations || [],
            isFinal: true,
            isSaved: false,
            timestamp: new Date().toISOString(),
            sourceLanguage: detectedLanguage || inputLanguage,
            targetLanguage: outputLanguage
          };

          if (interimIndex !== -1) {
            // Replace interim with final
            updatedTranscripts[interimIndex] = finalTranscript;
          } else {
            // Add new final transcript
            updatedTranscripts.push(finalTranscript);
          }
          
          return updatedTranscripts;
        });
      },
      // Error handling
      (error) => {
        setError(error);
        setIsRecording(false);
      }
    );

    return () => {
      if (speechServiceRef.current) {
        speechServiceRef.current.stopTranslation();
      }
    };
  }, [inputLanguage, outputLanguage]);

  const handleToggleRecording = async () => {
    if (!speechServiceRef.current) return;

    if (!isRecording) {
      try {
        // Create new recording session before starting
        const sessionId = Date.now().toString();
        localStorage.setItem('currentSessionId', sessionId);
        
        await speechServiceRef.current.startTranslation({
          inputLanguage,
          outputLanguage,
          secondOutputLanguage
        });
        setIsRecording(true);
        setError(null);
      } catch (err) {
        setError('Failed to start recording. Please check your microphone access.');
        console.error('Error starting recording:', err);
        // Clean up session ID if start fails
        localStorage.removeItem('currentSessionId');
      }
    } else {
      try {
        await speechServiceRef.current.stopTranslation();
        setIsRecording(false);
        
        // Clear current session after stopping
        localStorage.removeItem('currentSessionId');
      } catch (err) {
        setError('Failed to stop recording.');
        console.error('Error stopping recording:', err);
      }
    }
  };

  const handleClearTranscripts = () => {
    setTranscripts([]);
  };

  const handleSettingsUpdate = (settings: { 
    inputLanguage: string; 
    outputLanguage: string; 
    secondOutputLanguage: string; 
  }) => {
    // Update local state
    setInputLanguage(settings.inputLanguage);
    setOutputLanguage(settings.outputLanguage);
    setSecondOutputLanguage(settings.secondOutputLanguage);
    
    // Persist settings
    settingsService.updateSettings(settings);
    
    // Stop recording if it's active
    if (isRecording) {
      handleToggleRecording();
    }
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
        <Header
          isRecording={isRecording}
          onToggleRecording={handleToggleRecording}
          onClearHistory={handleClearTranscripts}
          onOpenSettings={() => setIsSettingsOpen(true)}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        
        <main className="container mx-auto px-4 py-8">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              {error}
            </div>
          )}
          
          {activeTab === 'transcription' ? (
            <TranscriptBox
              transcripts={transcripts}
              outputLanguage={outputLanguage}
              secondOutputLanguage={secondOutputLanguage}
            />
          ) : (
            <History />
          )}
        </main>

        {isSettingsOpen && (
          <Settings
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            initialSettings={{
              inputLanguage,
              outputLanguage,
              secondOutputLanguage
            }}
            onUpdate={handleSettingsUpdate}
          />
        )}
      </div>
    </ThemeProvider>
  );
};

export default App;
