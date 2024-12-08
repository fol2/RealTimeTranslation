import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';
import config from '../config';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  initialSettings: {
    inputLanguage: string;
    outputLanguage: string;
    secondOutputLanguage: string;
  };
  onUpdate: (settings: {
    inputLanguage: string;
    outputLanguage: string;
    secondOutputLanguage: string;
  }) => void;
}

const getLanguageDisplayName = (lang: typeof config.languages[number]): string => {
  // For English languages, just show the English name
  if (lang.code.startsWith('en')) {
    return lang.name;
  }
  // For other languages, show both English and native names
  return `${lang.name} (${lang.nativeName})`;
};

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose, initialSettings, onUpdate }) => {
  const [inputLanguage, setInputLanguage] = useState(initialSettings.inputLanguage);
  const [outputLanguage, setOutputLanguage] = useState(initialSettings.outputLanguage);
  const [secondOutputLanguage, setSecondOutputLanguage] = useState(initialSettings.secondOutputLanguage);

  useEffect(() => {
    setInputLanguage(initialSettings.inputLanguage);
    setOutputLanguage(initialSettings.outputLanguage);
    setSecondOutputLanguage(initialSettings.secondOutputLanguage);
  }, [initialSettings]);

  const handleSave = () => {
    onUpdate({
      inputLanguage,
      outputLanguage,
      secondOutputLanguage
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">Settings</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-300">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Input Language
                </label>
                <select
                  value={inputLanguage}
                  onChange={(e) => setInputLanguage(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  {config.languages.filter(lang => lang.code !== '').map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {getLanguageDisplayName(lang)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Primary Translation Language
                </label>
                <select
                  value={outputLanguage}
                  onChange={(e) => setOutputLanguage(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  {config.languages.filter(lang => lang.code !== '').map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {getLanguageDisplayName(lang)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Secondary Translation Language (Optional)
                </label>
                <select
                  value={secondOutputLanguage}
                  onChange={(e) => setSecondOutputLanguage(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  {config.languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.code === '' ? 'None' : getLanguageDisplayName(lang)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Settings;
