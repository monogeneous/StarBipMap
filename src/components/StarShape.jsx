import React from 'react';

const StarShape = ({ star, isZodiac, starSize = 3 }) => {
    const baseSize = starSize * (star.sizeMultiplier || 1); // Default to 1 if missing
    const size = isZodiac ? 1.5 : baseSize;
    let fillColor = star.color || '#FFFFFF';

    if (isZodiac) {
        fillColor = star.isFlare ? '#FFE0B2' : '#FFFFFF';
    }

    // Logic from StarMap.jsx
    const glowColor = (isZodiac && star.isFlare) || star.isMain
        ? "rgba(255, 230, 200, 0.8)"
        : "rgba(255, 255, 255, 0.6)";

    const finalSize = size;

    const style = {
        filter: `drop-shadow(0 0 ${finalSize * (isZodiac ? 1.5 : 1)}px ${glowColor})`,
        opacity: star.opacity || 1,
        transition: 'all 0.5s ease'
    };

    if (star.isFlare) {
        // Flare Path Logic
        const r = finalSize * 1.2;
        const w = r * 0.25;
        const path = `M ${star.x} ${star.y - r} 
                      Q ${star.x + w * 0.5} ${star.y - w * 0.5} ${star.x + r} ${star.y} 
                      Q ${star.x + w * 0.5} ${star.y + w * 0.5} ${star.x} ${star.y + r} 
                      Q ${star.x - w * 0.5} ${star.y + w * 0.5} ${star.x - r} ${star.y} 
                      Q ${star.x - w * 0.5} ${star.y - w * 0.5} ${star.x} ${star.y - r} Z`;
        return <path d={path} fill={fillColor} style={style} />;
    }

    // Standard Circle Star
    return <circle cx={star.x} cy={star.y} r={finalSize * 0.6} fill={fillColor} style={style} />;
};

export default StarShape;
