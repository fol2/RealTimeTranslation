export interface TranscriptEntry {
  original: string;
  translations: Record<string, string>;
  type: 'partial' | 'final';
}

export interface RecorderProps {
  socket: any; // Replace with proper Socket.io type
  onError: (message: string) => void;
}

export interface TranscriptProps {
  transcripts: TranscriptEntry[];
}

export interface SettingsProps {
  onThemeChange: (theme: string) => void;
}

export interface Language {
  code: string;
  name: string;
}
