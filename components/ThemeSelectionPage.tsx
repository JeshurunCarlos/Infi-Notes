
import React, { useState, useEffect } from 'react';
import { Theme } from '../types';
import { InfinityIcon, ArrowsRightLeftIcon, CheckIcon, FontIcon } from './Icons';
import FloatingShapesAnimation from './FloatingShapesAnimation';

interface ThemeSelectionPageProps {
    currentTheme?: Theme;
    onPreviewTheme: (theme: Theme) => void;
    onContinue: () => void;
}

const themes = [
    { 
        id: 'light', 
        name: 'Light', 
        description: 'Clean and bright.',
        colors: ['#ffffff', '#f1f5f9', '#2563eb'],
        bgClass: 'bg-white text-slate-900 font-sans',
        borderClass: 'border-slate-200'
    },
    { 
        id: 'pitch-black', 
        name: 'Pitch Black', 
        description: 'Deep and immersive.',
        colors: ['#000000', '#1a1a1a', '#00BFFF'],
        bgClass: 'bg-black text-white font-sans',
        borderClass: 'border-zinc-800'
    },
    { 
        id: 'matrix', 
        name: 'Matrix', 
        description: 'Digital rain aesthetic.',
        colors: ['#000000', '#003B00', '#00FF41'],
        bgClass: 'bg-black text-green-500 font-mono',
        borderClass: 'border-green-900'
    },
    { 
        id: 'cyberpunk', 
        name: 'Cyberpunk', 
        description: 'Neon high tech.',
        colors: ['#050505', '#00f3ff', '#ff00ff'],
        bgClass: 'bg-zinc-950 text-cyan-400 font-sans',
        borderClass: 'border-cyan-900'
    },
    { 
        id: 'monokai', 
        name: 'Monokai', 
        description: 'Developer favorite.',
        colors: ['#272822', '#3E3D32', '#FF6188'],
        bgClass: 'bg-[#272822] text-[#f8f8f2] font-mono',
        borderClass: 'border-[#75715E]'
    },
    { 
        id: 'frosty', 
        name: 'Frosty', 
        description: 'Cool and airy.',
        colors: ['#e0f2fe', '#ffffff', '#8b5cf6'],
        bgClass: 'bg-blue-50 text-slate-800 font-sans',
        borderClass: 'border-blue-200'
    }
] as const;

const fonts = [
    { id: 'inter', name: 'Modern', family: "'Inter', sans-serif" },
    { id: 'serif', name: 'Elegant', family: "'Playfair Display', serif" },
    { id: 'mono', name: 'Code', family: "'Share Tech Mono', monospace" },
    { id: 'cyber', name: 'Future', family: "'Orbitron', sans-serif" },
];

