import React, { useMemo } from 'react';

const StarMapGrid = ({
    gridMode = 'simple',
    rings = 11,
    dataSize = 12
}) => {
    const maxRadius = 100;
    const innerRadius = 35;
    const step = (maxRadius - innerRadius) / (rings - 1);
    const getRadius = (bitIndex) => innerRadius + bitIndex * step;

    // Determine slice count based on mode and data size
    const gridSlices = (gridMode === 'simple') ? 12 : dataSize;

    // Visible Rings
    const visibleRings = useMemo(() => {
        if (gridMode === 'simple') return [0, 3, 7, 10];
        return Array.from({ length: rings }, (_, i) => i);
    }, [gridMode, rings]);

    return (
        <g stroke="white" strokeWidth="0.4" fill="none" opacity="0.6">
            {/* Outer Boundary */}
            <circle r={maxRadius + 15} stroke="#FFA500" strokeOpacity="0.3" strokeWidth="0.8" />

            {/* Concentric Rings */}
            {visibleRings.map(rIndex => (
                <circle
                    key={`ring-${rIndex}`}
                    r={getRadius(rIndex)}
                    strokeDasharray={rIndex === 0 ? "2 2" : ""}
                    opacity={rIndex === 10 ? 0.8 : 0.6}
                    strokeWidth="0.3"
                />
            ))}

            {/* Sector Lines */}
            {Array.from({ length: gridSlices }).map((_, i) => {
                // Apply same 7.5deg phase shift for 24-word mode to align with star positions
                const phaseOffset = (dataSize > 12) ? 7.5 : 0;

                // Angle calculation matches StarMap.jsx logic
                const angle = (i * 360 / gridSlices) + (360 / gridSlices / 2) + phaseOffset;
                const rad = ((angle - 90) * Math.PI) / 180;

                const x2 = (maxRadius + 15) * Math.cos(rad);
                const y2 = (maxRadius + 15) * Math.sin(rad);

                return (
                    <line
                        key={`line-${i}`}
                        x1="0"
                        y1="0"
                        x2={x2}
                        y2={y2}
                        strokeOpacity="0.4"
                    />
                );
            })}
        </g>
    );
};

export default StarMapGrid;
