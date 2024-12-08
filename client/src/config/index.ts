/**
 * Application configuration
 * All environment variables are prefixed with VITE_ to be exposed to the client
 */
export const config = {
  server: {
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:38221',
    wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:38221',
  },
  
  defaultSettings: {
    inputLanguage: import.meta.env.VITE_DEFAULT_INPUT_LANGUAGE || 'en-US',
    outputLanguage: import.meta.env.VITE_DEFAULT_OUTPUT_LANGUAGE || 'yue',
    secondOutputLanguage: import.meta.env.VITE_DEFAULT_SECOND_OUTPUT_LANGUAGE || '',
  },

  ui: {
    appName: import.meta.env.VITE_APP_NAME || 'Real Time Translation',
    defaultTheme: import.meta.env.VITE_DEFAULT_THEME || 'light',
  },

  // Supported languages configuration
  languages: [
    { code: '', name: 'None' },
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'es-ES', name: 'Spanish' },
    { code: 'fr-FR', name: 'French' },
    { code: 'de-DE', name: 'German' },
    { code: 'it-IT', name: 'Italian' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)' },
    { code: 'ru-RU', name: 'Russian' },
    { code: 'zh-CN', name: 'Chinese (Simplified)' },
    { code: 'zh-HK', name: 'Chinese (Hong Kong)' },
    { code: 'yue', name: 'Cantonese' },
    { code: 'ja-JP', name: 'Japanese' },
    { code: 'ko-KR', name: 'Korean' },
  ] as const,
} as const;

// Type for language codes
export type LanguageCode = typeof config.languages[number]['code'];

// Utility function to validate language code
export function isValidLanguage(code: string): code is LanguageCode {
  return config.languages.some(lang => lang.code === code);
}

// Export default configuration
export default config;
