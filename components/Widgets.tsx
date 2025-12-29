
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { WidgetType, ToDoItem } from '../types';
import { TimerIcon, ImageIcon, LinkIcon, CalculatorIcon, CloseIcon, MicrophoneIcon, ClipboardIcon, MusicNoteIcon, PlayIcon, PauseIcon, BackwardIcon, ForwardIcon, SpotifyIcon, PlusIcon, MinusIcon, TerminalIcon, ArrowsPointingInIcon, EyeIcon, EyeSlashIcon, GoogleIcon, ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon, SpeakerWaveIcon, QueueListIcon, TrashIcon, MusicalNoteIcon, SpeakerXMarkIcon, FolderIcon, SparklesIcon, ArrowPathIcon, LanguageIcon, ClipboardDocumentCheckIcon, ArrowsPointingOutIcon, BoltIcon, ChatBubbleLeftRightIcon, CubeIcon, ListBulletIcon, Squares2X2Icon, NewspaperIcon, ArrowDownTrayIcon, GlobeIcon, BookOpenIcon, CloudIcon, SignalSlashIcon, CheckIcon } from './Icons';
import Spinner from './Spinner';
import ToDoList from './ToDoList';
import { performGoogleSearch, lookupDictionary, DictionaryResult, performChat, fetchNews, NewsItem, fetchWeather, WeatherData } from '../lib/ai';
import { CalculatorWidget } from './CalculatorWidget';

// Re-export CalculatorWidget
export { CalculatorWidget };

declare global {
  interface Window {
    jsmediatags: any;
  }
}

// --- Loading Overlay for Widgets ---
const WidgetLoadingOverlay: React.FC<{ label?: string }> = ({ label = "Connecting..." }) => (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[var(--bg-secondary)]/80 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]">
        <div className="relative group">
            <div className="absolute inset-0 bg-[var(--accent)]/20 blur-xl rounded-full animate-pulse"></div>
            <Spinner className="w-8 h-8 text-[var(--accent)] relative z-10" />
        </div>
        <span className="mt-3 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] animate-pulse">{label}</span>
    </div>
);

// --- Offline Placeholder ---
const OfflinePlaceholder: React.FC<{ label: string }> = ({ label }) => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 text-center group">
        <SignalSlashIcon className="w-8 h-8 text-rose-500 mb-2 opacity-60 group-hover:opacity-100 transition-opacity" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label} Required</span>
        <span className="text-[8px] text-slate-500 mt-1">Please connect to internet</span>
    </div>
);

