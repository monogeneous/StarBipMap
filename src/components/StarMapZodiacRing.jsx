import React, { useMemo } from 'react';

const StarMapZodiacRing = ({
    rotation = 0,
    activeIndex = 0,
    autoRotate = true
}) => {
    const zodiacLabels = [
        "ARIES", "TAURUS", "GEMINI", "CANCER",
        "LEO", "VIRGO", "LIBRA", "SCORPIO",
        "SAGITTARIUS", "CAPRICORN", "AQUARIUS", "PISCES"
    ];

    const maxRadius = 100;

    // Calculate ring rotation to center the active zodiac
    const textRotation = useMemo(() => {
        if (!autoRotate) return 0; // Fixed orientation (Aries at 12 o'clock?? No, Aries is Index 0. At 0 deg)
        // Note: In StarMap, 0 deg is typically 3 o'clock in SVG?
        // Let's check the loop. i*360/12. i=0 -> 0 deg.
        // x = r * cos(angle). 0 deg -> x=r, y=0. (3 o'clock).
        // rad = ((angle - 90) * PI) / 180.
        // i=0 -> angle=0 -> rad=-90deg (-PI/2).
        // cos(-90)=0, sin(-90)=-1. x=0, y=-r. (12 o'clock).
        // So i=0 is ALREADY at 12 o'clock.
        // So autoRotate=false means Aries stays at Top. Correct.
        return 180 - (activeIndex * 30);
    }, [activeIndex, autoRotate]);

    // Combined rotation: "visual rotation" + "alignment rotation"
    // In StarMap, text group has: transform={`scale(${zoom}) rotate(${ringRotation})`}

    return (
        <g transform={`rotate(${textRotation})`} style={{ transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            <g className="font-medium tracking-[0.15em]" style={{ textAnchor: 'middle', dominantBaseline: 'middle' }}>
                {zodiacLabels.map((name, i) => {
                    const angle = (i * 360 / 12);
                    const rad = ((angle - 90) * Math.PI) / 180;
                    const r = maxRadius + 22;
                    const x = r * Math.cos(rad);
                    const y = r * Math.sin(rad);

                    const isActive = (i === activeIndex);

                    return (
                        <g key={`label-group-${i}`}>
                            {/* Note: Gradients like #active-glow must be defined in parent SVG */}
                            {isActive && (
                                <circle cx={x} cy={y} r="12" fill="url(#active-glow)" opacity="0.1" />
                            )}
                            <text
                                x={x}
                                y={y}
                                fill={isActive ? '#FFE0B2' : '#FFFFFF'}
                                opacity={isActive ? 1 : 0.3}
                                fontSize="5"
                                fontWeight={isActive ? "bold" : "normal"}
                                style={{
                                    textShadow: isActive ? '0 0 10px rgba(255, 160, 50, 0.8)' : 'none',
                                    transition: 'fill 0.5s ease, text-shadow 0.5s ease'
                                }}
                                // Counter-rotate text so it stays upright relative to the screen usually? 
                                // StarMap uses: isActive ? rotate(-ringRotation) : rotate(angle)
                                transform={isActive ? `rotate(${-textRotation}, ${x}, ${y})` : `rotate(${angle}, ${x}, ${y})`}
                            >
                                {isActive ? `★ ${name} ★` : name}
                            </text>
                        </g>
                    );
                })}
            </g>
        </g>
    );
};

export default StarMapZodiacRing;
