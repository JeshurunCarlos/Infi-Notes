
import React, { useState, useEffect, useRef } from 'react';
import { WidgetState, WidgetType, Theme } from '../types';
import { WidgetWrapper, PomodoroWidget, ImageWidget, HyperlinkWidget, CalculatorWidget, StickyNoteWidget, MusicPlayerWidget, SpotifyWidget, ToDoListWidget, TerminalWidget, GoogleSearchWidget, DictionaryWidget, ZipGameWidget, TicTacToeWidget, SnakeGameWidget, WidgetSelectionView, ChatGPTWidget, Game2048Widget, NewsWidget } from './Widgets';
import { PlusIcon, ChevronLeftIcon, TrashIcon, ImageIcon, NoSymbolIcon, ThemeIcon, ArrowsPointingInIcon } from './Icons';
import { performGoogleSearch } from '../lib/ai';
import { GlobalBackgroundAnimation } from './GlobalBackgroundAnimation';

interface WidgetPageProps {
    onBack: () => void;
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const STORAGE_KEY = 'zen-notes-widgets-page';
const WALLPAPER_STORAGE_KEY = 'zen-notes-widgets-wallpaper';

const WidgetPage: React.FC<WidgetPageProps> = ({ onBack, theme, setTheme }) => {
    const [widgets, setWidgets] = useState<WidgetState[]>([]);
    const [activeWidgetIndex, setActiveWidgetIndex] = useState<number | null>(null);
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    
    // Unified Expansion State
    const [expandedWidget, setExpandedWidget] = useState<{ index: number, type: WidgetType } | null>(null);
    
    // Wallpaper State
    const [wallpaperUrl, setWallpaperUrl] = useState<string | null>(null);
    const wallpaperInputRef = useRef<HTMLInputElement>(null);

    // Theme Menu State
    const [showThemeMenu, setShowThemeMenu] = useState(false);
    const themeMenuRef = useRef<HTMLDivElement>(null);

    // Click outside listener for theme menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
                setShowThemeMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Handle Global Alt+E to close expansions or selections
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (e.altKey && e.key.toLowerCase() === 'e') {
                e.preventDefault();
                if (expandedWidget) {
                    setExpandedWidget(null);
                }
                // Check if any widget is in selecting mode
                widgets.forEach((w, index) => {
                    if (w.type === 'selecting') {
                        onRemoveWidget(index);
                    }
                });
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [expandedWidget, widgets]);

    // Determine background animation based on theme
    const getAnimationType = () => {
        switch (theme) {
            case 'matrix': return 'matrixRain';
            case 'frosty': return 'fallingLeaves';
            case 'pitch-black': return 'pulsingDots';
            case 'monokai': return 'gridStrobe';
            default: return 'floatingTiles';
        }
    };

    // Load Widgets and Wallpaper
    useEffect(() => {
        const savedWidgets = localStorage.getItem(STORAGE_KEY);
        if (savedWidgets) {
            setWidgets(JSON.parse(savedWidgets));
        } else {
            // Default 2x2 grid
            setWidgets([
                { type: 'empty' }, { type: 'empty' },
                { type: 'empty' }, { type: 'empty' }
            ]);
        }

        const savedWallpaper = localStorage.getItem(WALLPAPER_STORAGE_KEY);
        if (savedWallpaper) {
            setWallpaperUrl(savedWallpaper);
        }
    }, []);

    // Save Widgets
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
    }, [widgets]);

    // Save Wallpaper
    useEffect(() => {
        if (wallpaperUrl) {
            localStorage.setItem(WALLPAPER_STORAGE_KEY, wallpaperUrl);
        } else {
            localStorage.removeItem(WALLPAPER_STORAGE_KEY);
        }
    }, [wallpaperUrl]);

    const updateWidgetData = (index: number, data: any) => {
        const newWidgets = [...widgets];
        newWidgets[index] = { ...newWidgets[index], data };
        setWidgets(newWidgets);
    };

    const onSelectWidget = (index: number, type: WidgetType) => {
        const newWidgets = [...widgets];
        let initialData: any = {};
        if (type === 'terminal') {
            initialData = {
                history: ['Welcome to Zen-Terminal.'],
                cwdId: null,
                cwdPath: '/',
            };
        }
        newWidgets[index] = { type, data: initialData };
        setWidgets(newWidgets);
        setActiveWidgetIndex(null);
    };

    const onRemoveWidget = (index: number) => {
        const newWidgets = [...widgets];
        newWidgets[index] = { type: 'empty' };
        setWidgets(newWidgets);
    };

    const addWidgetSlot = () => {
        if (widgets.length < 16) {
            setWidgets([...widgets, { type: 'empty' }]);
        }
    };
    
    const clearBoard = () => {
        if(confirm("Are you sure you want to clear all widgets?")) {
            setWidgets([{ type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }]);
        }
    }

    // Drag and Drop Logic
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggingIndex(index);
        e.dataTransfer.setData('widgetIndex', index.toString());
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggingIndex === null || draggingIndex === index) return;
        setDragOverIndex(index);
    };

    const handleDrop = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        const fromIndex = parseInt(e.dataTransfer.getData('widgetIndex'));
        if (fromIndex === index) return;

        const newWidgets = [...widgets];
        const item = newWidgets[fromIndex];
        newWidgets.splice(fromIndex, 1);
        newWidgets.splice(index, 0, item);
        
        setWidgets(newWidgets);
        setDraggingIndex(null);
        setDragOverIndex(null);
    };

    // Calculate Grid Columns dynamically but with responsive bounds
    const getGridCols = () => {
        const count = widgets.length;
        if (count <= 4) return 'grid-cols-1 sm:grid-cols-2';
        if (count <= 9) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    };

    const handleTerminalCommand = (index: number, command: string, args: string[]) => {
        const widgetData = widgets[index].data || { history: [] };
        const output = `Command '${command}' executed. (File system specific commands limited in this view)`;
        updateWidgetData(index, {
            ...widgetData,
            history: [...widgetData.history, `> ${command} ${args.join(' ')}`, output]
        });
    };

    const handleSearch = async (index: number, query: string) => {
        updateWidgetData(index, { ...widgets[index].data, loading: true, error: null });
        try {
            const result = await performGoogleSearch(query);
            updateWidgetData(index, { query, ...result, loading: false });
        } catch (e) {
            updateWidgetData(index, { ...widgets[index].data, loading: false, error: "Search Failed" });
        }
    };

    const handleWallpaperChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                const imageUrl = event.target?.result as string;
                setWallpaperUrl(imageUrl);
            };
            reader.readAsDataURL(file);
            // Reset input
            e.target.value = '';
        }
    };

    return (
        <div 
            className={`h-screen w-full flex flex-col overflow-hidden transition-colors duration-500 relative ${wallpaperUrl ? 'text-white' : 'bg-[var(--bg-primary)] text-[var(--text-primary)]'}`}
        >
            
            {/* Background Layer 1: Theme Animation */}
            <GlobalBackgroundAnimation animationType={getAnimationType()} />

            {/* Background Layer 2: Custom Wallpaper */}
            {wallpaperUrl && (
                <div 
                    className="absolute inset-0 z-[-1] bg-cover bg-center transition-opacity duration-500"
                    style={{ backgroundImage: `url(${wallpaperUrl})` }}
                />
            )}

            {/* Background Layer 3: Glass Overlay (Only if wallpaper exists) */}
            {wallpaperUrl && (
                <div className="absolute inset-0 z-[-1] bg-black/40 backdrop-blur-sm" />
            )}

            {/* Hidden File Input */}
            <input 
                type="file" 
                ref={wallpaperInputRef} 
                onChange={handleWallpaperChange} 
                className="hidden" 
                accept="image/*" 
            />

            {/* Expanded Widget Overlay */}
            {expandedWidget && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-[fade-in-scale_0.3s_ease-out] p-4">
                    <div className={`relative bg-[var(--bg-secondary)] shadow-2xl rounded-xl overflow-hidden border border-[var(--border-primary)] animate-[spring-up_0.5s_cubic-bezier(0.16,1,0.3,1)]
                        ${expandedWidget.type === 'calculator' ? 'w-[320px] h-[500px]' : 'w-full max-w-2xl h-[80vh]'}
                    `}>
                        <button 
                            onClick={() => setExpandedWidget(null)}
                            className="absolute top-2 right-2 z-50 p-2 rounded-full bg-[var(--bg-primary)] hover:bg-[var(--border-primary)] shadow-md transition-all btn-press"
                        >
                            <ArrowsPointingInIcon className="w-5 h-5" />
                        </button>
                        
                        {expandedWidget.type === 'calculator' && (
                            <CalculatorWidget 
                                isScientific={true} 
                                onClose={() => setExpandedWidget(null)} 
                            />
                        )}
                        {expandedWidget.type === 'googlesearch' && (
                            <GoogleSearchWidget 
                                data={widgets[expandedWidget.index].data} 
                                onSearch={(q) => handleSearch(expandedWidget.index, q)}
                                onChange={(data) => updateWidgetData(expandedWidget.index, data)}
                            />
                        )}
                        {expandedWidget.type === 'chatgpt' && (
                            <ChatGPTWidget 
                                data={widgets[expandedWidget.index].data}
                                onChange={(d) => updateWidgetData(expandedWidget.index, d)}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Header */}
            <header className={`p-4 md:px-8 border-b flex flex-col md:flex-row justify-between items-center z-20 gap-4 shadow-sm transition-colors
                ${wallpaperUrl ? 'bg-black/30 border-white/20 backdrop-blur-md' : 'bg-[var(--bg-secondary)]/70 border-[var(--border-primary)] backdrop-blur-md'}`}
            >
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <button 
                        onClick={onBack} 
                        className={`p-2 rounded-full border transition-all btn-press flex items-center gap-2 px-4
                            ${wallpaperUrl 
                                ? 'bg-white/10 border-white/20 hover:bg-white/20 text-white' 
                                : 'bg-[var(--bg-secondary)] border-[var(--border-primary)] hover:bg-[var(--bg-primary)]'}`}
                    >
                        <ChevronLeftIcon className="w-4 h-4" />
                        <span className="font-bold text-sm">Back</span>
                    </button>
                    <h1 className="text-xl font-bold tracking-tight hidden sm:block">Widget Board</h1>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    
                    {/* Theme Switcher */}
                    <div className="relative" ref={themeMenuRef}>
                        <button 
                            onClick={() => setShowThemeMenu(prev => !prev)} 
                            className={`p-2 rounded-full border transition-all btn-press flex items-center justify-center
                                ${wallpaperUrl 
                                    ? 'bg-white/10 border-white/20 hover:bg-white/20 text-white' 
                                    : 'bg-[var(--bg-secondary)] border-[var(--border-primary)] hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                            title="Change Theme"
                        >
                            <ThemeIcon className="w-4 h-4" />
                        </button>
                        {showThemeMenu && (
                            <div className="absolute top-full right-0 mt-2 z-50 bg-[var(--bg-secondary)] rounded-xl shadow-xl border border-[var(--border-primary)] animated-popover p-2 flex gap-2 font-sans w-max">
                                {[
                                    { id: 'light', label: 'Light', style: 'bg-white border-gray-200 text-gray-800' },
                                    { id: 'matrix', label: 'Matrix', style: 'bg-black border-green-500 text-green-500 font-mono' },
                                    { id: 'monokai', label: 'Monokai', style: 'bg-[#272822] border-[#75715E] text-[#F92672]' },
                                    { id: 'pitch-black', label: 'Dark', style: 'bg-black border-gray-800 text-white' },
                                    { id: 'frosty', label: 'Frosty', style: 'bg-blue-100 border-blue-200 text-blue-600' }
                                ].map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => { setTheme(t.id as Theme); setShowThemeMenu(false); }}
                                        className={`flex flex-col items-center gap-1 group p-1`}
                                    >
                                        <div className={`w-8 h-8 rounded-full border-2 shadow-sm transition-transform group-hover:scale-110 ${t.style} ${theme === t.id ? 'ring-2 ring-[var(--accent)] ring-offset-1 ring-offset-[var(--bg-secondary)]' : ''}`}></div>
                                        <span className="text-[10px] font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">{t.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Wallpaper Controls */}
                    {wallpaperUrl ? (
                        <button 
                            onClick={() => setWallpaperUrl(null)}
                            className="p-2 rounded-full bg-red-500/80 text-white hover:bg-red-600 transition-all btn-press"
                            title="Remove Wallpaper"
                        >
                            <NoSymbolIcon className="w-4 h-4" />
                        </button>
                    ) : (
                        <button 
                            onClick={() => wallpaperInputRef.current?.click()}
                            className="p-2 rounded-full bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-primary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all btn-press"
                            title="Set Background Image"
                        >
                            <ImageIcon className="w-4 h-4" />
                        </button>
                    )}

                    <div className={`h-6 w-px ${wallpaperUrl ? 'bg-white/20' : 'bg-[var(--border-primary)]'}`}></div>

                    <button
                        onClick={clearBoard}
                        className={`px-4 py-2 text-xs font-bold border rounded-lg transition-all btn-press
                            ${wallpaperUrl 
                                ? 'bg-white/10 border-white/20 text-red-300 hover:bg-red-500/20 hover:text-white' 
                                : 'text-[var(--danger)] bg-[var(--bg-primary)] border border-[var(--border-primary)] hover:bg-[var(--danger)] hover:text-white'}`}
                    >
                        Clear All
                    </button>
                    <button 
                        onClick={addWidgetSlot} 
                        disabled={widgets.length >= 16}
                        className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all btn-press flex items-center gap-2 shadow-lg shadow-[var(--accent)]/20"
                    >
                        <PlusIcon className="w-4 h-4" />
                        <span>Add Slot ({widgets.length}/16)</span>
                    </button>
                </div>
            </header>

            {/* Grid Area */}
            <div className="flex-grow overflow-y-auto p-4 md:p-8 custom-scrollbar relative z-10">
                <div className={`grid gap-6 w-full max-w-7xl mx-auto content-start ${getGridCols()} auto-rows-[minmax(280px,1fr)] transition-all duration-500`}>
                    {widgets.map((widget, index) => (
                        <div
                            key={index}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDrop={(e) => handleDrop(e, index)}
                            onDragLeave={() => setDragOverIndex(null)}
                            className={`relative rounded-2xl overflow-hidden transition-all duration-300 group
                                ${activeWidgetIndex === index ? 'ring-2 ring-[var(--accent)] shadow-xl scale-[1.02]' : ''}
                                ${dragOverIndex === index ? 'scale-105 opacity-90 ring-2 ring-[var(--accent)]' : ''}
                                ${widget.type === 'empty' 
                                    ? `border-2 border-dashed ${wallpaperUrl ? 'bg-white/10 border-white/30 hover:bg-white/20' : 'bg-[var(--bg-secondary)]/30 border-[var(--border-primary)] hover:border-[var(--accent)] hover:bg-[var(--bg-secondary)]/50'} backdrop-blur-sm` 
                                    : `${wallpaperUrl ? 'bg-black/60 border-white/10' : 'bg-[var(--bg-secondary)] border-[var(--border-primary)]'} border shadow-lg hover:-translate-y-1 hover:shadow-xl`
                                }
                            `}
                            style={{ aspectRatio: '1/1' }}
                        >
                            {/* Controls Overlay */}
                            {widget.type !== 'empty' && widget.type !== 'selecting' && (
                                <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    <button onClick={() => onRemoveWidget(index)} className="p-1.5 bg-[var(--danger)] text-white rounded-full shadow-md hover:scale-110 transition-transform btn-press">
                                        <TrashIcon className="w-3 h-3" />
                                    </button>
                                </div>
                            )}

                            {/* Render Logic */}
                            {(() => {
                                switch (widget.type) {
                                    case 'selecting':
                                        return <WidgetSelectionView onSelect={(type) => onSelectWidget(index, type)} onCancel={() => onRemoveWidget(index)} />;
                                    case 'empty':
                                        return (
                                            <button 
                                                onClick={() => onSelectWidget(index, 'selecting')}
                                                className={`w-full h-full flex flex-col items-center justify-center transition-colors group/empty ${wallpaperUrl ? 'text-white/70 hover:text-white' : 'text-[var(--text-secondary)] hover:text-[var(--accent)]'}`}
                                            >
                                                <div className={`p-4 rounded-full mb-3 group-hover/empty:scale-110 transition-transform shadow-sm ${wallpaperUrl ? 'bg-white/20' : 'bg-[var(--bg-primary)]/50'}`}>
                                                    <PlusIcon className="w-8 h-8 opacity-50 group-hover/empty:opacity-100" />
                                                </div>
                                                <span className="text-sm font-bold">Add Widget</span>
                                            </button>
                                        );
                                    case 'pomodoro': return <WidgetWrapper title=""><PomodoroWidget /></WidgetWrapper>;
                                    case 'image': return <WidgetWrapper title=""><ImageWidget data={widget.data} onChange={d => updateWidgetData(index, d)} /></WidgetWrapper>;
                                    case 'hyperlink': return <WidgetWrapper title=""><HyperlinkWidget data={widget.data} onChange={d => updateWidgetData(index, d)} /></WidgetWrapper>;
                                    case 'calculator': return <WidgetWrapper title=""><CalculatorWidget onExpand={() => setExpandedWidget({ index, type: 'calculator' })} /></WidgetWrapper>;
                                    case 'stickynote': return <WidgetWrapper title=""><StickyNoteWidget data={widget.data} onChange={d => updateWidgetData(index, d)} /></WidgetWrapper>;
                                    case 'music': return <WidgetWrapper title=""><MusicPlayerWidget data={widget.data} onChange={d => updateWidgetData(index, d)} /></WidgetWrapper>;
                                    case 'spotify': return <WidgetWrapper title=""><SpotifyWidget data={widget.data} onChange={d => updateWidgetData(index, d)} /></WidgetWrapper>;
                                    case 'todolist': return <WidgetWrapper title=""><ToDoListWidget data={widget.data} onChange={d => updateWidgetData(index, d)} /></WidgetWrapper>;
                                    case 'terminal': return <WidgetWrapper title=""><TerminalWidget onClose={() => onRemoveWidget(index)} data={widget.data} onCommand={(c, a) => handleTerminalCommand(index, c, a)} /></WidgetWrapper>;
                                    case 'googlesearch': return <WidgetWrapper title=""><GoogleSearchWidget data={widget.data} onSearch={q => handleSearch(index, q)} onExpand={() => setExpandedWidget({ index, type: 'googlesearch' })} /></WidgetWrapper>;
                                    case 'chatgpt': return <WidgetWrapper title=""><ChatGPTWidget data={widget.data} onChange={(d) => updateWidgetData(index, d)} onExpand={() => setExpandedWidget({ index, type: 'chatgpt' })} /></WidgetWrapper>;
                                    case 'news': return <WidgetWrapper title=""><NewsWidget /></WidgetWrapper>;
                                    case 'dictionary': return <WidgetWrapper title=""><DictionaryWidget data={widget.data} onChange={(d) => updateWidgetData(index, d)} /></WidgetWrapper>;
                                    case 'zipgame': return <WidgetWrapper title=""><ZipGameWidget /></WidgetWrapper>;
                                    case 'tictactoe': return <WidgetWrapper title=""><TicTacToeWidget /></WidgetWrapper>;
                                    case 'snake': return <WidgetWrapper title=""><SnakeGameWidget /></WidgetWrapper>;
                                    case 'game2048': return <WidgetWrapper title=""><Game2048Widget /></WidgetWrapper>;
                                    default: return null;
                                }
                            })()}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WidgetPage;
