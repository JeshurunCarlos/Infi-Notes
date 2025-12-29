
import React, { useState, useEffect, useRef } from 'react';
import { Theme } from '../types';
import { InfinityIcon, ArrowsRightLeftIcon, CheckIcon, FontIcon, ImageIcon, NoSymbolIcon, TrashIcon, PlusIcon, LayoutDashboardIcon } from './Icons';
import SubtleWaveAnimation from './SubtleWaveAnimation';

interface ThemeSelectionPageProps {
    currentTheme?: Theme;
    onPreviewTheme: (theme: Theme) => void;
    onContinue: () => void;
    layoutMode: 'modern' | 'classic';
    onLayoutChange: (mode: 'modern' | 'classic') => void;
}

const WALLPAPER_STORAGE_KEY = 'infi-notes-global-wallpaper';

const themes = [
    { 
        id: 'light', 
        name: 'Light', 
        description: 'Clean and bright.',
        palette: ['#ffffff', '#f1f5f9', '#2563eb', '#020617'], // BG, Surface, Accent, Text
        bgClass: 'bg-white',
        textClass: 'text-slate-900',
    },
    { 
        id: 'paper', 
        name: 'Paper', 
        description: 'E-Ink focus.',
        palette: ['#fcfaf2', '#f0ede1', '#2c3e50', '#1a1a1a'],
        bgClass: 'bg-[#fdfbf7]',
        textClass: 'text-[#111111]',
    },
    { 
        id: 'pitch-black', 
        name: 'Pitch Black', 
        description: 'Deep and immersive.',
        palette: ['#000000', '#1a1a1a', '#00BFFF', '#f0f0f0'],
        bgClass: 'bg-black',
        textClass: 'text-white',
    },
    { 
        id: 'matrix', 
        name: 'Matrix', 
        description: 'Digital rain aesthetic.',
        palette: ['#000500', '#001a00', '#22c55e', '#4ade80'],
        bgClass: 'bg-black',
        textClass: 'text-[#00FF41]',
    },
    { 
        id: 'cyberpunk', 
        name: 'Cyberpunk', 
        description: 'Neon high tech.',
        palette: ['#050505', '#0f0f13', '#ffee00', '#00f3ff'],
        bgClass: 'bg-[#050505]',
        textClass: 'text-[#00f3ff]',
    },
    { 
        id: 'monokai', 
        name: 'Monokai', 
        description: 'Developer favorite.',
        palette: ['#272822', '#3E3D32', '#FF6188', '#F8F8F2'],
        bgClass: 'bg-[#272822]',
        textClass: 'text-[#f8f8f2]',
    },
    { 
        id: 'frosty', 
        name: 'Frosty', 
        description: 'Cool and airy.',
        palette: ['#f0f9ff', '#e0f2fe', '#38bdf8', '#0284c7'],
        bgClass: 'bg-[#f0f9ff]',
        textClass: 'text-[#0284c7]',
    }
] as const;

const fonts = [
    { id: 'inter', name: 'Modern', family: "'Inter', sans-serif" },
    { id: 'serif', name: 'Elegant', family: "'Playfair Display', serif" },
    { id: 'mono', name: 'Code', family: "'Share Tech Mono', monospace" },
    { id: 'cyber', name: 'Future', family: "'Orbitron', sans-serif" },
];

