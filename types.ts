
export interface Circle {
    x: number;
    y: number;
    radius: number;
}

export interface Point {
    x: number;
    y: number;
}

export type Mode = 'edit' | 'distance' | 'stddev';

export interface ToastMessage {
    message: string;
    type: 'success' | 'error' | 'info';
}

export interface GroupMetrics {
    stdDev: {
        x: number;
        y: number;
    };
    meanRadius: number;
    extremeSpread: number;
    count: number;
}

export interface Pan {
    x: number;
    y: number;
}