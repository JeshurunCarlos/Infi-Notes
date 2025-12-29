
import React from 'react';

interface WritingPenProps {
    x: number;
    y: number;
    opacity: number;
    isWriting: boolean;
}

export const WritingPen: React.FC<WritingPenProps> = ({ x, y, opacity, isWriting }) => {
    // Reduced size: Original was 40x200. New is 24x120 (0.6 scale).
    // Tip is roughly at bottom center.
    // Original Tip: ~ (20, 200) relative to SVG origin.
    // New Tip: ~ (12, 120).
    const width = 24;
    const height = 120;
    const tipX = 12;
    const tipY = 120;

    return (
        <div 
            style={{ 
                position: 'fixed',
                // Adjust position so the tip sits exactly at cursor x,y
                // Move slightly to the right (x + 5) to not cover the character just typed
                top: y - tipY, 
                left: x - tipX + 5,
                opacity: opacity,
                pointerEvents: 'none',
                zIndex: 9999,
                // Fast linear transition for snappy following, ease-out for opacity fade
                transition: 'opacity 0.5s ease-out, top 0.05s linear, left 0.05s linear',
            }}
        >
             <style>
                {`
                @keyframes scribble {
                    0% { transform: rotate(15deg) translate(0, 0); }
                    20% { transform: rotate(10deg) translate(-1px, 1px); }
                    40% { transform: rotate(20deg) translate(1px, -1px); }
                    60% { transform: rotate(12deg) translate(-0.5px, 1px); }
                    80% { transform: rotate(18deg) translate(0.5px, -1px); }
                    100% { transform: rotate(15deg) translate(0, 0); }
                }
                `}
            </style>
            <div style={{
                transformOrigin: '50% 100%', // Pivot at the tip
                transform: 'rotate(15deg)', // Default resting angle
                animation: isWriting ? 'scribble 0.15s infinite' : 'none',
                filter: 'drop-shadow(3px 6px 4px rgba(0,0,0,0.2))'
            }}>
                <svg width={width} height={height} viewBox="0 0 40 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Cap Button */}
                    <rect x="12" y="0" width="16" height="15" rx="2" fill="#0e4b59" />
                    <rect x="10" y="10" width="20" height="3" fill="#d4af37" />
                    
                    {/* Body Main */}
                    <path d="M5 15 L35 15 L35 155 L5 155 Z" fill="#238596" stroke="#165f6d" strokeWidth="1" />
                    
                    {/* Clip */}
                    <path d="M30 20 L30 80 Q30 90 22 85 L22 20" fill="#0e4b59" />
                    
                    {/* Rings */}
                    <rect x="5" y="110" width="30" height="6" fill="#fcd34d" opacity="0.9" />
                    <rect x="5" y="122" width="30" height="6" fill="#fcd34d" opacity="0.9" />
                    
                    {/* Grip Section */}
                    <path d="M5 155 L10 180 L20 200 L30 180 L35 155 Z" fill="#0e4b59" />
                    
                    {/* Tip */}
                    <path d="M19 198 L21 198 L20 200 Z" fill="#111" />
                    
                    {/* Highlights */}
                    <path d="M10 20 L10 150" stroke="white" strokeWidth="2" strokeOpacity="0.15" strokeLinecap="round" />
                </svg>
            </div>
        </div>
    );
};
