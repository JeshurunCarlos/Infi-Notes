
import React, { memo } from 'react';

const FallingLeavesAnimation: React.FC = () => {
    return (
        <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-[#ffffff]">
            <div 
                className="absolute inset-0 w-full h-full"
                style={{
                    background: 'linear-gradient(-45deg, #ffffff, #e0f2fe, #f3e8ff, #f0f9ff)',
                    backgroundSize: '400% 400%',
                    animation: 'frosty-gradient 15s ease infinite'
                }}
            >
                <style>{`
                    @keyframes frosty-gradient {
                        0% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                        100% { background-position: 0% 50%; }
                    }
                `}</style>
            </div>
            
            {/* Subtle overlay for texture/frost effect */}
            <div className="absolute inset-0 opacity-[0.03]" 
                 style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} 
            />
        </div>
    );
};

export default memo(FallingLeavesAnimation);
