
import React, { useRef } from 'react';
import type { Mode } from '../types';
import { UploadIcon, EditIcon, RulerIcon, SigmaIcon, ClearIcon, CheckCircleIcon, RefreshCwIcon } from './icons';

interface ControlPanelProps {
    mode: Mode;
    setMode: (mode: Mode) => void;
    bulletDiameter: number;
    setBulletDiameter: (value: number) => void;
    onImageUpload: (file: File) => void;
    onClearSelection: () => void;
    selectedCount: number;
    onSaveDefault: () => void;
    onResetDefault: () => void;
    hasImage: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
    mode,
    setMode,
    bulletDiameter,
    setBulletDiameter,
    onImageUpload,
    onClearSelection,
    selectedCount,
    onSaveDefault,
    onResetDefault,
    hasImage
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
                    Upload Scanned Target
                </button>
            </div>

            {/* <div className="space-y-3">
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
            </div> */}

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

            <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-400 uppercase">Startup Image</h3>
                <div className="flex flex-col space-y-2">
                    {hasImage && (
                        <button
                            onClick={onSaveDefault}
                            className="flex items-center justify-center p-2 rounded-md bg-gray-700 hover:bg-green-700 hover:text-white text-gray-300 transition-colors text-xs"
                            title="Save current image as the startup default"
                        >
                            <CheckCircleIcon className="w-4 h-4 mr-2" />
                            Set Current as Default
                        </button>
                    )}
                    <button
                        onClick={onResetDefault}
                        className="flex items-center justify-center p-2 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors text-xs"
                        title="Restore original factory image"
                    >
                        <RefreshCwIcon className="w-4 h-4 mr-2" />
                        Reset to Factory
                    </button>
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