const MiniWorkspacePreview = ({ theme }: { theme: string }) => {
    const isLight = ['light', 'frosty', 'paper'].includes(theme);
    const backingColor = isLight ? 'bg-white' : 'bg-black';

    return (
        <div className={`${theme} w-64 h-40 rounded-xl overflow-hidden border border-[var(--border-primary)] shadow-2xl flex flex-col text-[var(--text-primary)] bg-[var(--bg-primary)] relative transform hover:scale-[1.02]`}>
            <div className={`absolute inset-0 z-[-2] ${backingColor}`}></div>
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,var(--accent),transparent)]" />
            <div className="h-5 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] flex items-center justify-between px-3 shrink-0 relative z-10">
                <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--danger)]"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--warning)]"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)]"></div>
                </div>
                <div className="w-16 h-1.5 rounded-full bg-[var(--text-secondary)]/20"></div>
            </div>
            <div className="flex flex-1 overflow-hidden relative z-10">
                <div className="w-10 border-r border-[var(--border-primary)] bg-[var(--bg-primary)] flex flex-col items-center py-3 gap-2 shrink-0">
                    <div className="w-5 h-5 rounded-md bg-[var(--accent)]/20 border border-[var(--accent)]/50"></div>
                    <div className="w-4 h-0.5 rounded-full bg-[var(--text-secondary)]/30 mt-1"></div>
                    <div className="w-3 h-0.5 rounded-full bg-[var(--text-secondary)]/20"></div>
                </div>
                <div className="flex-1 flex p-2 gap-2 bg-[var(--bg-primary)]">
                    <div className="flex-1 bg-[var(--bg-secondary)]/50 rounded-lg border border-[var(--border-primary)] p-2 flex flex-col gap-1.5">
                        <div className="w-2/3 h-2 rounded bg-[var(--text-primary)]/10"></div>
                        <div className="w-full h-px bg-[var(--border-primary)]"></div>
                        <div className="flex-1 flex flex-col gap-1">
                            <div className="w-full h-1 rounded bg-[var(--text-secondary)]/10"></div>
                            <div className="w-5/6 h-1 rounded bg-[var(--text-secondary)]/10"></div>
                            <div className="w-4/5 h-1 rounded bg-[var(--text-secondary)]/10"></div>
                        </div>
                    </div>
                    <div className="w-1/3 flex flex-col gap-1.5">
                        <div className="flex-1 bg-[var(--bg-secondary)]/50 rounded-lg border border-[var(--border-primary)] flex items-center justify-center">
                            <div className="w-4 h-4 rounded-full bg-[var(--accent)]/20"></div>
                        </div>
                        <div className="flex-1 bg-[var(--bg-secondary)]/50 rounded-lg border border-[var(--border-primary)]"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ThemeSelectionPage: React.FC<ThemeSelectionPageProps> = ({ currentTheme, onPreviewTheme, onContinue, layoutMode, onLayoutChange }) => {
    const [selectedFont, setSelectedFont] = useState(fonts[0].id);
    const [isFontTransitioning, setIsFontTransitioning] = useState(false);
    const [hoveredTheme, setHoveredTheme] = useState<Theme | null>(null);
    const [wallpaperUrl, setWallpaperUrl] = useState<string | null>(() => localStorage.getItem(WALLPAPER_STORAGE_KEY));
    const wallpaperInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const savedFont = localStorage.getItem('infi-font-body');
        if (savedFont) {
            const found = fonts.find(f => f.family === savedFont);
            if (found) setSelectedFont(found.id);
        }
    }, []);

    const handleFontChange = (fontId: string) => {
        const font = fonts.find(f => f.id === fontId);
        if (font && fontId !== selectedFont) {
            setIsFontTransitioning(true);
            setTimeout(() => {
                document.documentElement.style.setProperty('--font-body', font.family);
                document.documentElement.style.setProperty('--font-heading', font.family);
                localStorage.setItem('infi-font-body', font.family);
                setSelectedFont(fontId);
                setIsFontTransitioning(false);
            }, 300);
        }
    };

    const handleWallpaperChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const url = event.target?.result as string;
                setWallpaperUrl(url);
                localStorage.setItem(WALLPAPER_STORAGE_KEY, url);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const clearWallpaper = () => {
        setWallpaperUrl(null);
        localStorage.removeItem(WALLPAPER_STORAGE_KEY);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const width = rect.width;
        const height = rect.height;
        const xPct = (x / width - 0.5) * 20; 
        const yPct = (y / height - 0.5) * -20; 
        e.currentTarget.style.transform = `perspective(1000px) rotateX(${yPct}deg) rotateY(${xPct}deg) scale(1.1)`;
        e.currentTarget.style.zIndex = '50';
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)`;
        e.currentTarget.style.zIndex = 'auto';
        setHoveredTheme(null);
    };

    return (
        <div className="h-screen w-full bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col items-center overflow-hidden transition-colors duration-500 selection:bg-[var(--accent)] selection:text-white relative">
            
            {/* Dynamic Background */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <SubtleWaveAnimation />
                {wallpaperUrl && (
                    <div 
                        className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 opacity-40 blur-[10px]"
                        style={{ backgroundImage: `url(${wallpaperUrl})` }}
                    />
                )}
            </div>

            <div className="relative z-10 w-full h-full max-w-7xl mx-auto flex flex-col px-6 py-4">
                
                {/* Header */}
                <div className={`flex-shrink-0 text-center mb-4 transition-opacity duration-300 ${isFontTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                    <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[var(--bg-secondary)]/30 backdrop-blur-xl shadow-lg mb-2 text-[var(--accent)] border border-[var(--border-primary)] ring-1 ring-white/10 scale-90">
                        <InfinityIcon className="w-10 h-10" />
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-[var(--text-primary)] to-[var(--text-secondary)] drop-shadow-sm">
                        Design Your Space
                    </h1>
                </div>

                {/* Dashboard Content */}
                <div className="flex-1 flex flex-col items-center justify-center gap-6 min-h-0 w-full max-w-5xl mx-auto pb-4">
                    
                    {/* Theme Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6 w-full overflow-y-auto custom-scrollbar p-2 max-h-[50vh]">
                        {themes.map((theme, index) => {
                            const isSelected = currentTheme === theme.id;
                            const isHovered = hoveredTheme === theme.id;
                            return (
                                <div 
                                    key={theme.id}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                    className="animate-[spring-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards] opacity-0 relative z-10"
                                >
                                    <div
                                        onMouseMove={handleMouseMove}
                                        onMouseEnter={() => setHoveredTheme(theme.id as Theme)}
                                        onMouseLeave={handleMouseLeave}
                                        onClick={() => onPreviewTheme(theme.id as Theme)}
                                        className="relative group h-32 md:h-36 rounded-2xl cursor-pointer transition-transform duration-200 ease-out hover:z-50 shadow-md hover:shadow-xl"
                                    >
                                        <div 
                                            className="absolute inset-0 rounded-2xl opacity-80 group-hover:opacity-100 transition-opacity duration-300 blur-[2px] group-hover:blur-[4px]"
                                            style={{ background: `linear-gradient(135deg, ${theme.palette[2]}, ${theme.palette[3]})` }}
                                        ></div>

                                        <div className={`absolute inset-[2px] rounded-[14px] overflow-hidden flex flex-col ${theme.bgClass} transition-all duration-300`}>
                                            <div className={`absolute top-2 right-2 z-20 transition-all duration-300 transform ${isSelected ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
                                                <div className="bg-white text-black rounded-full p-1 shadow-lg">
                                                    <CheckIcon className="w-4 h-4" />
                                                </div>
                                            </div>

                                            <div className="flex-grow relative p-4 flex flex-col justify-end">
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-2xl transform translate-x-6 -translate-y-6"></div>
                                                
                                                <h3 className={`text-base font-bold tracking-tight mb-2 ${theme.textClass}`}>
                                                    {theme.name}
                                                </h3>
                                                
                                                {/* Color Swatch Boxes - Rectangular boxes showcasing scheme */}
                                                <div className="flex gap-1">
                                                    {theme.palette.map((color, i) => (
                                                        <div 
                                                            key={i} 
                                                            className="flex-1 h-3 rounded-sm border border-black/10 shadow-sm"
                                                            style={{ backgroundColor: color }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div 
                                        className={`absolute -top-48 left-1/2 -translate-x-1/2 z-[100] origin-bottom transition-all duration-500 ease-out
                                            ${isHovered ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'}
                                        `}
                                    >
                                        <MiniWorkspacePreview theme={theme.id} />
                                        <div className="absolute left-1/2 -translate-x-1/2 bottom-[-6px] w-4 h-4 rotate-45 border-b border-r border-[var(--border-primary)] bg-[var(--bg-primary)]"></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Controls Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full animate-[spring-up_0.8s_cubic-bezier(0.16,1,0.3,1)_0.5s_both]">
                        
                        {/* Typography */}
                        <div className="bg-[var(--bg-secondary)]/40 backdrop-blur-md border border-[var(--border-primary)] rounded-3xl p-5 flex flex-col gap-3 shadow-lg hover:border-[var(--accent)] transition-colors duration-300">
                            <div className="flex items-center gap-2 text-[var(--text-secondary)] border-b border-[var(--border-primary)] pb-2">
                                <FontIcon className="w-5 h-5" />
                                <span className="text-sm font-bold uppercase tracking-wider">Typography</span>
                            </div>
                            <div className="grid grid-cols-4 gap-2 w-full">
                                {fonts.map((font) => (
                                    <button
                                        key={font.id}
                                        onClick={() => handleFontChange(font.id)}
                                        style={{ fontFamily: font.family }}
                                        className={`relative group flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-300 ${selectedFont === font.id ? 'bg-[var(--bg-primary)] border-[var(--accent)] shadow-md' : 'bg-transparent border-[var(--border-primary)] hover:bg-[var(--bg-primary)]'}`}
                                    >
                                        <span className="text-xl mb-0.5">Aa</span>
                                        <span className="text-[9px] font-black uppercase tracking-tighter opacity-70">{font.name}</span>
                                        {selectedFont === font.id && <div className="absolute top-1 right-1 text-[var(--accent)]"><CheckIcon className="w-3 h-3" /></div>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Background Image Restoration */}
                        <div className="bg-[var(--bg-secondary)]/40 backdrop-blur-md border border-[var(--border-primary)] rounded-3xl p-5 flex flex-col gap-3 shadow-lg hover:border-[var(--accent)] transition-colors duration-300">
                            <div className="flex items-center gap-2 text-[var(--text-secondary)] border-b border-[var(--border-primary)] pb-2">
                                <ImageIcon className="w-5 h-5" />
                                <span className="text-sm font-bold uppercase tracking-wider">Background</span>
                            </div>
                            <div className="flex items-center gap-4 flex-1">
                                {wallpaperUrl ? (
                                    <div className="relative group w-full flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl border-2 border-[var(--accent)] overflow-hidden shadow-lg shrink-0">
                                            <img src={wallpaperUrl} className="w-full h-full object-cover" alt="Custom wallpaper" />
                                        </div>
                                        <div className="flex flex-col gap-1 overflow-hidden">
                                            <span className="text-[10px] font-bold uppercase text-[var(--text-primary)] truncate">Custom Wallpaper Set</span>
                                            <button onClick={clearWallpaper} className="text-[10px] font-black uppercase text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors">
                                                <TrashIcon className="w-3 h-3" /> Clear
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => wallpaperInputRef.current?.click()}
                                        className="w-full h-full border-2 border-dashed border-[var(--border-primary)] rounded-2xl flex flex-col items-center justify-center gap-2 text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--bg-primary)]/40 transition-all group"
                                    >
                                        <div className="p-2 bg-[var(--bg-primary)] rounded-full shadow-inner animate-pulse group-hover:animate-none">
                                            <PlusIcon className="w-5 h-5" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest">Upload Image</span>
                                    </button>
                                )}
                            </div>
                            <input 
                                type="file" 
                                ref={wallpaperInputRef} 
                                onChange={handleWallpaperChange} 
                                className="hidden" 
                                accept="image/*" 
                            />
                        </div>

                        {/* Interface Layout */}
                        <div className="bg-[var(--bg-secondary)]/40 backdrop-blur-md border border-[var(--border-primary)] rounded-3xl p-5 flex flex-col gap-3 shadow-lg hover:border-[var(--accent)] transition-colors duration-300 md:col-span-2 lg:col-span-2">
                            <div className="flex items-center gap-2 text-[var(--text-secondary)] border-b border-[var(--border-primary)] pb-2">
                                <LayoutDashboardIcon className="w-5 h-5" />
                                <span className="text-sm font-bold uppercase tracking-wider">Interface Layout</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 flex-1">
                                <button
                                    onClick={() => onLayoutChange('modern')}
                                    className={`relative group flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 ${layoutMode === 'modern' ? 'bg-[var(--bg-primary)] border-[var(--accent)] shadow-md' : 'bg-transparent border-[var(--border-primary)] hover:bg-[var(--bg-primary)]'}`}
                                >
                                    <div className="flex gap-1 mb-2 opacity-80">
                                        <div className="w-3 h-4 rounded bg-current opacity-50"></div>
                                        <div className="w-5 h-4 rounded bg-current"></div>
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-tighter opacity-70">Modern (Floating)</span>
                                    {layoutMode === 'modern' && <div className="absolute top-2 right-2 text-[var(--accent)]"><CheckIcon className="w-4 h-4" /></div>}
                                </button>
                                <button
                                    onClick={() => onLayoutChange('classic')}
                                    className={`relative group flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 ${layoutMode === 'classic' ? 'bg-[var(--bg-primary)] border-[var(--accent)] shadow-md' : 'bg-transparent border-[var(--border-primary)] hover:bg-[var(--bg-primary)]'}`}
                                >
                                    <div className="flex gap-0 border border-current p-0.5 opacity-80 mb-2">
                                        <div className="w-3 h-3 border-r border-current"></div>
                                        <div className="w-5 h-3"></div>
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-tighter opacity-70">Classic (Sharp)</span>
                                    {layoutMode === 'classic' && <div className="absolute top-2 right-2 text-[var(--accent)]"><CheckIcon className="w-4 h-4" /></div>}
                                </button>
                            </div>
                        </div>

                    </div>

                </div>

                {/* Continue Button */}
                <div className="flex-shrink-0 mb-4 animate-[popIn_0.5s_cubic-bezier(0.16,1,0.3,1)_0.2s_both] flex justify-center">
                    <button 
                        onClick={onContinue}
                        className="group relative flex items-center gap-3 px-12 py-4 bg-[var(--accent)] text-white rounded-full font-bold text-lg shadow-xl shadow-[var(--accent)]/30 hover:scale-105 hover:shadow-2xl transition-all duration-300 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                        <span>Continue to Workspace</span>
                        <ArrowsRightLeftIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ThemeSelectionPage;
