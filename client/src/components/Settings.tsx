import { useState, useEffect } from 'react';
import { SettingsProps, Language } from '../types';

const Settings: React.FC<SettingsProps> = ({ onThemeChange }) => {
  const [inputLanguage, setInputLanguage] = useState<string>(localStorage.getItem('inputLanguage') || 'en-US');
  const [outputLanguage, setOutputLanguage] = useState<string>(localStorage.getItem('outputLanguage') || 'yue');
  const [secondOutputLanguage, setSecondOutputLanguage] = useState<string>(localStorage.getItem('secondOutputLanguage') || '');
  const [theme, setTheme] = useState<string>(localStorage.getItem('theme') || 'dark');

  const languages: Language[] = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'yue', name: 'Cantonese' },
    { code: 'zh-Hans', name: 'Chinese (Simplified)' },
    { code: 'zh-Hant', name: 'Chinese (Traditional)' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
  ];

  useEffect(() => {
    localStorage.setItem('inputLanguage', inputLanguage);
    localStorage.setItem('outputLanguage', outputLanguage);
    localStorage.setItem('secondOutputLanguage', secondOutputLanguage);
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    onThemeChange(theme);
  }, [inputLanguage, outputLanguage, secondOutputLanguage, theme, onThemeChange]);

  return (
    <div className="settings-container">
      <div className="settings-group">
        <label>
          Input Language:
          <select value={inputLanguage} onChange={(e) => setInputLanguage(e.target.value)}>
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="settings-group">
        <label>
          Primary Output Language:
          <select value={outputLanguage} onChange={(e) => setOutputLanguage(e.target.value)}>
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="settings-group">
        <label>
          Secondary Output Language (Optional):
          <select 
            value={secondOutputLanguage} 
            onChange={(e) => setSecondOutputLanguage(e.target.value)}
          >
            <option value="">None</option>
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="settings-group">
        <label>
          Theme:
          <select value={theme} onChange={(e) => setTheme(e.target.value)}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
      </div>
    </div>
  );
};

export default Settings;
