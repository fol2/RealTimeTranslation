// Current transcript entry (for live transcription)
export interface TranscriptEntry {
  original: string;
  translations: string[];
  isFinal: boolean;
  timestamp?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  isSaved?: boolean; // Add this line
}

// Historical transcript record
export interface TranscriptionRecord {
  id: string;
  timestamp: string;
  originalText: string;
  translatedTexts: string[]; // Change to an array
  sourceLanguage: string;
  targetLanguages: string[]; // Change to an array
}

// Recording session
export interface RecordingSession {
  sessionId: string;
  timestamp: string;
  transcriptions: TranscriptionRecord[];
}