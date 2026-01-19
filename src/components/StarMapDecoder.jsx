import React, { useState, useRef, useEffect, useMemo } from 'react';
import { wordlist } from '../utils/bip39';
import { zodiacConstellations } from '../utils/zodiacData';
import StarMapGrid from './StarMapGrid';
import StarMapZodiacRing from './StarMapZodiacRing';
import StarShape from './StarShape';

const StarMapDecoder = ({ onRecover }) => {
    const [image, setImage] = useState(null);
    const [imageOpacity, setImageOpacity] = useState(1.0); // Default 100%
    const [calibration, setCalibration] = useState({
        scale: 1,
        rotation: 0,
        x: 0,
        y: 0,
        sensitivity: 50, // New: Threshold for detection (0-100)
        wordCount: 12, // 12 or 24
        startSectorOffset: 0 // Which sector is "Word 0" (Aries)? 0-11
    });

    const zodiacLabels = [
        "ARIES", "TAURUS", "GEMINI", "CANCER",
        "LEO", "VIRGO", "LIBRA", "SCORPIO",
        "SAGITTARIUS", "CAPRICORN", "AQUARIUS", "PISCES"
    ];

    const [decodedResult, setDecodedResult] = useState(null);
    const [isScanning, setIsScanning] = useState(false);

    // Scanned Bit State: Array(12/24) of Array(11) of boolean
    const [bitGrid, setBitGrid] = useState([]);

    // Reset bitGrid when wordCount changes
    useEffect(() => {
        setBitGrid(prev => {
            const newGrid = Array(calibration.wordCount).fill(0).map(() => Array(11).fill(false));
            return newGrid;
        });
        setDecodedResult(null);
    }, [calibration.wordCount]);

    // Re-calculate Words whenever Input BitGrid changes
    useEffect(() => {
        if (!bitGrid || bitGrid.length === 0) return;
        const words = [];
        bitGrid.forEach((wordBits) => {
            let bitMask = 0;
            wordBits.forEach((isOn, bitIndex) => {
                if (isOn) bitMask |= (1 << bitIndex);
            });
            if (bitMask >= 0 && bitMask < 2048) {
                words.push(wordlist[bitMask]);
            } else {
                words.push("???"); // Should not happen with 11 bits unless > 2047, which is barely possible (max 2047)
            }
        });
        setDecodedResult(words);
    }, [bitGrid]);

    const toggleBit = (wIndex, bIndex) => {
        setBitGrid(prev => {
            const newGrid = [...prev];
            // Deep copy row to be safe (though strictly not needed if we replace array)
            const newRow = [...newGrid[wIndex]];
            newRow[bIndex] = !newRow[bIndex];
            newGrid[wIndex] = newRow;
            return newGrid;
        });
    };

    // Canvas references
    const canvasRef = useRef(null);
    const imageContainerRef = useRef(null);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    // Force Image to 1024px Width
                    const targetWidth = 1024;
                    const aspect = img.height / img.width;
                    const targetHeight = targetWidth * aspect;

                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = targetWidth;
                    tempCanvas.height = targetHeight;
                    const ctx = tempCanvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

                    const resizedDataUrl = tempCanvas.toDataURL('image/png'); // Force PNG for quality

                    // Auto-Scale to 1x by default (Since it's now 1024px)
                    setImage(resizedDataUrl);
                    setCalibration(prev => ({
                        ...prev,
                        scale: 1,
                        x: 0,
                        y: 0,
                        rotation: 0
                    }));
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    };

    // --- GEOMETRY CONSTANTS (Must match StarMap.jsx) ---
    const rings = 11;
    const maxRadius = 100; // Relative units
    const innerRadius = 35;
    const step = (maxRadius - innerRadius) / (rings - 1);

    // --- CALIBRATION HANDLERS ---
    const updateCal = (key, value) => setCalibration(prev => ({ ...prev, [key]: value }));

    // --- SCANNING ALGORITHM ---
    const performScan = () => {
        if (!image || !canvasRef.current || !imageContainerRef.current) return;
        setIsScanning(true);

        // Allow UI to update before heavy processing
        setTimeout(() => {
            try {
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');
                const container = imageContainerRef.current;
                const width = container.offsetWidth;
                const height = container.offsetHeight;

                // 1. Setup Canvas to match Container visual size
                canvas.width = width;
                canvas.height = height;
                ctx.clearRect(0, 0, width, height);

                // 2. Draw Image with Calibration Transforms
                ctx.save();
                ctx.translate(width / 2, height / 2); // Move origin to center

                // User Calibration Transforms
                ctx.translate(calibration.x, calibration.y);
                ctx.scale(calibration.scale, calibration.scale);
                ctx.rotate(calibration.rotation * Math.PI / 180);

                // Draw Image Centered at origin
                const imgObj = new Image();
                imgObj.src = image;
                ctx.drawImage(imgObj, -imgObj.width / 2, -imgObj.height / 2);

                ctx.restore();

                // 3. Scan Pixels at Grid Coordinates
                // The Grid Overlay is defined as viewBox="-115 -115 230 230"
                // So the overlay's logical width is 230 units.
                // This overlay fills the container (width/height).
                // So Logic Unit 1 = (ContainerWidth / 230) pixels.

                // Use minimum dimension to respect "contain" aspect ratio of SVG usually,
                // but here SVG has className="w-full h-full", which might stretch if not square.
                // Assuming square container (aspect-square in Tailwind).

                const logicToPixel = width / 230;
                const cx = width / 2;
                const cy = height / 2;

                const words = [];
                const totalWords = calibration.wordCount;
                const sectorAngle = 360 / totalWords;
                const gridPhaseOffset = totalWords > 12 ? 7.5 : 0;

                const newBitGrid = Array(totalWords).fill(0).map(() => Array(rings).fill(false));

                for (let w = 0; w < totalWords; w++) {
                    // Base Angle calculation with Phase Offset
                    const baseAngle = (w * sectorAngle) + gridPhaseOffset;

                    // Fixed Scan: Word 0 is ALWAYS at Grid Start (Top)
                    // The user manually aligns the image so that the target "Word 0" starts at the top.
                    // The Zodiac Selector is purely visual helper.


                    for (let bit = 0; bit < rings; bit++) {
                        // FIX: Scan at the CENTER of the cell (between rings), not on the ring line.
                        // StarMap Generator uses: r = getRadius(bit) + (step / 2) + jitter
                        const r_logic = innerRadius + bit * step + (step / 2);

                        // StarMap Logic: angle 0 is TOP (-90 deg from 3 o'clock)
                        const renderAngle = baseAngle;
                        const rad = ((renderAngle - 90) * Math.PI) / 180;

                        const sx = cx + (r_logic * Math.cos(rad)) * logicToPixel;
                        const sy = cy + (r_logic * Math.sin(rad)) * logicToPixel;

                        // Revised Scanning Logic: Local Contrast (Peak Detection)
                        // This filters out "fog" (broad glow) and only keeps sharp stars.

                        let maxSignal = 0;
                        let bgTotal = 0;
                        let bgCount = 0;

                        const signalR = 2; // Inner radius for Star
                        const noiseR = 6;  // Outer radius for Background context

                        if (sx >= noiseR && sx < width - noiseR && sy >= noiseR && sy < height - noiseR) {
                            // 1. Scan Inner "Signal" (Max Brightness)
                            const signalData = ctx.getImageData(Math.floor(sx - signalR), Math.floor(sy - signalR), signalR * 2 + 1, signalR * 2 + 1).data;
                            for (let i = 0; i < signalData.length; i += 4) {
                                const val = Math.max(signalData[i], signalData[i + 1], signalData[i + 2]);
                                if (val > maxSignal) maxSignal = val;
                            }

                            // 2. Scan Outer "Background" (Average Brightness) - strictly rudimentary sampling to save perf
                            // Just sample 4 points at noiseR
                            const offsets = [[-noiseR, 0], [noiseR, 0], [0, -noiseR], [0, noiseR], [-noiseR, -noiseR], [noiseR, noiseR]];
                            offsets.forEach(([ox, oy]) => {
                                const p = ctx.getImageData(Math.floor(sx + ox), Math.floor(sy + oy), 1, 1).data;
                                const val = Math.max(p[0], p[1], p[2]);
                                bgTotal += val;
                                bgCount++;
                            });
                        }

                        const avgBg = bgCount > 0 ? bgTotal / bgCount : 0;

                        // THRESHOLD LOGIC:
                        // Star must be brighter than background by 'Sensitivity' amount.
                        // Sensitivity 0 = Needs to be barely brighter.
                        // Sensitivity 100 = Needs to be much brighter.
                        // However, user "Sensitivity" usually means "Easier to detect".
                        // So let's flip: High Sensitivity = Low Threshold.
                        // Threshold = (100 - calibration.sensitivity) + 20; 

                        const thresh = Math.max(15, (100 - calibration.sensitivity) * 1.5);

                        // Also must have absolute brightness > 40 to avoid detecting noise in pitch black areas
                        if (maxSignal > 40 && (maxSignal - avgBg) > thresh) {
                            newBitGrid[w][bit] = true;
                        }
                    }
                }
                setBitGrid(newBitGrid);
                // Words are derived via useEffect
            } catch (err) {
                console.error(err);
                alert("Error scanning image: " + err.message);
            } finally {
                setIsScanning(false);
            }
        }, 100);
    };

    // Removed inline StarShape
    // Imported StarShape used instead

    // Helper for rendering Zodiac Constellation
    const activeZodiacData = useMemo(() => {
        return zodiacConstellations[calibration.startSectorOffset];
    }, [calibration.startSectorOffset]);

    return (
        <div className="relative w-full h-[calc(100vh-100px)] flex items-center justify-center overflow-hidden animate-fade-in">
            {/* 1. INITIAL UPLOAD STATE (Nudged up) */}
            {!image && (
                <div className="z-10 -translate-y-20 flex flex-col items-center justify-center p-12 border-2 border-dashed border-white/20 rounded-3xl bg-black/20 backdrop-blur-md hover:border-cyan-400/50 transition-all cursor-pointer group"
                    onClick={() => document.getElementById('file-upload').click()}>
                    <input type="file" id="file-upload" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">📂</div>
                    <h3 className="text-2xl font-bold text-white mb-2">Upload Star Map</h3>
                    <p className="text-gray-400">Click or Drag & Drop to begin recovery</p>
                </div>
            )}

            {/* 2. IMMERSIVE WORKSPACE */}
            {image && (
                <>
                    {/* CENTER STAGE: The Map (Nudged up from center) */}
                    <div className="relative w-[80vh] aspect-square max-w-[85vw] flex items-center justify-center transition-all duration-300 -translate-y-12 lg:-translate-y-16">
                        {/* Scale Container to fit */}
                        <div className="w-full h-full relative group shadow-2xl rounded-full overflow-hidden ring-1 ring-white/10">

                            {/* User Image Layer */}
                            <div className="absolute inset-0 flex items-center justify-center overflow-hidden" ref={imageContainerRef}>
                                <img
                                    src={image}
                                    alt="Uploaded"
                                    className="max-w-none origin-center"
                                    style={{
                                        transform: `
                                            translate(${calibration.x}px, ${calibration.y}px)
                                            scale(${calibration.scale}) 
                                            rotate(${calibration.rotation}deg)
                                        `,
                                        opacity: imageOpacity
                                    }}
                                />
                            </div>

                            {/* Grid Overlay Layer */}
                            <div className="absolute inset-0 pointer-events-none opacity-80 mix-blend-screen">
                                <svg viewBox="-160 -160 320 320" className="w-full h-full">
                                    <StarMapGrid
                                        gridMode="complex"
                                        dataSize={calibration.wordCount}
                                        rings={11}
                                    />
                                    <StarMapZodiacRing
                                        rotation={0}
                                        activeIndex={calibration.startSectorOffset}
                                        autoRotate={false}
                                    />

                                    {/* Helper Constellation */}
                                    {activeZodiacData && (
                                        <g className="transition-opacity duration-500">
                                            <g stroke="#FFE0B2" strokeOpacity="1" strokeWidth="1">
                                                {activeZodiacData.connections.map((conn, i) => {
                                                    const s1 = activeZodiacData.stars[conn[0]];
                                                    const s2 = activeZodiacData.stars[conn[1]];
                                                    return (<line key={`z-conn-${i}`} x1={s1.x} y1={s1.y} x2={s2.x} y2={s2.y} />);
                                                })}
                                            </g>
                                            <g>
                                                {activeZodiacData.stars.map((s, i) => (
                                                    <StarShape
                                                        key={`z-star-${i}`}
                                                        star={{ ...s, sizeMultiplier: 1.2, opacity: 1, isFlare: i % 3 === 0 }}
                                                        isZodiac={true}
                                                        starSize={3}
                                                    />
                                                ))}
                                            </g>
                                        </g>
                                    )}

                                    {/* Interactive Bit Grid */}
                                    <g>
                                        {Array.from({ length: calibration.wordCount }).map((_, w) => {
                                            const sectorAngle = 360 / calibration.wordCount;
                                            const gridPhaseOffset = calibration.wordCount > 12 ? 7.5 : 0;
                                            const baseAngle = (w * sectorAngle) + gridPhaseOffset;

                                            return Array.from({ length: 11 }).map((_, b) => {
                                                const r = innerRadius + b * step + (step / 2);
                                                const rad = ((baseAngle - 90) * Math.PI) / 180;
                                                const x = r * Math.cos(rad);
                                                const y = r * Math.sin(rad);

                                                const isOn = bitGrid[w] && bitGrid[w][b];

                                                return (
                                                    <circle
                                                        key={`bit-${w}-${b}`}
                                                        cx={x}
                                                        cy={y}
                                                        r={isOn ? 4 : 3}
                                                        fill={isOn ? "#4ADE80" : "transparent"}
                                                        stroke={isOn ? "#4ADE80" : "rgba(255,255,255,0.15)"}
                                                        strokeWidth={isOn ? 0 : 0.5}
                                                        className="cursor-pointer transition-all duration-200 hover:fill-cyan-400 hover:stroke-cyan-400 hover:r-5 pointer-events-auto"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleBit(w, b);
                                                        }}
                                                    />
                                                );
                                            });
                                        })}
                                    </g>
                                </svg>
                            </div>

                            {/* Scanning Canvas */}
                            <canvas ref={canvasRef} className="hidden" />
                        </div>
                    </div>

                    {/* FLOATING LEFT PANEL: Calibration (Glass) -> Top Left */}
                    <div className="absolute left-6 top-24 w-64 p-6 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col gap-5 animate-slide-in-left">
                        <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-widest border-b border-white/10 pb-2">Calibration</h3>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-gray-400 uppercase"><span>Scale</span> <span>{calibration.scale.toFixed(2)}x</span></div>
                                <input type="range" min="0.25" max="3" step="0.01" value={calibration.scale}
                                    onChange={(e) => updateCal('scale', parseFloat(e.target.value))} className="w-full accent-cyan-400 h-1 bg-white/20 rounded-full appearance-none" />
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-gray-400 uppercase"><span>Rotation</span> <span>{calibration.rotation}°</span></div>
                                <input type="range" min="-180" max="180" step="1" value={calibration.rotation}
                                    onChange={(e) => updateCal('rotation', parseInt(e.target.value))} className="w-full accent-cyan-400 h-1 bg-white/20 rounded-full appearance-none" />
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-gray-400 uppercase"><span>Pan X</span> <span>{calibration.x}px</span></div>
                                <input type="range" min="-200" max="200" value={calibration.x}
                                    onChange={(e) => updateCal('x', parseInt(e.target.value))} className="w-full accent-cyan-400 h-1 bg-white/20 rounded-full appearance-none" />
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-gray-400 uppercase"><span>Pan Y</span> <span>{calibration.y}px</span></div>
                                <input type="range" min="-200" max="200" value={calibration.y}
                                    onChange={(e) => updateCal('y', parseInt(e.target.value))} className="w-full accent-cyan-400 h-1 bg-white/20 rounded-full appearance-none" />
                            </div>
                            <div className="pt-2 border-t border-white/10 space-y-1">
                                <div className="flex justify-between text-[10px] text-gray-400 uppercase"><span>Img Opacity</span> <span>{Math.round(imageOpacity * 100)}%</span></div>
                                <input type="range" min="0" max="1" step="0.05" value={imageOpacity}
                                    onChange={(e) => setImageOpacity(parseFloat(e.target.value))} className="w-full accent-purple-400 h-1 bg-white/20 rounded-full appearance-none" />
                            </div>
                        </div>
                    </div>

                    {/* FLOATING RIGHT PANEL: Detection & Actions (Glass) -> Top Right */}
                    <div className="absolute right-6 top-24 w-72 p-6 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col gap-5 animate-slide-in-right">
                        <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-widest border-b border-white/10 pb-2">Decoder</h3>

                        <div className="space-y-4">
                            {/* Word Count */}
                            <div className="flex gap-2 p-1 bg-white/5 rounded-lg">
                                <button onClick={() => updateCal('wordCount', 12)} className={`flex-1 py-1.5 rounded text-xs transition-all ${calibration.wordCount === 12 ? 'bg-cyan-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>12 Words</button>
                                <button onClick={() => updateCal('wordCount', 24)} className={`flex-1 py-1.5 rounded text-xs transition-all ${calibration.wordCount === 24 ? 'bg-cyan-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>24 Words</button>
                            </div>

                            {/* Zodiac */}
                            <div className="relative">
                                <label className="text-[10px] text-gray-400 uppercase mb-1 block">Zodiac Alignment</label>
                                <select
                                    value={calibration.startSectorOffset}
                                    onChange={(e) => updateCal('startSectorOffset', parseInt(e.target.value))}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer hover:bg-white/10 transition-colors"
                                >
                                    {zodiacLabels.map((z, i) => (
                                        <option key={z} value={i} className="bg-slate-900">{z}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Scan Button (Manual Trigger if needed) */}
                            {/* Note: User said "Manual Detect focus", so maybe the scan is secondary or initial helper */}
                            <div className="pt-2 border-t border-white/10 space-y-2">
                                <div className="flex justify-between text-[10px] text-gray-400 uppercase"><span>Scanner Sensitivity</span></div>
                                <input type="range" min="0" max="100" step="5" value={calibration.sensitivity}
                                    onChange={(e) => updateCal('sensitivity', parseInt(e.target.value))} className="w-full accent-green-400 h-1 bg-white/20 rounded-full appearance-none" />

                                <button
                                    onClick={performScan}
                                    disabled={isScanning}
                                    className="w-full py-3 mt-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-bold text-shadow hover:brightness-110 disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-cyan-900/20"
                                >
                                    {isScanning ? 'Scanning Pixels...' : 'Auto-Scan Bits'}
                                </button>
                                <p className="text-[10px] text-center text-gray-500">
                                    Auto-scan or click bits manually
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* BOTTOM FLOATING PANEL: Results */}
                    {decodedResult && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl p-6 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl animate-slide-up">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-green-400 uppercase tracking-widest">Decoded Phrase</h3>
                                <button
                                    onClick={() => navigator.clipboard.writeText(decodedResult.join(' '))}
                                    className="text-xs text-cyan-400 hover:text-white underline"
                                >
                                    Copy to Clipboard
                                </button>
                            </div>
                            <div className="grid grid-cols-6 lg:grid-cols-12 gap-2 font-mono text-xs sm:text-sm">
                                {decodedResult.map((word, i) => (
                                    <div key={i} className="flex flex-col items-center bg-white/5 rounded p-1.5 border border-white/5">
                                        <span className="text-[9px] text-gray-500 mb-0.5">{i + 1}</span>
                                        <span className={`font-bold ${word === '???' ? 'text-red-400' : 'text-white'}`}>{word}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Top Right: Reset/Close */}
                    <button
                        onClick={() => setImage(null)}
                        className="absolute top-6 right-6 p-3 rounded-full bg-black/40 backdrop-blur-md text-gray-400 hover:text-white hover:bg-red-500/20 hover:border-red-500 border border-transparent transition-all"
                        title="Close / Reset"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </>
            )}
        </div>
    );
};

export default StarMapDecoder;
