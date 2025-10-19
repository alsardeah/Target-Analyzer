export interface Point {
  x: number;
  y: number;
}

export interface Circle extends Point {
  radius: number;
}

export type Mode = 'edit' | 'distance' | 'stddev';

export interface ToastMessage {
    message: string;
    type: 'success' | 'error' | 'info';
}

export interface GroupMetrics {
  stdDev: { x: number; y: number };
  meanRadius: number;
  extremeSpread: number;
}