// --- Simple Markdown Parser Component ---
const SimpleMarkdown: React.FC<{ content: string }> = ({ content }) => {
    if (!content) return null;
    const renderInline = (text: string) => {
        const parts = text.split(/(\*\*[^*]+\*\*|_[^_]+_|`[^`]+`|!\[[^\]]*\]\([^)]+\)|\[[^\]]+\]\([^)]+\))/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="font-bold text-[var(--text-primary)]">{part.slice(2, -2)}</strong>;
            if (part.startsWith('_') && part.endsWith('_')) return <em key={i} className="italic text-[var(--text-secondary)]">{part.slice(1, -1)}</em>;
            if (part.startsWith('`') && part.endsWith('`')) return <code key={i} className="bg-[var(--bg-primary)] border border-[var(--border-primary)] px-1 rounded font-mono text-[var(--accent)] text-xs">{part.slice(1, -1)}</code>;
            if (part.startsWith('![') && part.includes('](') && part.endsWith(')')) {
                const match = part.match(/!\[(.*?)\]\((.*?)\)/);
                if (match) return <img key={i} src={match[2]} alt={match[1]} className="max-w-full rounded-lg my-2 border border-[var(--border-primary)]" />;
            }
            if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
                const match = part.match(/\[(.*?)\]\((.*?)\)/);
                if (match) return <a key={i} href={match[2]} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline font-medium">{match[1]}</a>;
            }
            return part;
        });
    };
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let listBuffer: React.ReactNode[] = [];
    let inList = false;
    lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            inList = true;
            listBuffer.push(<li key={`li-${index}`} className="mb-1">{renderInline(trimmed.substring(2))}</li>);
            return;
        } 
        if (inList) {
            elements.push(<ul key={`ul-${index}`} className="list-disc pl-5 mb-2 space-y-1">{listBuffer}</ul>);
            listBuffer = [];
            inList = false;
        }
        if (!trimmed) return;
        if (trimmed.startsWith('### ')) elements.push(<h3 key={index} className="text-sm font-bold mt-3 mb-1 text-[var(--text-primary)]">{renderInline(trimmed.substring(4))}</h3>);
        else if (trimmed.startsWith('## ')) elements.push(<h2 key={index} className="text-base font-bold mt-4 mb-2 text-[var(--text-primary)]">{renderInline(trimmed.substring(3))}</h2>);
        else if (trimmed.startsWith('# ')) elements.push(<h1 key={index} className="text-lg font-bold mt-4 mb-2 text-[var(--text-primary)]">{renderInline(trimmed.substring(2))}</h1>);
        else elements.push(<p key={index} className="mb-2 leading-relaxed">{renderInline(trimmed)}</p>);
    });
    if (inList && listBuffer.length > 0) elements.push(<ul key="ul-end" className="list-disc pl-5 mb-2 space-y-1">{listBuffer}</ul>);
    return <div className="markdown-content text-xs">{elements}</div>;
};

interface WidgetSelectionViewProps {
  onSelect: (type: WidgetType) => void;
  onCancel: () => void;
  iconSize?: 'normal' | 'large';
}

export const WidgetSelectionView: React.FC<WidgetSelectionViewProps> = ({ onSelect, onCancel, iconSize = 'normal' }) => {
    const sizeClass = iconSize === 'large' ? "w-10 h-10 md:w-12 md:h-12" : "w-8 h-8";
    const textSizeClass = iconSize === 'large' ? "text-xs md:text-sm" : "text-[9px]";
    const emojiClass = iconSize === 'large' ? "text-3xl md:text-4xl" : "text-xl";
    const allOptions = [
        { type: 'news', label: 'News', description: 'Latest World Headlines', icon: <NewspaperIcon className={sizeClass} /> },
        { type: 'pomodoro', label: 'Pomodoro', description: 'Focus Timer', icon: <TimerIcon className={sizeClass} /> },
        { type: 'googlesearch', label: 'Search', description: 'Quick Google Search', icon: <GoogleIcon className={sizeClass} /> },
        { type: 'wikipedia', label: 'Wikipedia', description: 'Encyclopedia Search', icon: <GlobeIcon className={sizeClass} /> },
        { type: 'chatgpt', label: 'ChatGPT', description: 'AI Assistant', icon: <ChatBubbleLeftRightIcon className={sizeClass} /> },
        { type: 'todolist', label: 'To-Do', description: 'Task Manager', icon: <ClipboardIcon className={sizeClass} /> },
        { type: 'calculator', label: 'Calc', description: 'Scientific Calculator', icon: <CalculatorIcon className={sizeClass} /> },
        { type: 'dictionary', label: 'Dict', description: 'Definitions & Synonyms', icon: <LanguageIcon className={sizeClass} /> },
        { type: 'spotify', label: 'Spotify', description: 'Music Player', icon: <SpotifyIcon className={sizeClass} /> },
        { type: 'music', label: 'Local Music', description: 'Play Local Files', icon: <MusicNoteIcon className={sizeClass} /> },
        { type: 'stickynote', label: 'Notes', description: 'Quick Memo', icon: <ClipboardIcon className={sizeClass} /> },
        { type: 'image', label: 'Image', description: 'Photo Frame', icon: <ImageIcon className={sizeClass} /> },
        { type: 'hyperlink', label: 'Link', description: 'Quick Bookmark', icon: <LinkIcon className={sizeClass} /> },
        { type: 'terminal', label: 'Terminal', description: 'Command Line', icon: <TerminalIcon className={sizeClass} /> },
        { type: 'game2048', label: '2048', description: 'Puzzle Game', icon: <CubeIcon className={sizeClass} /> },
        { type: 'snake', label: 'Snake', description: 'Classic Game', icon: <span className={emojiClass}>🐍</span> },
        { type: 'downloadpdf', label: 'Save PDF', description: 'Export Notes', icon: <ArrowDownTrayIcon className={sizeClass} /> },
    ] as const;
    const [page, setPage] = useState(0);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const pageSize = 9;
    const numPages = Math.ceil(allOptions.length / pageSize);
    const optionsToShow = allOptions.slice(page * pageSize, (page + 1) * pageSize);
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.altKey && e.key.toLowerCase() === 'e') { e.preventDefault(); onCancel(); }
            else if (viewMode === 'grid') {
                if (e.key === 'ArrowRight') setPage(p => (p + 1) % numPages);
                else if (e.key === 'ArrowLeft') setPage(p => (p - 1 + numPages) % numPages);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [viewMode, numPages, onCancel]);
    return (
        <div className="w-full h-full flex flex-col p-1.5 relative rounded-xl overflow-hidden animated-gradient-placeholder">
            <div className="absolute inset-0 bg-[var(--bg-primary)]/80 backdrop-blur-md z-0"></div>
            <div className="relative z-10 flex justify-between items-center mb-1 px-1 flex-shrink-0 h-7 border-b border-[var(--border-primary)]/50 pb-1">
                <div className="flex items-center gap-1">
                    <button onClick={() => setViewMode('grid')} className={`p-1 rounded transition-colors ${viewMode === 'grid' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'}`} title="Grid View"><Squares2X2Icon className="w-3 h-3" /></button>
                    <button onClick={() => setViewMode('list')} className={`p-1 rounded transition-colors ${viewMode === 'list' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'}`} title="List View"><ListBulletIcon className="w-3 h-3" /></button>
                </div>
                <button onClick={onCancel} className="p-1 rounded-full hover:bg-[var(--bg-primary)] btn-press text-[var(--text-secondary)] hover:text-[var(--danger)] transition-colors flex items-center gap-1" title="Close (Alt+E)"><CloseIcon className="w-3 h-3"/></button>
            </div>
            {viewMode === 'grid' ? (
                <>
                    <div className="relative z-10 flex-grow min-h-0 grid grid-cols-3 grid-rows-3 gap-1.5">
                        {optionsToShow.map(option => (
                            <button key={option.type} onClick={() => onSelect(option.type as WidgetType)} className="group flex flex-col items-center justify-center rounded-lg transition-all duration-300 w-full h-full btn-press relative overflow-hidden hover:bg-[var(--bg-secondary)] border border-transparent hover:border-[var(--border-primary)]">
                                <div className="text-[var(--text-secondary)] group-hover:text-[var(--accent)] group-hover:scale-110 transition-all duration-300">{option.icon}</div>
                                <span className={`${textSizeClass} font-semibold mt-0.5 text-[var(--text-primary)]/70 group-hover:text-[var(--text-primary)] transition-colors truncate w-full text-center px-1`}>{option.label}</span>
                            </button>
                        ))}
                    </div>
                    {numPages > 1 && (
                        <div className="relative z-10 flex items-center justify-center gap-2 mt-1 flex-shrink-0 h-4">
                            <button onClick={() => setPage(p => (p - 1 + numPages) % numPages)} className="p-0.5 hover:text-[var(--accent)]"><ChevronLeftIcon className="w-2.5 h-2.5" /></button>
                            <div className="flex gap-1">{Array.from({length: numPages}).map((_, i) => <button key={i} onClick={() => setPage(i)} className={`h-1 rounded-full transition-all duration-300 ${i === page ? 'bg-[var(--accent)] w-2.5' : 'bg-[var(--border-primary)] w-1'}`} />)}</div>
                            <button onClick={() => setPage(p => (p + 1) % numPages)} className="p-0.5 hover:text-[var(--accent)]"><ChevronRightIcon className="w-2.5 h-2.5" /></button>
                        </div>
                    )}
                </>
            ) : (
                <div className="relative z-10 flex-grow overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-1">
                    {allOptions.map(option => (
                        <button key={option.type} onClick={() => onSelect(option.type as WidgetType)} className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-[var(--bg-secondary)] border border-transparent hover:border-[var(--border-primary)] transition-all group text-left">
                            <div className="text-[var(--text-secondary)] group-hover:text-[var(--accent)]">{option.icon}</div>
                            <div className="flex flex-col overflow-hidden">
                                <span className={`text-xs font-bold text-[var(--text-primary)] truncate`}>{option.label}</span>
                                <span className="text-[9px] text-[var(--text-secondary)] truncate">{option.description}</span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

interface WidgetWrapperProps { title: string; children: React.ReactNode; noPadding?: boolean; }
export const WidgetWrapper: React.FC<WidgetWrapperProps> = ({ children, noPadding = false }) => (
    <div className={`relative w-full h-full bg-[var(--bg-secondary)] text-[var(--text-primary)] ${noPadding ? '' : 'p-4'}`}>{children}</div>
);

export const PomodoroWidget: React.FC = () => {
    const [mode, setMode] = useState<'work' | 'break'>('work');
    const [time, setTime] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isActive && time > 0) interval = setInterval(() => setTime((prev) => prev <= 1 ? 0 : prev - 1), 1000);
        return () => clearInterval(interval);
    }, [isActive, time]);
    const minutes = Math.floor(time / 60).toString().padStart(2, '0');
    const seconds = (time % 60).toString().padStart(2, '0');
    return (
        <div className="w-full h-full flex flex-col items-center justify-between p-4">
            <div className="flex bg-[var(--bg-primary)] rounded-lg p-1 border border-[var(--border-primary)] w-full gap-1">
                <button onClick={() => { setIsActive(false); setMode('work'); setTime(25*60); }} className={`flex-1 py-1 text-[10px] font-bold uppercase rounded ${mode === 'work' ? 'bg-red-500 text-white' : 'text-[var(--text-secondary)]'}`}>Focus</button>
                <button onClick={() => { setIsActive(false); setMode('break'); setTime(5*60); }} className={`flex-1 py-1 text-[10px] font-bold uppercase rounded ${mode === 'break' ? 'bg-emerald-500 text-white' : 'text-[var(--text-secondary)]'}`}>Break</button>
            </div>
            <div className="text-6xl font-mono font-bold text-[var(--text-primary)]">{minutes}:{seconds}</div>
            <div className="flex gap-2 w-full">
                <button onClick={() => setIsActive(!isActive)} className={`flex-1 py-2.5 rounded-xl text-white ${mode === 'work' ? 'bg-red-500' : 'bg-emerald-500'}`}>{isActive ? <PauseIcon className="mx-auto" /> : <PlayIcon className="mx-auto" />}</button>
                <button onClick={() => { setIsActive(false); setTime(mode === 'work' ? 25*60 : 5*60); }} className="p-2.5 rounded-xl border border-[var(--border-primary)]"><ArrowPathIcon /></button>
            </div>
        </div>
    );
};

export const ImageWidget: React.FC<{ data?: { url: string }, onChange?: (data: any) => void }> = ({ data, onChange }) => (
    <div className="p-2 h-full flex flex-col">
        {data?.url ? <img src={data.url} className="w-full h-full object-contain" /> : <div className="flex items-center justify-center h-full text-xs text-gray-400">No Image</div>}
        <input type="text" value={data?.url || ''} onChange={(e) => onChange && onChange({ url: e.target.value })} placeholder="URL" className="w-full mt-2 p-1 text-xs bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded" />
    </div>
);

export const HyperlinkWidget: React.FC<{ data?: { url: string, text: string }, onChange: (data: any) => void }> = ({ data, onChange }) => (
    <div className="p-2">
        <a href={data?.url} target="_blank" className="text-blue-400 hover:underline">{data?.text || 'Link'}</a>
        <input type="text" value={data?.url || ''} onChange={(e) => onChange({ ...data, url: e.target.value })} placeholder="URL" className="w-full mt-2 p-1 text-xs bg-[var(--bg-primary)] rounded" />
        <input type="text" value={data?.text || ''} onChange={(e) => onChange({ ...data, text: e.target.value })} placeholder="Text" className="w-full mt-1 p-1 text-xs bg-[var(--bg-primary)] rounded" />
    </div>
);

export const StickyNoteWidget: React.FC<{ data?: { notes: string[] }, onChange: (data: any) => void }> = ({ data, onChange }) => {
    const notes = data?.notes || ['']; // Start with 1 note
    const colors = ['bg-yellow-200', 'bg-blue-200', 'bg-pink-200', 'bg-green-200', 'bg-purple-200', 'bg-orange-200'];
    const updateNote = (i: number, v: string) => { const n = [...notes]; n[i] = v; onChange({ notes: n }); };
    const addNote = () => { if (notes.length < 6) onChange({ notes: [...notes, ''] }); };
    const removeNote = (i: number) => { if (notes.length > 1) onChange({ notes: notes.filter((_, idx) => idx !== i) }); };
    
    return (
        <div className="w-full h-full p-2 grid grid-cols-2 gap-2 overflow-y-auto custom-scrollbar content-start">
            {notes.map((note, i) => (
                <div key={i} className={`relative aspect-square rounded-xl ${colors[i % colors.length]} shadow-md p-2 group overflow-hidden border border-black/5`}>
                    <textarea 
                        value={note} 
                        onChange={e => updateNote(i, e.target.value)} 
                        className="w-full h-full bg-transparent border-none text-[10px] font-bold text-black/70 outline-none resize-none placeholder:text-black/20" 
                        placeholder="Type..." 
                    />
                    {notes.length > 1 && (
                        <button 
                            onClick={() => removeNote(i)}
                            className="absolute top-1 right-1 p-0.5 bg-black/10 rounded-full opacity-0 group-hover:opacity-100 hover:bg-black/20 transition-opacity"
                        >
                            <CloseIcon className="w-2 h-2 text-black/50" />
                        </button>
                    )}
                </div>
            ))}
            {notes.length < 6 && (
                <button 
                    onClick={addNote}
                    className="aspect-square rounded-xl border-2 border-dashed border-[var(--border-primary)] flex items-center justify-center text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
                >
                    <PlusIcon className="w-6 h-6" />
                </button>
            )}
        </div>
    );
};

export const MusicPlayerWidget: React.FC<{ data?: any, onChange?: (data: any) => void }> = ({ data }) => (
    <div className="p-2 h-full flex flex-col justify-between">
        <div><p className="font-bold truncate">{data?.queue?.[0]?.title || 'No song'}</p></div>
        <audio controls className="w-full" />
    </div>
);

export const ToDoListWidget: React.FC<{ data?: { todos: ToDoItem[] }, onChange: (data: any) => void }> = ({ data, onChange }) => (
    <ToDoList todos={data?.todos || []} onChange={(todos) => onChange({ todos })} isWidget />
);

export const TerminalWidget: React.FC<{ data?: any, onCommand: any, onClose?: () => void }> = ({ data, onCommand, onClose }) => {
    const [input, setInput] = useState('');
    return (
        <div className="p-2 bg-black text-green-400 font-mono text-[10px] h-full flex flex-col relative group">
            {onClose && (
                <button 
                    onClick={onClose} 
                    className="absolute top-1 right-1 p-1 hover:bg-white/10 rounded text-green-600 hover:text-green-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <CloseIcon className="w-3 h-3" />
                </button>
            )}
            <div className="flex-grow overflow-y-auto">{data?.history?.map((l: string, i: number) => <div key={i}>{l}</div>)}</div>
            <div className="flex"><span>></span><input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if(e.key==='Enter') { onCommand(input.split(' ')[0], []); setInput(''); } }} className="bg-transparent outline-none ml-1 flex-grow" /></div>
        </div>
    );
};

export const GoogleSearchWidget: React.FC<{ data?: any, onSearch: any, onExpand?: any, isOnline?: boolean, onChange?: any }> = ({ data, onSearch, onExpand, isOnline = true }) => {
    if (!isOnline) return <OfflinePlaceholder label="Connection" />;
    return (
        <div className="p-2 h-full flex flex-col relative group">
            {onExpand && (
                <button onClick={onExpand} className="absolute top-2 right-2 p-1 hover:bg-[var(--bg-primary)] rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <ArrowsPointingOutIcon className="w-3 h-3 text-[var(--text-secondary)]" />
                </button>
            )}
            <form onSubmit={e => { e.preventDefault(); onSearch(e.currentTarget.q.value); }} className="flex gap-1 pr-6">
                <input name="q" placeholder="Search..." className="flex-grow p-1 text-xs bg-[var(--bg-primary)] rounded" />
                <button className="p-1 bg-blue-500 text-white rounded"><MagnifyingGlassIcon className="w-3 h-3"/></button>
            </form>
            <div className="mt-2 text-[10px] overflow-y-auto flex-grow">
                <SimpleMarkdown content={data?.text || ''} />
                
                {/* Fixed: Extracting and displaying URLs from groundingChunks as required by Gemini API guidelines */}
                {data?.sources && data.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-[var(--border-primary)]/30">
                        <span className="text-[8px] font-black uppercase text-[var(--text-secondary)] block mb-1">Sources</span>
                        <div className="flex flex-col gap-1">
                            {data.sources.map((chunk: any, idx: number) => {
                                if (chunk.web) {
                                    return (
                                        <a key={idx} href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline flex items-center gap-1 truncate">
                                            <GlobeIcon className="w-2.5 h-2.5 shrink-0" />
                                            <span className="truncate">{chunk.web.title || chunk.web.uri}</span>
                                        </a>
                                    );
                                }
                                return null;
                            })}
                        </div>
                    </div>
                )}
            </div>
            {data?.loading && <WidgetLoadingOverlay label="Searching..." />}
        </div>
    );
};

export const ChatGPTWidget: React.FC<{ data?: any, onChange: any, isOnline?: boolean, onExpand?: () => void }> = ({ data, onChange, isOnline = true, onExpand }) => {
    if (!isOnline) return <OfflinePlaceholder label="AI Service" />;
    const [msg, setMsg] = useState('');
    const [copySuccess, setCopySuccess] = useState<number | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const send = async (text: string) => { 
        if (!text.trim()) return;
        const currentHistory = data?.history || [];
        const newHistory = [...currentHistory, { role: 'user', text: text }]; 
        onChange({...data, history: newHistory, loading: true}); 
        setMsg(''); 
        
        try {
            const response = await performChat(text, currentHistory); 
            onChange({
                ...data, 
                history: [...newHistory, { 
                    role: 'model', 
                    text: response.text, 
                    sources: response.sources,
                    followUps: response.followUps 
                }], 
                loading: false
            }); 
        } catch (e) {
            onChange({...data, loading: false});
        }
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [data?.history, data?.loading]);

    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopySuccess(index);
        setTimeout(() => setCopySuccess(null), 2000);
    };

    return (
        <div className="h-full flex flex-col relative group bg-[var(--bg-secondary)] overflow-hidden">
            {/* Refactored Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-primary)] bg-[var(--bg-primary)]/50 backdrop-blur-sm shrink-0">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-[var(--accent)]/10 rounded-lg text-[var(--accent)]">
                        <ChatBubbleLeftRightIcon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-[var(--text-primary)]">AI Assistant</span>
                </div>
                {onExpand && (
                    <button onClick={onExpand} className="p-1.5 hover:bg-[var(--bg-secondary)] rounded text-[var(--text-secondary)] transition-colors">
                        <ArrowsPointingOutIcon className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            <div className="flex-grow flex flex-col p-2 min-h-0">
                {/* Chat History with Inner Border */}
                <div className="flex-grow overflow-y-auto space-y-2 p-2 custom-scrollbar border border-[var(--border-primary)] rounded-xl bg-[var(--bg-primary)]/50 shadow-inner" ref={scrollRef}>
                    {data?.history?.map((m: any, i: number) => (
                        <div key={i} className="flex flex-col gap-1 animate-[fadeIn_0.3s_ease-out]">
                            <div className={`relative p-2 rounded-xl text-[10px] shadow-sm ${m.role === 'user' ? 'bg-[var(--accent)] text-white self-end rounded-br-none ml-4' : 'bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-primary)] self-start rounded-bl-none mr-4'}`}>
                                {m.role === 'model' && (
                                    <button 
                                        onClick={() => handleCopy(m.text, i)}
                                        className="absolute -top-2 -right-2 p-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-full hover:text-[var(--accent)] shadow-sm opacity-0 group-hover:opacity-100 transition-all"
                                        title="Copy"
                                    >
                                        {copySuccess === i ? <CheckIcon className="w-2.5 h-2.5 text-green-500" /> : <ClipboardIcon className="w-2.5 h-2.5" />}
                                    </button>
                                )}
                                <SimpleMarkdown content={m.text} />
                                
                                {/* Sources Section */}
                                {m.sources && m.sources.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-[var(--border-primary)]/50 flex flex-wrap gap-1">
                                        <span className="text-[8px] font-bold text-[var(--text-secondary)] uppercase w-full">Sources</span>
                                        {m.sources.map((source: any, idx: number) => (
                                            <a 
                                                key={idx} 
                                                href={source.uri} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="flex items-center gap-1 px-1.5 py-0.5 bg-[var(--bg-secondary)] rounded-full border border-[var(--border-primary)] hover:border-[var(--accent)] transition-colors max-w-full"
                                                title={source.title}
                                            >
                                                <GlobeIcon className="w-2.5 h-2.5 text-[var(--text-secondary)]" />
                                                <span className="text-[8px] truncate max-w-[80px] text-[var(--text-primary)]">{source.title}</span>
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            {/* Follow-up Chips (Only for last message) */}
                            {m.role === 'model' && i === (data.history.length - 1) && m.followUps && m.followUps.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-1 ml-1">
                                    {m.followUps.map((q: string, idx: number) => (
                                        <button 
                                            key={idx} 
                                            onClick={() => send(q)}
                                            className="px-2 py-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-full text-[9px] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors text-left"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* New 3-Dot Animation Loading Bubble */}
                    {data?.loading && (
                        <div className="flex flex-col gap-1 animate-[fadeIn_0.3s_ease-out]">
                            <div className="bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-primary)] self-start rounded-xl rounded-bl-none mr-4 p-3 shadow-sm w-fit">
                                <div className="flex gap-1 h-2 items-center">
                                    <div className="w-1.5 h-1.5 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-1.5 h-1.5 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-1.5 h-1.5 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="mt-2 relative shrink-0">
                    <input 
                        value={msg} 
                        onChange={e => setMsg(e.target.value)} 
                        onKeyDown={e => e.key === 'Enter' && send(msg)}
                        className="w-full pl-3 pr-10 py-2 text-[10px] bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg outline-none focus:border-[var(--accent)] transition-colors shadow-sm placeholder:text-[var(--text-secondary)]/50" 
                        placeholder="Ask anything..."
                    />
                    <button 
                        onClick={() => send(msg)} 
                        className="absolute right-1 top-1 bottom-1 px-2.5 bg-[var(--accent)] text-white rounded-md text-[10px] font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50"
                        disabled={!msg.trim() || data?.loading}
                    >
                        <ChevronRightIcon className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export const DictionaryWidget: React.FC<{ data?: any, onChange: any }> = ({ data, onChange }) => {
    const search = async (w: string) => { onChange({...data, loading: true}); const res = await lookupDictionary(w); onChange({word: w, result: res, loading: false}); };
    return (
        <div className="p-2 h-full flex flex-col relative">
            <input onKeyDown={e => e.key==='Enter' && search(e.currentTarget.value)} placeholder="Word..." className="p-1 text-xs bg-[var(--bg-primary)] rounded" />
            <div className="mt-1 text-[10px]">{data?.result?.meanings?.[0]?.definitions?.[0]?.definition}</div>
            {data?.loading && <WidgetLoadingOverlay label="Defining..." />}
        </div>
    );
};

export const NewsWidget: React.FC<{ isOnline?: boolean, data?: any, onChange?: (data: any) => void, isExpanded?: boolean }> = ({ isOnline = true, data, onChange, isExpanded }) => {
    if (!isOnline) return <OfflinePlaceholder label="News Source" />;
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const loadNews = useCallback(async () => {
        setLoading(true);
        try { const data = await fetchNews(); setNews(data); if(onChange) onChange({ news: data }); } finally { setLoading(false); }
    }, [onChange]);
    
    useEffect(() => { 
        if(data?.news) { setNews(data.news); setLoading(false); }
        else loadNews(); 
    }, [loadNews, data]);

    return (
        <div className="flex flex-col h-full bg-[var(--bg-primary)] relative group/news">
            <div className="flex items-center justify-between p-2 bg-[var(--danger)] text-white overflow-hidden shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                    <span className="text-[9px] font-black uppercase tracking-tighter">Breaking News</span>
                </div>
                <button onClick={loadNews} className="p-0.5 hover:bg-white/20 rounded transition-colors"><ArrowPathIcon className="w-3 h-3" /></button>
            </div>
            <div className="flex-grow overflow-y-auto custom-scrollbar p-2 space-y-3">
                {news.map((item, i) => (
                    <a key={i} href={item.url} target="_blank" rel="noreferrer" className="block group animate-slide-fade rounded-lg overflow-hidden border border-[var(--border-primary)]/40 hover:border-[var(--accent)] hover:shadow-md transition-all bg-[var(--bg-secondary)]" style={{ animationDelay: `${i * 100}ms` }}>
                        {item.imageUrl && (
                            <div className="w-full h-20 overflow-hidden relative">
                                <img src={item.imageUrl} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                <span className="absolute bottom-1.5 left-1.5 bg-[var(--accent)] text-white text-[7px] font-bold px-1.5 py-0.5 rounded-sm uppercase">{item.source}</span>
                            </div>
                        )}
                        <div className="p-2">
                            {!item.imageUrl && (
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[7px] font-black text-[var(--accent)] uppercase tracking-widest">{item.source}</span>
                                    <span className="text-[7px] text-[var(--text-secondary)]">Live</span>
                                </div>
                            )}
                            <h5 className="text-[10px] font-bold leading-tight line-clamp-2 group-hover:text-[var(--accent)] transition-colors">{item.title}</h5>
                            <p className="text-[8px] text-[var(--text-secondary)] mt-1 line-clamp-2 leading-relaxed">{item.summary}</p>
                        </div>
                    </a>
                ))}
            </div>
            {loading && <WidgetLoadingOverlay label="Fetching Headlines..." />}
        </div>
    );
};

export const WikipediaWidget: React.FC<{ data?: any, isOnline?: boolean, onChange: any, onExpand?: () => void, isExpanded?: boolean }> = ({ data, isOnline = true, onChange, onExpand, isExpanded }) => {
    if (!isOnline) return <OfflinePlaceholder label="Wiki Database" />;
    return (
        <div className="p-2 h-full overflow-y-auto relative group">
            {onExpand && !isExpanded && (
                <button onClick={onExpand} className="absolute top-2 right-2 p-1 bg-black/10 hover:bg-black/20 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <ArrowsPointingOutIcon className="w-3 h-3 text-[var(--text-primary)]" />
                </button>
            )}
            <h4 className="font-bold text-[10px] mb-1">{data?.wikiData?.title}</h4>
            <p className="text-[9px]">{data?.wikiData?.extract}</p>
            {data?.loading && <WidgetLoadingOverlay label="Reading..." />}
        </div>
    );
};

export const WeatherWidget: React.FC<{ data?: any, isOnline?: boolean, onChange: any }> = ({ data, isOnline = true, onChange }) => {
    if (!isOnline) return <OfflinePlaceholder label="Weather Data" />;
    return (
        <div className="p-3 h-full flex flex-col justify-between bg-blue-400 text-white relative">
            <div className="text-xs font-bold">{data?.location || 'Weather'}</div>
            <div className="text-3xl font-bold">{data?.data?.temperature}°C</div>
            <div className="text-[10px]">{data?.data?.condition}</div>
            {data?.loading && <WidgetLoadingOverlay label="Forecasting..." />}
        </div>
    );
};

export const DownloadPdfWidget: React.FC<{ onDownload?: () => void }> = ({ onDownload }) => (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
        <button onClick={onDownload} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] hover:border-[var(--accent)] hover:shadow-lg transition-all group w-full h-full justify-center">
            <div className="p-3 bg-[var(--accent)] text-white rounded-full group-hover:scale-110 transition-transform">
                <ArrowDownTrayIcon className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wide text-[var(--text-primary)]">Save Notes PDF</span>
        </button>
    </div>
);

export const SpotifyWidget: React.FC<{ data: any, onChange: any, isOnline?: boolean }> = ({ data, onChange, isOnline = true }) => {
    if (!isOnline) return <OfflinePlaceholder label="Spotify" />;
    const [embed, setEmbed] = useState('');
    const curatedPlaylists = [
        { name: 'Lofi Girl', url: 'https://open.spotify.com/playlist/37i9dQZF1DWWQRUVU9vMvE', emoji: '☕', color: 'from-amber-400 to-orange-600' },
        { name: 'Deep Focus', url: 'https://open.spotify.com/playlist/37i9dQZF1DWZeKzbIRjA1P', emoji: '🧘', color: 'from-blue-400 to-indigo-600' },
        { name: 'Piano Flow', url: 'https://open.spotify.com/playlist/37i9dQZF1DX4sWSp4KmOR3', emoji: '🎹', color: 'from-emerald-400 to-teal-600' },
        { name: 'Rainy Night', url: 'https://open.spotify.com/playlist/37i9dQZF1DX8Ueb99V2PAr', emoji: '🌧️', color: 'from-slate-400 to-slate-700' },
        { name: 'Jazz Cafe', url: 'https://open.spotify.com/playlist/37i9dQZF1DWZqzZWvD4pS6', emoji: '🎷', color: 'from-rose-400 to-rose-700' },
        { name: 'Nature', url: 'https://open.spotify.com/playlist/37i9dQZF1DX4pp3R6jnC9r', emoji: '🍃', color: 'from-lime-400 to-green-700' },
    ];

    useEffect(() => {
        if(data?.url) {
            let u = data.url.trim();
            // Try robust parsing
            try {
                // If it's a full URL
                if (u.includes('spotify.com')) {
                    const urlObj = new URL(u);
                    // Check if it's already an embed link
                    if (!urlObj.pathname.startsWith('/embed')) {
                        urlObj.pathname = `/embed${urlObj.pathname}`;
                    }
                    u = urlObj.toString();
                } else if (u.startsWith('spotify:')) {
                    // Handle URI format: spotify:user:spotify:playlist:37i9dQZF1DXcBWIGoYBM5M
                    const parts = u.split(':');
                    const type = parts[parts.length - 2];
                    const id = parts[parts.length - 1];
                    u = `https://open.spotify.com/embed/${type}/${id}`;
                }
            } catch (e) {
                // Fallback for copied link parts (e.g. from mobile share) or simple cleanup
                if(!u.includes('/embed/') && u.includes('spotify.com')) {
                     const parts = u.split('.com/');
                     if(parts.length > 1) {
                         // Remove any potential query params first if doing simple split
                         const path = parts[1].split('?')[0]; 
                         u = `https://open.spotify.com/embed/${path}`;
                         // Re-append query params if they existed (like ?si=) as they might be needed? 
                         // Usually not for embed, but let's keep it simple.
                     }
                }
            }
            setEmbed(u);
        } else setEmbed('');
    }, [data?.url]);

    if (!embed) {
        return (
            <div className="w-full h-full bg-black flex flex-col p-3 overflow-y-auto custom-scrollbar relative">
                <div className="flex items-center gap-2 mb-3 shrink-0">
                    <SpotifyIcon className="w-4 h-4 text-[#1DB954]" />
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Atmospheres</span>
                </div>
                <div className="grid grid-cols-2 gap-2 flex-grow min-h-0 content-start">
                    {curatedPlaylists.map(pl => (
                        <button key={pl.name} onClick={() => onChange({ url: pl.url })} className={`relative aspect-square rounded-xl bg-gradient-to-br ${pl.color} p-2 flex flex-col items-center justify-center gap-1 shadow-lg hover:scale-105 active:scale-95 transition-all group overflow-hidden border border-white/10`}>
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                            <span className="text-xl relative z-10 drop-shadow-md">{pl.emoji}</span>
                            <span className="text-[9px] font-black text-white relative z-10 text-center leading-tight tracking-tight uppercase px-1">{pl.name}</span>
                        </button>
                    ))}
                </div>
                <div className="mt-4 pt-3 border-t border-zinc-800 shrink-0">
                    <input onChange={e => onChange({url: e.target.value})} placeholder="Paste link..." className="w-full p-2 text-[9px] font-bold rounded-lg bg-zinc-900 text-zinc-100 border border-zinc-800 focus:border-[#1DB954] outline-none placeholder:text-zinc-600 uppercase tracking-widest" />
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-black flex flex-col relative group">
            <button onClick={() => onChange({ url: '' })} className="absolute top-2 right-2 z-20 p-1.5 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 shadow-xl border border-white/10" title="Change Audio"><ArrowPathIcon className="w-3.5 h-3.5" /></button>
            <iframe 
                src={embed} 
                width="100%" 
                height="100%" 
                frameBorder="0" 
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                loading="lazy"
                className="rounded-xl shadow-2xl" 
            />
        </div>
    );
};

export const SnakeGameWidget: React.FC = () => <div className="flex items-center justify-center h-full text-[10px]">Snake Game</div>;
export const TicTacToeWidget: React.FC = () => <div className="flex items-center justify-center h-full text-[10px]">Tic-Tac-Toe</div>;
export const Game2048Widget: React.FC = () => <div className="flex items-center justify-center h-full text-[10px]">2048 Game</div>;
