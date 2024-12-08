import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import TranscriptBox from './components/TranscriptBox';
import Settings from './components/Settings';
import { TranscriptEntry } from './types';
import { ThemeProvider } from './contexts/ThemeContext';
import { AzureSpeechService } from './services/azureSpeech';
import { SettingsService } from './services/settings';
import config from './config';

const App: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get settings service instance
  const settingsService = SettingsService.getInstance();
  const initialSettings = settingsService.getSettings();
  
  // Language settings initialized from stored settings
  const [inputLanguage, setInputLanguage] = useState(initialSettings.inputLanguage);
  const [outputLanguage, setOutputLanguage] = useState(initialSettings.outputLanguage);
  const [secondOutputLanguage, setSecondOutputLanguage] = useState(initialSettings.secondOutputLanguage);

  const speechServiceRef = useRef<AzureSpeechService | null>(null);

  useEffect(() => {
    // Initialize speech service
    speechServiceRef.current = new AzureSpeechService(
      // Interim results
      (original, translations) => {
        setTranscripts(prev => {
          const newTranscripts = [...prev];
          // Update the last transcript if it's interim, or add a new one
          if (newTranscripts.length > 0) {
            newTranscripts[newTranscripts.length - 1] = { original, translations };
          } else {
            newTranscripts.push({ original, translations });
          }
          return newTranscripts;
        });
      },
      // Final results
      (original, translations) => {
        setTranscripts(prev => [...prev, { original, translations }]);
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
  }, []);

  const toggleRecording = async () => {
    if (!speechServiceRef.current) return;

    if (!isRecording) {
      try {
        await speechServiceRef.current.startTranslation({
          inputLanguage,
          outputLanguage,
          secondOutputLanguage: secondOutputLanguage || undefined
        });
        setIsRecording(true);
        setError(null);
      } catch (error) {
        setError(error.message);
      }
    } else {
      await speechServiceRef.current.stopTranslation();
      setIsRecording(false);
    }
  };

  const clearHistory = () => {
    setTranscripts([]);
    setError(null);
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
      toggleRecording();
    }
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 p-4 sm:p-8 transition-colors duration-300">
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden transition-colors duration-300">
          <Header 
            isRecording={isRecording} 
            onToggleRecording={toggleRecording}
            onClearHistory={clearHistory}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
          {error && (
            <div className="px-6 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100">
              {error}
            </div>
          )}
          <TranscriptBox transcripts={transcripts} />
        </div>
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
      </div>
    </ThemeProvider>
  );
};

export default App;
