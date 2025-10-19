import React, { useRef } from 'react';
import type { Mode } from '../types';
import { UploadIcon, EditIcon, RulerIcon, SigmaIcon, ClearIcon, RefreshCwIcon } from './icons';

interface HoughParams {
    sensitivity: number;
    minRadius: number;
    maxRadius: number;
}
interface ControlPanelProps {
    mode: Mode;
    setMode: (mode: Mode) => void;
    bulletDiameter: number;
    setBulletDiameter: (value: number) => void;
    onImageUpload: (file: File) => void;
    onClearSelection: () => void;
    selectedCount: number;
    houghParams: HoughParams;
    setHoughParams: (params: HoughParams) => void;
    onRedetect: () => void;
    isImageLoaded: boolean;
}

const ParamSlider: React.FC<{label: string, value: number, onChange: (val: number) => void, min: number, max: number, step: number}> = 
({ label, value, onChange, min, max, step }) => (
    <div className="flex flex-col space-y-1">
        <div className="flex justify-between text-xs text-gray-400">
            <span>{label}</span>
            <span className="font-mono">{value}</span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
        />
    </div>
);


export const ControlPanel: React.FC<ControlPanelProps> = ({
    mode,
    setMode,
    bulletDiameter,
    setBulletDiameter,
    onImageUpload,
    onClearSelection,
    selectedCount,
    houghParams,
    setHoughParams,
    onRedetect,
    isImageLoaded,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onImageUpload(e.target.files[0]);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const modes: { id: Mode; label: string; icon: React.ReactNode }[] = [
        { id: 'edit', label: 'Edit Points', icon: <EditIcon className="w-5 h-5" /> },
        { id: 'distance', label: 'Measure Distance', icon: <RulerIcon className="w-5 h-5" /> },
        { id: 'stddev', label: 'Group Analysis', icon: <SigmaIcon className="w-5 h-5" /> },
    ];

    return (
        <div className="flex flex-col space-y-6">
            <div>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                />
                <button
                    onClick={handleUploadClick}
                    className="w-full flex items-center justify-center bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200"
                >
                    <UploadIcon className="w-5 h-5 mr-2" />
                    Upload Image
                </button>
            </div>

            <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-400 uppercase">Settings</h3>
                <div className="flex flex-col space-y-2">
                    <label className="text-sm text-gray-300">Bullet Diameter (mm)</label>
                    <select
                        value={bulletDiameter}
                        onChange={(e) => setBulletDiameter(parseFloat(e.target.value))}
                        className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2"
                    >
                        <option value="9">9mm</option>
                        <option value="4.6">4.6mm</option>
                        <option value="5.56">5.56mm</option>
                        <option value="7.62">7.62mm</option>
                        <option value="12.7">12.7mm</option>
                    </select>
                </div>
            </div>

            {isImageLoaded && (
                <div className="space-y-3 p-3 bg-gray-700/50 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase">Detection Settings</h3>
                    <ParamSlider label="Sensitivity" value={houghParams.sensitivity} onChange={val => setHoughParams({...houghParams, sensitivity: val})} min={10} max={100} step={1} />
                    <ParamSlider label="Min Radius (px)" value={houghParams.minRadius} onChange={val => setHoughParams({...houghParams, minRadius: val})} min={1} max={50} step={1} />
                    <ParamSlider label="Max Radius (px)" value={houghParams.maxRadius} onChange={val => setHoughParams({...houghParams, maxRadius: val})} min={1} max={100} step={1} />
                    <button
                        onClick={onRedetect}
                        className="w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 mt-2"
                    >
                        <RefreshCwIcon className="w-5 h-5 mr-2" />
                        Re-detect Circles
                    </button>
                </div>
            )}

            <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-400 uppercase">Mode</h3>
                <div className="flex flex-col space-y-2">
                    {modes.map((m) => (
                        <button
                            key={m.id}
                            onClick={() => setMode(m.id)}
                            className={`flex items-center space-x-3 p-2 rounded-md transition-colors duration-200 ${
                                mode === m.id ? 'bg-cyan-500 text-white' : 'bg-gray-700 hover:bg-gray-600'
                            }`}
                        >
                            {m.icon}
                            <span>{m.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                {selectedCount > 0 && (
                     <button
                        onClick={onClearSelection}
                        className="w-full flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200"
                    >
                        <ClearIcon className="w-5 h-5 mr-2" />
                        Clear Selection
                    </button>
                )}
            </div>
        </div>
    );
};