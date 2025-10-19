import React from 'react';
import type { Mode, GroupMetrics } from '../types';

interface ResultsPanelProps {
    scale: number | null;
    distance: number | null;
    groupMetrics: GroupMetrics | null;
    bulletDiameter: number;
    selectedCount: number;
    mode: Mode;
    totalPoints: number;
}

const ResultRow: React.FC<{ label: string; value: string | null; unit?: string }> = ({ label, value, unit }) => {
    return (
        <div className="flex justify-between text-sm">
            <span className="text-gray-400">{label}</span>
            <span className="font-mono text-cyan-300">
                {value ?? '-'} {value !== null ? unit : ''}
            </span>
        </div>
    );
};

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
    scale,
    distance,
    groupMetrics,
    bulletDiameter,
    selectedCount,
    mode,
    totalPoints
}) => {
    const isCalibrated = scale !== null;

    const renderContent = () => {
        if (!isCalibrated) {
            return <p className="text-center text-sm text-yellow-400">Not Calibrated. Add or detect holes to automatically calibrate.</p>
        }

        const groupMetricsTitle = (mode === 'stddev' && selectedCount > 0) 
            ? `Group (${selectedCount} selected)`
            : `Group (${totalPoints} total)`;

        return (
            <div className="space-y-2">
                {/* Always show distance if it has been calculated */}
                {distance !== null && (
                    <div className="pb-2 mb-2 border-b border-gray-600">
                         <h4 className="text-xs font-semibold text-gray-400 uppercase text-center pb-1">Distance (2 selected)</h4>
                         <ResultRow label="Center Distance" value={distance.toFixed(2)} unit="mm" />
                         <ResultRow label="Edge Distance" value={Math.max(0, distance - bulletDiameter).toFixed(2)} unit="mm" />
                    </div>
                )}

                {/* Always show group metrics if they have been calculated */}
                {groupMetrics !== null && (
                    <div>
                        <h4 className="text-xs font-semibold text-gray-400 uppercase text-center pb-1">{groupMetricsTitle}</h4>
                        <ResultRow label="Extreme Spread" value={groupMetrics.extremeSpread.toFixed(2)} unit="mm" />
                        <ResultRow label="Mean Radius" value={groupMetrics.meanRadius.toFixed(2)} unit="mm" />
                        <ResultRow label="Std. Dev. (X)" value={groupMetrics.stdDev.x.toFixed(2)} unit="mm" />
                        <ResultRow label="Std. Dev. (Y)" value={groupMetrics.stdDev.y.toFixed(2)} unit="mm" />
                    </div>
                )}

                {/* Show a message if nothing is calculated yet */}
                {distance === null && groupMetrics === null && (
                    <p className="text-center text-sm text-gray-400 pt-2">
                        {mode === 'distance' && 'Select 2 points to measure distance.'}
                        {mode === 'stddev' && 'Select 2 or more points for group analysis.'}
                        {mode === 'edit' && (totalPoints < 2 ? 'At least 2 points needed for analysis.' : 'Analysis of all points shown here.')}
                    </p>
                )}
            </div>
        )
    };

    return (
        <div className="bg-gray-700 rounded-lg p-3 space-y-2">
            <h3 className="text-sm font-semibold text-gray-400 uppercase text-center border-b border-gray-600 pb-2 mb-2">Results</h3>
            <ResultRow label="Scale" value={scale ? `${scale.toFixed(2)}` : null} unit="px/mm" />
            <ResultRow label="Total Shots" value={totalPoints.toString()} />
            <div className="pt-2">
              {renderContent()}
            </div>
        </div>
    );
};