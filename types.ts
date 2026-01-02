export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface WorkSession {
  id: string;
  startTime: number; // Timestamp
  endTime: number | null; // Timestamp, null if currently active
  durationMinutes: number; // Calculated on close
}

export interface UserSettings {
  workLocation: Coordinates | null;
  radiusMeters: number;
  autoLog: boolean; // If true, tries to toggle state based on location
}

export enum AppTab {
  TRACKER = 'TRACKER',
  REPORTS = 'REPORTS',
  SETTINGS = 'SETTINGS'
}
