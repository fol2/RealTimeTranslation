import config from '../config';

export interface UserSettings {
  inputLanguage: string;
  outputLanguage: string;
  secondOutputLanguage: string;
  theme: 'light' | 'dark';
}

const STORAGE_KEY = 'user_settings';

export class SettingsService {
  private static instance: SettingsService;
  private currentSettings: UserSettings;

  private constructor() {
    // Load settings from localStorage or use defaults
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    this.currentSettings = savedSettings
      ? { ...this.getDefaultSettings(), ...JSON.parse(savedSettings) }
      : this.getDefaultSettings();
  }

  public static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  private getDefaultSettings(): UserSettings {
    return {
      inputLanguage: config.defaultSettings.inputLanguage,
      outputLanguage: config.defaultSettings.outputLanguage,
      secondOutputLanguage: config.defaultSettings.secondOutputLanguage,
      theme: config.ui.defaultTheme as 'light' | 'dark',
    };
  }

  public getSettings(): UserSettings {
    return { ...this.currentSettings };
  }

  public updateSettings(newSettings: Partial<UserSettings>): UserSettings {
    this.currentSettings = {
      ...this.currentSettings,
      ...newSettings,
    };
    
    // Persist to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentSettings));
    
    return { ...this.currentSettings };
  }

  public resetToDefaults(): UserSettings {
    this.currentSettings = this.getDefaultSettings();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentSettings));
    return { ...this.currentSettings };
  }
}
