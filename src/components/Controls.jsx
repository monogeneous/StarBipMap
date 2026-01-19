import React from 'react';
import { Download, Grid, RotateCw, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

const Controls = ({ settings, updateSettings, onDownload }) => {
    return (
        <div className="w-full max-w-md mx-auto p-4 flex flex-col gap-6 bg-space-800/50 backdrop-blur-sm rounded-xl border border-white/10 shadow-xl">

            {/* Grid Toggle */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Grid size={20} className="text-cyan-400" />
                    <span className="text-gray-200 font-medium">Show Grid</span>
                </div>
                <button
                    onClick={() => updateSettings({ showGrid: !settings.showGrid })}
                    className={`w-12 h-6 rounded-full transition-colors duration-300 relative ${settings.showGrid ? 'bg-cyan-600' : 'bg-gray-700'
                        }`}
                >
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${settings.showGrid ? 'translate-x-6' : 'translate-x-0'
                        }`} />
                </button>
            </div>

            {/* Grid Mode Toggle (New) */}
            {settings.showGrid && (
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Grid Type</span>
                    <div className="flex bg-gray-700/50 rounded-lg p-1">
                        <button
                            onClick={() => updateSettings({ gridMode: 'simple' })}
                            className={`px-3 py-1 rounded-md transition-all ${settings.gridMode === 'simple'
                                ? 'bg-cyan-600 text-white shadow-sm'
                                : 'text-gray-400 hover:text-gray-200'
                                }`}
                        >
                            Simple
                        </button>
                        <button
                            onClick={() => updateSettings({ gridMode: 'full' })}
                            className={`px-3 py-1 rounded-md transition-all ${settings.gridMode === 'full'
                                ? 'bg-cyan-600 text-white shadow-sm'
                                : 'text-gray-400 hover:text-gray-200'
                                }`}
                        >
                            Full
                        </button>
                    </div>
                </div>
            )}

            {/* Rotation Slider */}
            <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                        <RotateCw size={16} />
                        <span>Rotation</span>
                    </div>
                    <span>{settings.rotation}°</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="360"
                    step="30"
                    value={settings.rotation}
                    onChange={(e) => updateSettings({ rotation: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
            </div>

            {/* Zoom Controls */}
            <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                        <ZoomIn size={16} />
                        <span>Zoom</span>
                    </div>
                    <span>{Math.round((settings.zoom || 1) * 100)}%</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => updateSettings({ zoom: Math.max(0.5, (settings.zoom || 1) - 0.1) })}
                        className="p-1.5 rounded-lg bg-gray-700/50 hover:bg-gray-600 text-gray-300 transition-colors"
                        title="Zoom Out"
                    >
                        <ZoomOut size={16} />
                    </button>

                    <input
                        type="range"
                        min="0.5"
                        max="3"
                        step="0.1"
                        value={settings.zoom || 1}
                        onChange={(e) => updateSettings({ zoom: parseFloat(e.target.value) })}
                        className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />

                    <button
                        onClick={() => updateSettings({ zoom: Math.min(3, (settings.zoom || 1) + 0.1) })}
                        className="p-1.5 rounded-lg bg-gray-700/50 hover:bg-gray-600 text-gray-300 transition-colors"
                        title="Zoom In"
                    >
                        <ZoomIn size={16} />
                    </button>

                    <button
                        onClick={() => updateSettings({ zoom: 1 })}
                        className="p-1.5 rounded-lg bg-gray-700/50 hover:bg-gray-600 text-gray-300 transition-colors ml-1"
                        title="Reset Zoom"
                    >
                        <RotateCcw size={14} />
                    </button>
                </div>
            </div>

            {/* Download Button */}
            <button
                onClick={onDownload}
                className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg shadow-lg transition-all active:scale-95"
            >
                <Download size={20} />
                <span>Download Star Map</span>
            </button>

        </div>
    );
};

export default Controls;
