
import React, { useState, useEffect, useRef } from 'react';
import { WidgetState, WidgetType, Theme } from '../types';
import { WidgetWrapper, PomodoroWidget, ImageWidget, HyperlinkWidget, CalculatorWidget, StickyNoteWidget, MusicPlayerWidget, SpotifyWidget, ToDoListWidget, TerminalWidget, GoogleSearchWidget, DictionaryWidget, TicTacToeWidget, SnakeGameWidget, WidgetSelectionView, ChatGPTWidget, Game2048Widget, NewsWidget, WikipediaWidget, WeatherWidget } from './Widgets';
import { PlusIcon, ChevronLeftIcon, TrashIcon, ImageIcon, NoSymbolIcon, SwatchIcon, MinimizeIcon, HomeIcon } from './Icons';
import { performGoogleSearch } from '../lib/ai';
import { GlobalBackgroundAnimation } from './GlobalBackgroundAnimation';

interface WidgetPageProps {
    onBack: () => void;
    theme: Theme;
    setTheme: (theme: Theme) => void;
    onGoHome?: () => void;
}

const STORAGE_KEY = 'zen-notes-widgets-page';
const WALLPAPER_STORAGE_KEY = 'zen-notes-widgets-wallpaper';

const WidgetPage: React.FC<WidgetPageProps> = ({ onBack, theme, setTheme, onGoHome }) => {
    const [widgets, setWidgets] = useState<WidgetState[]>([]);
    const [activeWidgetIndex, setActiveWidgetIndex] = useState<number | null>(null);
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [expandedWidget, setExpandedWidget] = useState<{ index: number, type: WidgetType } | null>(null);
    const [wallpaperUrl, setWallpaperUrl] = useState<string | null>(null);
    const wallpaperInputRef = useRef<HTMLInputElement>(null);
    const [showThemeMenu, setShowThemeMenu] = useState(false);
    const themeMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) setShowThemeMenu(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const onRemoveWidget = (index: number) => {
        const newWidgets = [...widgets];
        newWidgets.splice(index, 1);
        setWidgets(newWidgets);
    };

    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (e.altKey && e.key.toLowerCase() === 'e') {
                e.preventDefault();
                if (expandedWidget) setExpandedWidget(null);
                widgets.forEach((w, index) => { if (w.type === 'selecting') onRemoveWidget(index); });
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [expandedWidget, widgets, onRemoveWidget]);

    const getAnimationType = () => {
        switch (theme) {
            case 'matrix': return 'matrixRain';
            case 'frosty': return 'fallingLeaves';
            case 'pitch-black': return 'pulsingDots';
            case 'monokai': return 'gridStrobe';
            case 'paper': return 'none';
            default: return 'floatingTiles';
        }
    };

    useEffect(() => {
        try {
            const savedWidgets = localStorage.getItem(STORAGE_KEY);
            if (savedWidgets) setWidgets(JSON.parse(savedWidgets));
            else setWidgets([{ type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }]);
        } catch (e) {
            setWidgets([{ type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }]);
        }
        const savedWallpaper = localStorage.getItem(WALLPAPER_STORAGE_KEY);
        if (savedWallpaper) setWallpaperUrl(savedWallpaper);
    }, []);

    useEffect(() => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets)); } catch (e) {}
    }, [widgets]);

    useEffect(() => {
        if (wallpaperUrl) localStorage.setItem(WALLPAPER_STORAGE_KEY, wallpaperUrl);
        else localStorage.removeItem(WALLPAPER_STORAGE_KEY);
    }, [wallpaperUrl]);

    const handlePlaceholderMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (draggingIndex !== null) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const xPct = (x / rect.width - 0.5) * 20; 
        const yPct = (y / rect.height - 0.5) * -20; 
        e.currentTarget.style.transform = `perspective(1000px) rotateX(${yPct}deg) rotateY(${xPct}deg) scale(1.05)`;
    };

    const handlePlaceholderMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)`;
    };

    const updateWidgetData = (index: number, data: any) => {
        const newWidgets = [...widgets];
        newWidgets[index] = { ...newWidgets[index], data };
        setWidgets(newWidgets);
    };

    const onSelectWidget = (index: number, type: WidgetType) => {
        const newWidgets = [...widgets];
        let initialData: any = {};
        if (type === 'terminal') initialData = { history: ['Welcome to Zen-Terminal.'], cwdId: null, cwdPath: '/' };
        newWidgets[index] = { type, data: initialData };
        setWidgets(newWidgets);
        setActiveWidgetIndex(null);
    };

    const addWidgetSlot = () => {
        if (widgets.length < 24) setWidgets([...widgets, { type: 'empty' }]);
    };
    
    const clearBoard = () => {
        if(confirm("Are you sure?")) setWidgets([{ type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }]);
    }

    const handleDragStart = (e: React.DragEvent, index: number) => {
        // Clear 3D transform immediately to prevent drag image issues
        const target = e.currentTarget as HTMLDivElement;
        target.style.transform = 'none';
        
        setDraggingIndex(index);
        e.dataTransfer.setData('widgetIndex', index.toString());
        e.dataTransfer.setData('text/plain', index.toString()); // Fallback
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (draggingIndex === null || draggingIndex === index) return;
        setDragOverIndex(index);
    };

    const handleDrop = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.stopPropagation();
        const fromIndexStr = e.dataTransfer.getData('widgetIndex') || e.dataTransfer.getData('text/plain');
        const fromIndex = parseInt(fromIndexStr, 10);
        
        if (isNaN(fromIndex) || fromIndex === index) return;
        
        const newWidgets = [...widgets];
        const item = newWidgets[fromIndex];
        newWidgets.splice(fromIndex, 1);
        newWidgets.splice(index, 0, item);
        setWidgets(newWidgets);
        
        setDraggingIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggingIndex(null);
        setDragOverIndex(null);
    };

    const handleTerminalCommand = (index: number, command: string, args: string[]) => {
        const widgetData = widgets[index].data || { history: [] };
        updateWidgetData(index, {
            ...widgetData,
            history: [...widgetData.history, `> ${command} ${args.join(' ')}`, `Command '${command}' executed.`]
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
            const reader = new FileReader();
            reader.onload = (event) => setWallpaperUrl(event.target?.result as string);
            reader.readAsDataURL(e.target.files[0]);
            e.target.value = '';
        }
    };

    return (
        <div className={`h-screen w-full flex flex-col overflow-hidden transition-colors duration-500 relative ${wallpaperUrl ? 'text-white' : 'bg-[var(--bg-primary)] text-[var(--text-primary)]'}`}>
            <GlobalBackgroundAnimation animationType={getAnimationType()} />
            {wallpaperUrl && <div className="absolute inset-0 z-[-1] bg-cover bg-center" style={{ backgroundImage: `url(${wallpaperUrl})` }} />}
            {wallpaperUrl && <div className="absolute inset-0 z-[-1] bg-black/40 backdrop-blur-sm" />}
            <input type="file" ref={wallpaperInputRef} onChange={handleWallpaperChange} className="hidden" accept="image/*" />

            {expandedWidget && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className={`relative bg-[var(--bg-secondary)] shadow-2xl rounded-xl overflow-hidden border border-[var(--border-primary)] animate-[spring-up_0.5s_cubic-bezier(0.16,1,0.3,1)] ${expandedWidget.type === 'calculator' ? 'w-[320px] h-[500px]' : (expandedWidget.type === 'wikipedia' ? 'w-full max-w-4xl h-[90vh]' : 'w-full max-w-2xl h-[80vh]')}`}>
                        <button onClick={() => setExpandedWidget(null)} className="absolute top-2 right-2 z-50 p-2 rounded-full bg-black/20 hover:bg-red-500 hover:text-white text-[var(--text-primary)] shadow-md backdrop-blur-md border border-white/10 transition-all"><MinimizeIcon className="w-5 h-5" /></button>
                        {expandedWidget.type === 'calculator' && <CalculatorWidget isScientific={true} onClose={() => setExpandedWidget(null)} />}
                        {expandedWidget.type === 'googlesearch' && <GoogleSearchWidget data={widgets[expandedWidget.index].data} onSearch={(q) => handleSearch(expandedWidget.index, q)} onChange={(data) => updateWidgetData(expandedWidget.index, data)} />}
                        {expandedWidget.type === 'chatgpt' && <ChatGPTWidget data={widgets[expandedWidget.index].data} onChange={(d) => updateWidgetData(expandedWidget.index, d)} />}
                        {expandedWidget.type === 'news' && <NewsWidget data={widgets[expandedWidget.index].data} onChange={(d) => updateWidgetData(expandedWidget.index, d)} isExpanded={true} />}
                        {expandedWidget.type === 'wikipedia' && <WikipediaWidget data={widgets[expandedWidget.index].data} onChange={(d) => updateWidgetData(expandedWidget.index, d)} isExpanded={true} />}
                    </div>
                </div>
            )}

            <header className={`p-4 md:px-8 pl-32 md:pl-36 border-b flex flex-col md:flex-row justify-between items-center z-20 gap-4 shadow-sm backdrop-blur-md ${wallpaperUrl ? 'bg-black/30 border-white/10' : 'bg-[var(--bg-secondary)]/70 border-[var(--border-primary)]'}`}>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <button onClick={onBack} className={`p-2 rounded-full border transition-all btn-press flex items-center gap-2 px-4 ${wallpaperUrl ? 'bg-white/10 border-white/10' : 'bg-[var(--bg-secondary)] border-[var(--border-primary)] hover:bg-[var(--bg-primary)]'}`}><ChevronLeftIcon className="w-4 h-4" /><span className="font-bold text-sm">Back</span></button>
                    {onGoHome && (
                        <button onClick={onGoHome} className={`p-2 rounded-full border transition-all btn-press flex items-center justify-center ${wallpaperUrl ? 'bg-white/10 border-white/10' : 'bg-[var(--bg-secondary)] border-[var(--border-primary)] hover:bg-[var(--bg-primary)] text-[var(--accent)]'}`} title="Home">
                            <HomeIcon className="w-5 h-5" />
                        </button>
                    )}
                    <h1 className="text-xl font-bold tracking-tight">Widget Board</h1>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <div className="relative" ref={themeMenuRef}>
                        <button onClick={() => setShowThemeMenu(prev => !prev)} className={`p-2 rounded-full border transition-all btn-press flex items-center justify-center ${wallpaperUrl ? 'bg-white/10 border-white/10' : 'bg-[var(--bg-secondary)] border-[var(--border-primary)] hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`} title="Change Theme"><SwatchIcon className="w-4 h-4" /></button>
                        {showThemeMenu && (
                            <div className={`absolute top-full right-0 mt-2 z-50 rounded-xl shadow-xl border border-[var(--border-primary)] animated-popover p-2 flex gap-2 w-max
                                ${
                                    theme === 'light' ? 'bg-white border-gray-200' : 
                                    theme === 'paper' ? 'bg-[#fcfaf2] border-[#d4d0c0]' :
                                    theme === 'frosty' ? 'bg-[#f0f9ff] border-[#bae6fd]' :
                                    theme === 'matrix' ? 'bg-black border-[#00FF41]' :
                                    theme === 'cyberpunk' ? 'bg-[#050505] border-[#00f3ff]' :
                                    theme === 'monokai' ? 'bg-[#272822] border-[#75715E]' :
                                    'bg-[#101010] border-[#333333]'
                                }
                            `}>
                                {[{ id: 'light', label: 'Light', style: 'bg-white border-gray-200' }, { id: 'matrix', label: 'Matrix', style: 'bg-black border-green-500' }, { id: 'monokai', label: 'Monokai', style: 'bg-[#272822]' }, { id: 'pitch-black', label: 'Dark', style: 'bg-black' }, { id: 'cyberpunk', label: 'Cyber', style: 'bg-zinc-950' }, { id: 'frosty', label: 'Frosty', style: 'bg-blue-100' }, { id: 'paper', label: 'Paper', style: 'bg-[#fdfbf7]' }].map((t) => (
                                    <button key={t.id} onClick={() => { setTheme(t.id as Theme); setShowThemeMenu(false); }} className="flex flex-col items-center gap-1 p-1"><div className={`w-8 h-8 rounded-full border-2 ${t.style} ${theme === t.id ? 'ring-2 ring-[var(--accent)]' : ''}`}></div><span className="text-[10px] text-[var(--text-secondary)]">{t.label}</span></button>
                                ))}
                            </div>
                        )}
                    </div>
                    {wallpaperUrl ? <button onClick={() => setWallpaperUrl(null)} className="p-2 rounded-full bg-red-500/80 text-white hover:bg-red-600 transition-all"><NoSymbolIcon className="w-4 h-4" /></button> : <button onClick={() => wallpaperInputRef.current?.click()} className="p-2 rounded-full bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-primary)] hover:text-[var(--accent)] transition-all"><ImageIcon className="w-4 h-4" /></button>}
                    <button onClick={clearBoard} className={`px-4 py-2 text-xs font-bold border rounded-lg transition-all ${wallpaperUrl ? 'bg-white/10 border-white/20 text-red-300' : 'text-[var(--danger)] bg-[var(--bg-primary)] border-[var(--border-primary)] hover:bg-[var(--danger)] hover:text-white'}`}>Clear All</button>
                    <button onClick={addWidgetSlot} disabled={widgets.length >= 24} className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-[var(--accent)]/20 flex items-center gap-2"><PlusIcon className="w-4 h-4" /><span>Add Slot ({widgets.length}/24)</span></button>
                </div>
            </header>

            <div className="flex-grow overflow-y-auto p-4 md:p-6 custom-scrollbar relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 w-full max-w-7xl mx-auto pb-20">
                    {widgets.map((widget, index) => (
                        <div 
                            key={index} 
                            draggable={widget.type !== 'selecting' && widget.type !== 'empty'} 
                            onDragStart={(e) => handleDragStart(e, index)} 
                            onDragOver={(e) => handleDragOver(e, index)} 
                            onDrop={(e) => handleDrop(e, index)} 
                            onDragEnd={handleDragEnd} 
                            onDragLeave={() => setDragOverIndex(null)} 
                            className={`relative rounded-2xl overflow-hidden transition-all duration-300 group aspect-square ${activeWidgetIndex === index ? 'ring-2 ring-[var(--accent)] scale-[1.05] z-20 shadow-2xl' : ''} ${dragOverIndex === index ? 'scale-105 opacity-90 ring-2 ring-[var(--accent)]' : ''} ${widget.type === 'empty' ? `border-2 border-dashed ${wallpaperUrl ? 'bg-white/5 border-white/20' : 'bg-[var(--bg-secondary)]/30 border-[var(--border-primary)] hover:border-[var(--accent)]'}` : `${wallpaperUrl ? 'bg-black/60 border-white/10' : 'bg-[var(--bg-secondary)] border border-[var(--border-primary)]'} shadow-lg hover:-translate-y-2 hover:shadow-2xl`}`}
                        >
                            {widget.type !== 'empty' && widget.type !== 'selecting' && (
                                <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1"><button onClick={() => onRemoveWidget(index)} className="p-1.5 bg-[var(--danger)] text-white rounded-full shadow-md transition-transform"><TrashIcon className="w-3 h-3" /></button></div>
                            )}
                            {(() => {
                                switch (widget.type) {
                                    case 'selecting': return <WidgetSelectionView onSelect={(type) => onSelectWidget(index, type)} onCancel={() => onRemoveWidget(index)} iconSize="normal" />;
                                    case 'empty': return <button onClick={() => onSelectWidget(index, 'selecting')} onMouseMove={handlePlaceholderMouseMove} onMouseLeave={handlePlaceholderMouseLeave} className={`w-full h-full flex flex-col items-center justify-center transition-transform duration-200 group/empty ${wallpaperUrl ? 'text-white/70 hover:text-white' : 'text-[var(--text-secondary)] hover:text-[var(--accent)]'}`}><div className={`p-4 rounded-full mb-3 shadow-sm ${wallpaperUrl ? 'bg-white/20' : 'bg-[var(--bg-primary)]/50'}`}><PlusIcon className="w-8 h-8 opacity-50 group-hover/empty:opacity-100" /></div><span className="text-sm font-bold">Add Widget</span></button>;
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
                                    case 'wikipedia': return <WidgetWrapper title="Wikipedia" noPadding={true}><WikipediaWidget data={widget.data} onChange={(d) => updateWidgetData(index, d)} onExpand={() => setExpandedWidget({ index, type: 'wikipedia' })} /></WidgetWrapper>;
                                    case 'weather': return <WidgetWrapper title="Weather" noPadding={true}><WeatherWidget data={widget.data} onChange={(d) => updateWidgetData(index, d)} /></WidgetWrapper>;
                                    case 'dictionary': return <WidgetWrapper title=""><DictionaryWidget data={widget.data} onChange={(d) => updateWidgetData(index, d)} /></WidgetWrapper>;
                                    case 'tictactoe': return <WidgetWrapper title=""><TicTacToeWidget /></WidgetWrapper>;
                                    case 'snake': return <WidgetWrapper title=""><SnakeGameWidget /></WidgetWrapper>;
                                    case 'game2048': return <WidgetWrapper title=""><Game2048Widget /></WidgetWrapper>;
                                    default: return null;
                                }
                            })()}
                        </div>
                    ))}
                    <button onClick={addWidgetSlot} disabled={widgets.length >= 24} className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all duration-300 group ${wallpaperUrl ? 'bg-white/5 border-white/20 text-white/50 hover:text-white' : 'bg-[var(--bg-secondary)]/30 border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--accent)]'} ${widgets.length >= 24 ? 'opacity-50' : 'hover:shadow-lg'}`}><div className={`p-4 rounded-full mb-2 transition-transform duration-300 group-hover:scale-110 ${wallpaperUrl ? 'bg-white/10' : 'bg-[var(--bg-primary)]/50'}`}><PlusIcon className="w-8 h-8" /></div><span className="text-sm font-bold uppercase">New Slot</span></button>
                </div>
            </div>
        </div>
    );
};

export default WidgetPage;
