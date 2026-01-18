export interface CameraState {
  azimuth: number;   // 0-360 degrees
  elevation: number; // -90 to 90 degrees
  distance: number;  // 0.5 to 2.0 (relative scale)
}

export interface PromptParts {
  view: string;
  angle: string;
  shot: string;
}

export enum GenerationStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}