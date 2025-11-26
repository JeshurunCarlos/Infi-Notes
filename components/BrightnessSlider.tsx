
import React, { useEffect, useRef } from 'react';
import { SunIcon } from './Icons';

interface BrightnessSliderProps {
  brightness: number;
  setBrightness: (value: number) => void;
  onClose: () => void;
}

const BrightnessSlider: React.FC<BrightnessSliderProps> = ({ brightness, setBrightness, onClose }) => {
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sliderRef.current && !sliderRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  // Calculate fill percentage for the track background (range 50-100)
  const range = 100 - 50;
  const fillPercent = ((brightness - 50) / range) * 100;

  return (
    <div 
      ref={sliderRef}
      className="absolute top-full right-0 mt-4 p-2 w-72 bg-[var(--bg-secondary)]/80 backdrop-blur-2xl rounded-2xl shadow-2xl border border-[var(--border-primary)] z-[150] animate-[popIn_0.3s_cubic-bezier(0.16,1,0.3,1)]"
      style={{ perspective: '1000px' }}
    >
        <div 
            className="relative w-full h-14 rounded-xl flex items-center overflow-hidden shadow-inner group"
            style={{
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(255,255,255,0.1))',
                transform: 'rotateX(5deg)', // Subtle 3D tilt
                boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.2)'
            }}
        >
            
            {/* The seamless yellow fill bar with 3D gloss */}
            <div 
                className="absolute left-0 top-0 bottom-0 transition-all duration-100 ease-out"
                style={{ 
                    width: `${fillPercent}%`,
                    background: 'linear-gradient(to bottom, #FCD34D, #F59E0B)',
                    boxShadow: '2px 0 10px rgba(245, 158, 11, 0.5), inset 0 1px 0 rgba(255,255,255,0.4)'
                }}
            >
                {/* Gloss highlight */}
                <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-white/30 to-transparent"></div>
            </div>

            {/* Content Container */}
            <div className="relative w-full h-full flex items-center px-4 z-10 pointer-events-none">
                 {/* Sun Icon */}
                <div className="mr-3 transition-transform duration-300 drop-shadow-md" style={{ transform: `scale(${0.8 + (brightness - 50) / 100})` }}>
                    <SunIcon className={`w-6 h-6 transition-colors duration-300 ${fillPercent > 20 ? 'text-black/70' : 'text-[var(--text-primary)]'}`} />
                </div>
                
                {/* Text Indicator */}
                <div className="flex-grow flex justify-end">
                    <span className={`font-bold text-lg select-none tabular-nums transition-colors duration-300 drop-shadow-sm ${fillPercent > 85 ? 'text-black/70' : 'text-[var(--text-primary)]'}`}>
                        {brightness}%
                    </span>
                </div>
            </div>

            {/* Invisible Range Input for Interaction */}
            <input
                type="range"
                min="50"
                max="100"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            />
        </div>
    </div>
  );
};

export default BrightnessSlider;
