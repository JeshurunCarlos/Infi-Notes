import React, { memo } from 'react';

const FallingLeavesAnimation: React.FC = () => {
    return (
        <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-[#ffffff]">
            <div 
                className="absolute inset-0 w-full h-full"
                style={{
                    background: 'radial-gradient(circle at 50% 50%, #ffffff, #f0f9ff, #e0f2fe)',
                    backgroundSize: '200% 200%',
                    animation: 'ice-gradient 20s ease infinite'
                }}
            >
                <style>{`
                    @keyframes ice-gradient {
                        0% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                        100% { background-position: 0% 50%; }
                    }
                    @keyframes float-crystal {
                        0% { transform: translateY(110vh) rotate(0deg); opacity: 0; }
                        10% { opacity: 0.6; }
                        90% { opacity: 0.6; }
                        100% { transform: translateY(-20vh) rotate(360deg); opacity: 0; }
                    }
                    .ice-crystal {
                        position: absolute;
                        background: rgba(255, 255, 255, 0.4);
                        border: 1px solid rgba(255, 255, 255, 0.8);
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
                        backdrop-filter: blur(2px);
                    }
                `}</style>
            </div>
            
            {/* Frost/Ice Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.2]" 
                 style={{ 
                     backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.5\'/%3E%3C/svg%3E")',
                     mixBlendMode: 'overlay'
                 }} 
            />

            {/* Floating Ice Shards/Crystals */}
            {Array.from({ length: 20 }).map((_, i) => {
                const size = Math.random() * 40 + 20;
                const left = Math.random() * 100;
                const delay = Math.random() * 20;
                const duration = Math.random() * 20 + 20;
                
                return (
                    <div 
                        key={i}
                        className="ice-crystal"
                        style={{
                            width: `${size}px`,
                            height: `${size}px`,
                            left: `${left}%`,
                            top: '100%',
                            animation: `float-crystal ${duration}s linear infinite`,
                            animationDelay: `-${delay}s`, // Start randomly mid-animation
                            borderRadius: Math.random() > 0.5 ? '10%' : '50%', // Mix of squares and circles
                            transform: `rotate(${Math.random() * 360}deg)`
                        }}
                    />
                );
            })}
        </div>
    );
};

export default memo(FallingLeavesAnimation);