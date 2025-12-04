import React from 'react';
import { ZoomInIcon, ZoomOutIcon, ExpandIcon, FocusIcon } from './icons';

interface ZoomControlsProps {
    onZoomIn: () => void;
    onZoomOut: () => void;
    onZoomToFit: () => void;
    onZoomToSelection: () => void;
    selectionCount: number;
}

const ControlButton: React.FC<{ onClick: () => void; children: React.ReactNode; disabled?: boolean; title: string; }> = ({ onClick, children, disabled, title }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        className="p-2 bg-gray-700 hover:bg-cyan-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-white rounded-md transition-colors"
    >
        {children}
    </button>
);

export const ZoomControls: React.FC<ZoomControlsProps> = ({
    onZoomIn,
    onZoomOut,
    onZoomToFit,
    onZoomToSelection,
    selectionCount,
}) => {
    return (
        <div className="absolute bottom-4 right-4 z-10 flex flex-col space-y-2">
            <ControlButton onClick={onZoomIn} title="Zoom In">
                <ZoomInIcon className="w-5 h-5" />
            </ControlButton>
            <ControlButton onClick={onZoomOut} title="Zoom Out">
                <ZoomOutIcon className="w-5 h-5" />
            </ControlButton>
            <ControlButton onClick={onZoomToFit} title="Fit to Screen">
                <ExpandIcon className="w-5 h-5" />
            </ControlButton>
            <ControlButton 
                onClick={onZoomToSelection} 
                disabled={selectionCount === 0}
                title="Zoom to Selection"
            >
                <FocusIcon className="w-5 h-5" />
            </ControlButton>
        </div>
    );
};