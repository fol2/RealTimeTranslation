import React from 'react';
import { MicrophoneIcon, StopIcon, TrashIcon, CogIcon, MoonIcon, SunIcon, ClockIcon } from '@heroicons/react/24/solid';
import { useTheme } from '../contexts/ThemeContext';

interface HeaderProps {
  isRecording: boolean;
  onToggleRecording: () => void;
  onClearHistory: () => void;
  onOpenSettings: () => void;
  activeTab: 'transcription' | 'history';
  onTabChange: (tab: 'transcription' | 'history') => void;
}

const Header: React.FC<HeaderProps> = ({ 
  isRecording, 
  onToggleRecording, 
  onClearHistory, 
  onOpenSettings,
  activeTab,
  onTabChange 
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-indigo-600 dark:bg-indigo-800 text-white p-4 sm:p-6">
      <div className="flex flex-wrap justify-between items-center">
        <h1 className="text-2xl font-bold mb-4 sm:mb-0">Real-Time Translator</h1>
        <div className="flex flex-wrap justify-center sm:justify-end space-x-2 sm:space-x-4">
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
            className="flex items-center space-x-2 px-3 py-2 bg-indigo-700 hover:bg-indigo-800 rounded-full transition-all duration-300 transform hover:scale-105"
          >
            {theme === 'dark' ? (
              <SunIcon className="h-5 w-5" />
            ) : (
              <MoonIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
      
      <div className="mt-4 flex space-x-4 border-b border-indigo-500">
        <button
          onClick={() => onTabChange('transcription')}
          className={`px-4 py-2 focus:outline-none ${
            activeTab === 'transcription'
              ? 'border-b-2 border-white font-semibold'
              : 'text-indigo-200 hover:text-white'
          }`}
        >
          Transcription
        </button>
        <button
          onClick={() => onTabChange('history')}
          className={`px-4 py-2 focus:outline-none flex items-center space-x-2 ${
            activeTab === 'history'
              ? 'border-b-2 border-white font-semibold'
              : 'text-indigo-200 hover:text-white'
          }`}
        >
          <ClockIcon className="h-5 w-5" />
          <span>History</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
