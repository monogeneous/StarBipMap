import React, { useMemo } from 'react';
import { zodiacConstellations } from '../utils/zodiacData';
import StarMapGrid from './StarMapGrid';
import StarMapZodiacRing from './StarMapZodiacRing';
import StarShape from './StarShape';

const StarMap = ({ data, settings, isExporting }) => {
    // ... [settings and data normalization logic omitted for brevity, keeping as is] ...
    const {
        showGrid = true,
        rotation = 0,
        zoom = 1,
        starColor = '#FFE0B2',
        starSize = 3,
        gridMode = 'simple'
    } = settings || {};

    const rings = 11;

    // NORMALIZE DATA
    const normalizedData = useMemo(() => {
        if (!data) return Array(12).fill({ index: -1 });
        const len = data.length;
        let targetLen = 12;
        if (len > 12) targetLen = 24;
        const padded = [...data];
        while (padded.length < targetLen) {
            padded.push({ index: -1, word: '' });
        }
        return padded;
    }, [data]);

    const dataSize = normalizedData.length;
    // const gridSlices = (gridMode === 'simple') ? 12 : dataSize; // Moved to StarMapGrid

    // Visible Rings logic moved to StarMapGrid...
    // Constants maxRadius, innerRadius, step also needed for Star Rendering
    const maxRadius = 100;
    const innerRadius = 35;
    const step = (maxRadius - innerRadius) / (rings - 1);
    const getRadius = (bitIndex) => innerRadius + bitIndex * step;

    const pseudoRandom = (seed) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    const { zodiacIndex, zodiac } = useMemo(() => {
        if (!data || data.length === 0) return { zodiacIndex: 0, zodiac: null };
        const totalIndex = data.reduce((sum, item) => sum + (item.index || 0), 0);
        const idx = totalIndex % 12;
        return { zodiacIndex: idx, zodiac: zodiacConstellations[idx] };
    }, [data]);

    // zodiacLabels moved to StarMapZodiacRing
    // ringRotation moved to StarMapZodiacRing (calculated internally based on activeIndex)

    const backgroundStars = useMemo(() => {
        const bg = [];
        const count = 450;
        for (let i = 0; i < count; i++) {
            const seed = i * 999;
            const r = pseudoRandom(seed) * 160;
            const angle = pseudoRandom(seed + 1) * 360;
            const rad = ((angle - 90) * Math.PI) / 180;
            const isCore = i < 80;
            const coreR = pseudoRandom(seed + 5) * 40;
            const finalR = isCore ? coreR : r;

            bg.push({
                x: finalR * Math.cos(rad),
                y: finalR * Math.sin(rad),
                size: (0.3 + pseudoRandom(seed + 2) * 0.5) * (isCore ? 0.8 : 1),
                opacity: (0.2 + pseudoRandom(seed + 3) * 0.6) * (isCore ? 0.7 : 1),
                key: `bg-${i}`
            });
        }
        return bg;
    }, []);

    const { stars, connections } = useMemo(() => {
        let points = [];
        let lines = [];
        normalizedData.forEach((item, wordIndex) => {
            const dataSlices = normalizedData.length;
            const sliceAngle = 360 / dataSlices;
            const phaseOffset = (dataSlices > 12) ? 7.5 : 0;
            const baseAngle = (wordIndex * sliceAngle) + phaseOffset;

            if (item.index !== -1) {
                const activeBits = [];
                for (let bit = 0; bit < rings; bit++) {
                    if ((item.index >> bit) & 1) {
                        activeBits.push(bit);
                    }
                }
                const scoredBits = activeBits.map(bit => {
                    const seed = item.index * 100 + bit + (wordIndex * 1337);
                    return { bit, score: pseudoRandom(seed), seed };
                });
                scoredBits.sort((a, b) => b.score - a.score);
                const cappedBits = scoredBits.slice(0, 9);
                cappedBits.forEach((sb, i) => {
                    const { bit, seed } = sb;
                    const isMain = (i === 0);
                    const isSecondary = (i === 1);
                    const jitterR = (pseudoRandom(seed) - 0.5) * 0.7;
                    const jitterAngle = (pseudoRandom(seed + 1) - 0.5) * 0.7;
                    let r = (getRadius(bit) + (step / 2)) + (jitterR * step);
                    let angle = baseAngle + (jitterAngle * sliceAngle);
                    const rad = ((angle - 90) * Math.PI) / 180;
                    const x = r * Math.cos(rad);
                    const y = r * Math.sin(rad);
                    let sizeMultiplier = 0.5;
                    let opacity = 0.7;
                    let color = '#FFFFFF';
                    let isFlare = false;
                    if (isMain) {
                        sizeMultiplier = 1.2 + pseudoRandom(seed + 2) * 0.4;
                        opacity = 1.0;
                        color = '#FFE0B2';
                        isFlare = pseudoRandom(seed + 4) > 0.4;
                    } else if (isSecondary) {
                        sizeMultiplier = 0.8 + pseudoRandom(seed + 2) * 0.3;
                        opacity = 0.9;
                        color = '#FFFFFF';
                        isFlare = false;
                    } else {
                        sizeMultiplier = 0.4 + pseudoRandom(seed + 2) * 0.2;
                        opacity = 0.6 + pseudoRandom(seed + 3) * 0.4;
                        color = '#FFFFFF';
                        isFlare = false;
                    }
                    points.push({
                        x, y, r, angle,
                        key: `${wordIndex}-${bit}`,
                        id: points.length,
                        sizeMultiplier,
                        opacity,
                        isFlare,
                        isMain,
                        isSecondary,
                        color,
                        wordIndex
                    });
                });
            }
        });

        // --- MST CONNECTION LOGIC (UNCHANGED) ---
        const allEdges = [];
        const maxDistSq = 2500;
        for (let i = 0; i < points.length; i++) {
            for (let j = i + 1; j < points.length; j++) {
                const p1 = points[i];
                const p2 = points[j];
                if (p1.isMain && p2.isMain) continue;
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distSq = dx * dx + dy * dy;
                if (distSq < maxDistSq) allEdges.push({ p1, p2, dist: distSq });
            }
        }
        allEdges.sort((a, b) => a.dist - b.dist);
        const parent = new Array(points.length).fill(0).map((_, i) => i);
        const clusterSize = new Array(points.length).fill(1);
        const degrees = new Array(points.length).fill(0);
        const MAX_DEGREE = 2;
        const MAX_CLUSTER_SIZE = 9;
        const find = (i) => {
            if (parent[i] === i) return i;
            parent[i] = find(parent[i]);
            return parent[i];
        };
        allEdges.forEach(edge => {
            const { p1, p2 } = edge;
            const root1 = find(p1.id);
            const root2 = find(p2.id);
            if (root1 !== root2) {
                if (clusterSize[root1] + clusterSize[root2] <= MAX_CLUSTER_SIZE) {
                    if (degrees[p1.id] < MAX_DEGREE && degrees[p2.id] < MAX_DEGREE) {
                        parent[root1] = root2;
                        clusterSize[root2] += clusterSize[root1];
                        lines.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, key: `${p1.key}-${p2.key}` });
                        degrees[p1.id]++;
                        degrees[p2.id]++;
                    }
                }
            }
        });
        return { stars: points, connections: lines };
    }, [normalizedData, step]);

    const strokeOpacity = isExporting ? 0.6 : 0.2;
    // const strokeWidthGrid = isExporting ? "0.6" : "0.3"; // Now in StarMapGrid (Fixed or passed? Let's check)
    // StarMapGrid uses 0.3/0.4. If we want export scaling, we should pass it. 
    // BUT the new Grid uses fixed values. Let's stick to consistent default for now.
    const strokeWidthConn = isExporting ? "0.8" : "0.4";

    const containerClasses = `w-full aspect-square max-w-lg mx-auto relative flex items-center justify-center ${isExporting ? 'p-0' : 'p-4'}`;

    return (
        <div id="star-map-export-container" className={containerClasses}>
            <svg
                id="star-map-svg"
                viewBox="-160 -160 320 320"
                className="w-full h-full drop-shadow-2xl overflow-visible relative z-10"
                style={{ transition: 'transform 0.5s ease-out' }}
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    <radialGradient id="space-bg" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#151932" />
                        <stop offset="60%" stopColor="#0b0d17" />
                        <stop offset="100%" stopColor="#050510" />
                    </radialGradient>

                    <filter id="noise">
                        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
                        <feColorMatrix type="saturate" values="0" />
                        <feComponentTransfer>
                            <feFuncA type="linear" slope="0.15" />
                        </feComponentTransfer>
                    </filter>

                    <radialGradient id="active-glow" cx="0.5" cy="0.5" r="0.5">
                        <stop offset="0%" stopColor="#FFA500" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#FFA500" stopOpacity="0" />
                    </radialGradient>

                    <radialGradient id="atmosphere-glow" cx="0.5" cy="0.5" r="0.5">
                        <stop offset="0%" stopColor="#FF6B00" stopOpacity="0.05" />
                        <stop offset="100%" stopColor="#FF6B00" stopOpacity="0" />
                    </radialGradient>
                </defs>

                {/* --- BACKGROUND LAYERS --- */}
                <circle cx="0" cy="0" r="135" fill="url(#space-bg)" />
                <circle cx="0" cy="0" r="135" fill="url(#atmosphere-glow)" />

                {/* --- CONTENT LAYERS --- */}
                <g
                    transform={`scale(${zoom}) rotate(${rotation})`}
                    style={{ transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                >
                    {/* Background Stars */}
                    <g fill="#FFFFFF" opacity="0.4">
                        {backgroundStars.map(s => (
                            <circle key={s.key} cx={s.x} cy={s.y} r={s.size} opacity={s.opacity} />
                        ))}
                    </g>

                    {showGrid && (
                        <StarMapGrid gridMode={gridMode} rings={rings} dataSize={dataSize} />
                    )}

                    {zodiac && (
                        <g className="transition-opacity duration-1000">
                            <g stroke="#FFE0B2" strokeOpacity={isExporting ? 0.6 : 0.3} strokeWidth={isExporting ? "0.8" : "0.5"}>
                                {zodiac.connections.map((conn, i) => {
                                    const s1 = zodiac.stars[conn[0]];
                                    const s2 = zodiac.stars[conn[1]];
                                    return (<line key={`zodiac-conn-${i}`} x1={s1.x} y1={s1.y} x2={s2.x} y2={s2.y} />);
                                })}
                            </g>
                            <g>
                                {zodiac.stars.map((s, i) => (
                                    <StarShape key={`zodiac-star-${i}`} star={{ ...s, sizeMultiplier: 1.2, opacity: 1, isFlare: i % 3 === 0 }} isZodiac={true} />
                                ))}
                            </g>
                        </g>
                    )}

                    <g stroke="white" strokeOpacity={strokeOpacity} strokeWidth={strokeWidthConn}>
                        {connections.map(line => (
                            <line key={line.key} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} />
                        ))}
                    </g>

                    <g>
                        {stars.map((star) => (
                            <StarShape key={star.key} star={star} />
                        ))}
                    </g>
                </g>

                <g
                    transform={`scale(${zoom})`}
                    style={{ transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
                >
                    {showGrid && (
                        <StarMapZodiacRing rotation={rotation} activeIndex={zodiacIndex} />
                    )}
                </g>
            </svg>
        </div>
    );
};

export default StarMap;
