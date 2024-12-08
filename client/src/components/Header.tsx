import React from 'react';
import { MicrophoneIcon, StopIcon, TrashIcon, CogIcon, MoonIcon, SunIcon } from '@heroicons/react/24/solid';
import { useTheme } from '../contexts/ThemeContext';

interface HeaderProps {
  isRecording: boolean;
  onToggleRecording: () => void;
  onClearHistory: () => void;
  onOpenSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ isRecording, onToggleRecording, onClearHistory, onOpenSettings }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-indigo-600 dark:bg-indigo-800 text-white p-4 sm:p-6 flex flex-wrap justify-between items-center transition-colors duration-300">
      <h1 className="text-2xl font-bold mb-4 sm:mb-0 w-full sm:w-auto">Real-Time Translator</h1>
      <div className="flex flex-wrap justify-center sm:justify-end space-x-2 sm:space-x-4 w-full sm:w-auto">
        <button
          onClick={onToggleRecording}
          className={`flex items-center space-x-2 px-3 py-2 rounded-full transition-all duration-300 transform hover:scale-105 ${
            isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          {isRecording ? (
            <>
              <StopIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Stop</span>
            </>
          ) : (
            <>
              <MicrophoneIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Start</span>
            </>
          )}
        </button>
        <button
          onClick={onClearHistory}
          className="flex items-center space-x-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded-full transition-all duration-300 transform hover:scale-105"
        >
          <TrashIcon className="h-5 w-5" />
          <span className="hidden sm:inline">Clear</span>
        </button>
        <button
          onClick={onOpenSettings}
          className="flex items-center space-x-2 px-3 py-2 bg-indigo-700 hover:bg-indigo-800 rounded-full transition-all duration-300 transform hover:scale-105"
        >
          <CogIcon className="h-5 w-5" />
          <span className="hidden sm:inline">Settings</span>
        </button>
        <button
          onClick={toggleTheme}
          className="flex items-center space-x-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded-full transition-all duration-300 transform hover:scale-105"
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? (
            <MoonIcon className="h-5 w-5" />
          ) : (
            <SunIcon className="h-5 w-5" />
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