const ThemeSelectionPage: React.FC<ThemeSelectionPageProps> = ({ currentTheme, onPreviewTheme, onContinue }) => {
    const [selectedFont, setSelectedFont] = useState(fonts[0].id);

    useEffect(() => {
        const savedFont = localStorage.getItem('infi-font-body');
        if (savedFont) {
            // Reverse lookup to set initial state correctly if it matches one of our presets
            const found = fonts.find(f => f.family === savedFont);
            if (found) setSelectedFont(found.id);
        }
    }, []);

    const handleFontChange = (fontId: string) => {
        const font = fonts.find(f => f.id === fontId);
        if (font) {
            document.documentElement.style.setProperty('--font-body', font.family);
            document.documentElement.style.setProperty('--font-heading', font.family);
            localStorage.setItem('infi-font-body', font.family);
            setSelectedFont(fontId);
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const width = rect.width;
        const height = rect.height;
        
        const xPct = (x / width - 0.5) * 20; // -10 to 10 deg tilt
        const yPct = (y / height - 0.5) * -20; 

        e.currentTarget.style.transform = `perspective(1000px) rotateX(${yPct}deg) rotateY(${xPct}deg) scale(1.05)`;
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)`;
    };

    return (
        <div className="h-screen w-full bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-500 selection:bg-[var(--accent)] selection:text-white">
            
            {/* Dynamic Background */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-50">
                <FloatingShapesAnimation />
            </div>

            <div className="relative z-10 max-w-7xl w-full flex flex-col items-center h-full pt-4 md:pt-8">
                {/* Header */}
                <div className="flex-shrink-0 mb-4 text-center animate-[fadeIn_0.8s_ease-out]">
                    <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[var(--bg-secondary)]/50 backdrop-blur-xl shadow-xl mb-3 text-[var(--accent)] border border-[var(--border-primary)] ring-1 ring-white/20 scale-90">
                        <InfinityIcon className="w-12 h-12" />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-journal font-bold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-br from-[var(--text-primary)] to-[var(--text-secondary)]">
                        Design Your Space
                    </h1>
                    <p className="text-sm md:text-base opacity-80 max-w-xl mx-auto font-light leading-relaxed">
                        Customize your aesthetic and typography.
                    </p>
                </div>

                {/* Main Dashboard Area */}
                <div className="w-full flex-grow flex flex-col items-center px-6 pb-24 md:pb-28 gap-6 overflow-y-auto custom-scrollbar">
                    
                    {/* Theme Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-5xl mx-auto">
                        {themes.map((theme, index) => {
                            const isSelected = currentTheme === theme.id;
                            return (
                                <button
                                    key={theme.id}
                                    onClick={() => onPreviewTheme(theme.id as Theme)}
                                    onMouseMove={handleMouseMove}
                                    onMouseLeave={handleMouseLeave}
                                    style={{ 
                                        animationDelay: `${index * 100}ms`,
                                        background: `linear-gradient(135deg, ${theme.colors[0]}, ${theme.colors[1]})`,
                                        opacity: 0, // Start hidden for animation to trigger
                                        transition: 'transform 0.1s ease-out, box-shadow 0.3s ease'
                                    }}
                                    className={`group relative h-40 md:h-44 rounded-2xl overflow-hidden shadow-lg transform text-left flex flex-col border animate-[spring-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]
                                        ${isSelected 
                                            ? `ring-4 ring-[var(--accent)]/50 z-10 ${theme.borderClass}` 
                                            : `hover:shadow-xl border-transparent opacity-90 hover:opacity-100`
                                        }
                                    `}
                                >
                                    {/* Abstract geometric decoration inside card */}
                                    <div className="absolute top-[-50%] right-[-50%] w-full h-full bg-gradient-to-br from-white/10 to-transparent rounded-full blur-2xl transform rotate-12 pointer-events-none"></div>
                                    
                                    {/* Selection Indicator */}
                                    <div className={`absolute top-3 right-3 bg-white text-black rounded-full p-1.5 shadow-lg z-20 transition-all duration-300 transform ${isSelected ? 'scale-100 opacity-100 rotate-0' : 'scale-0 opacity-0 rotate-90'}`}>
                                        <CheckIcon className="w-4 h-4" />
                                    </div>
                                    
                                    {/* Glass Overlay Content - Ensure high contrast text */}
                                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-16 pointer-events-none">
                                        <div className="flex justify-between items-end mb-1">
                                            <h3 className={`text-xl font-bold tracking-wide text-white drop-shadow-md`}>
                                                {theme.name}
                                            </h3>
                                            
                                            {/* Color Swatches */}
                                            <div className="flex -space-x-1.5">
                                                {theme.colors.map((color, i) => (
                                                    <div 
                                                        key={i} 
                                                        className="w-4 h-4 rounded-full border border-white/20 shadow-sm ring-1 ring-black/10" 
                                                        style={{ backgroundColor: color }}
                                                    ></div>
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-xs text-white/80 font-medium leading-tight drop-shadow-sm truncate">
                                            {theme.description}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Typography Selection - Glassmorphic Panel */}
                    <div className="w-full max-w-5xl mx-auto mt-2 animate-[fadeIn_1s_ease-out_0.5s_both]">
                        <div className="bg-[var(--bg-secondary)]/60 backdrop-blur-md border border-[var(--border-primary)] rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4 shadow-sm">
                            <div className="flex items-center gap-2 px-2 text-[var(--text-secondary)] border-r border-[var(--border-primary)] pr-4 mr-2">
                                <FontIcon className="w-5 h-5" />
                                <span className="text-sm font-bold uppercase tracking-wider">Typography</span>
                            </div>
                            
                            <div className="flex flex-wrap justify-center gap-3 flex-grow">
                                {fonts.map((font) => (
                                    <button
                                        key={font.id}
                                        onClick={() => handleFontChange(font.id)}
                                        className={`px-4 py-2 rounded-lg text-sm transition-all duration-200 border
                                            ${selectedFont === font.id 
                                                ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] border-transparent font-bold shadow-md' 
                                                : 'bg-transparent text-[var(--text-primary)] border-[var(--border-primary)] hover:bg-[var(--bg-primary)] hover:border-[var(--accent)]'
                                            }
                                        `}
                                        style={{ fontFamily: font.family }}
                                    >
                                        {font.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>

                {/* Fixed Continue Button Area */}
                <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)] to-transparent z-50 flex justify-center pointer-events-none">
                    <button 
                        onClick={onContinue}
                        className="pointer-events-auto flex items-center gap-2 px-10 py-4 bg-[var(--accent)] text-white rounded-full font-bold text-lg shadow-lg shadow-[var(--accent)]/30 hover:scale-105 hover:shadow-xl transition-all btn-press animate-[popIn_0.5s_cubic-bezier(0.16,1,0.3,1)_1.2s_both] group"
                    >
                        <span>Start Workspace</span>
                        <ArrowsRightLeftIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ThemeSelectionPage;
