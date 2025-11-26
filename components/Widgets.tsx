
import React, { useState, useEffect, useRef } from 'react';
import { WidgetType, ToDoItem } from '../App';
import { TimerIcon, ImageIcon, LinkIcon, CalculatorIcon, CloseIcon, MicrophoneIcon, ClipboardIcon, MusicNoteIcon, PlayIcon, PauseIcon, BackwardIcon, ForwardIcon, SpotifyIcon, PlusIcon, MinusIcon, TerminalIcon, ArrowsPointingInIcon, EyeIcon, EyeSlashIcon, GoogleIcon, ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon, SpeakerWaveIcon, QueueListIcon, TrashIcon, MusicalNoteIcon, SpeakerXMarkIcon, FolderIcon, SparklesIcon, ArrowPathIcon, LanguageIcon, ClipboardDocumentCheckIcon, ArrowsPointingOutIcon, BoltIcon } from './Icons';
import Spinner from './Spinner';
import ToDoList from './ToDoList';
import { performGoogleSearch, getMusicSuggestions, lookupDictionary, DictionaryResult } from '../lib/ai';
import { CalculatorWidget } from './CalculatorWidget';

declare global {
  interface Window {
    jsmediatags: any;
  }
}

// Widget Selection (Inline)
interface WidgetSelectionViewProps {
  onSelect: (type: WidgetType) => void;
  onCancel: () => void;
}

export const WidgetSelectionView: React.FC<WidgetSelectionViewProps> = ({ onSelect, onCancel }) => {
    const allOptions = [
        { type: 'pomodoro', label: 'Pomodoro', icon: <TimerIcon className="w-5 h-5" /> },
        { type: 'image', label: 'Image', icon: <ImageIcon className="w-5 h-5" /> },
        { type: 'hyperlink', label: 'Link', icon: <LinkIcon className="w-5 h-5" /> },
        { type: 'calculator', label: 'Calc', icon: <CalculatorIcon className="w-5 h-5" /> },
        { type: 'stickynote', label: 'Notes', icon: <ClipboardIcon className="w-5 h-5" /> },
        { type: 'music', label: 'Music', icon: <MusicNoteIcon className="w-5 h-5" /> },
        { type: 'spotify', label: 'Spotify', icon: <SpotifyIcon className="w-5 h-5" /> },
        { type: 'todolist', label: 'To-Do', icon: <ClipboardIcon className="w-5 h-5" /> },
        { type: 'terminal', label: 'Term', icon: <TerminalIcon className="w-5 h-5" /> },
        { type: 'googlesearch', label: 'Search', icon: <GoogleIcon className="w-5 h-5" /> },
        { type: 'dictionary', label: 'Dict', icon: <LanguageIcon className="w-5 h-5" /> },
        { type: 'tictactoe', label: 'TicTacToe', icon: <BoltIcon className="w-5 h-5" /> },
        { type: 'snake', label: 'Snake', icon: <span className="text-lg">🐍</span> },
        { type: 'zipgame', label: 'Breathe', icon: <SparklesIcon className="w-5 h-5" /> },
    ] as const;
    
    const [page, setPage] = useState(0);
    const pageSize = 9;
    const numPages = Math.ceil(allOptions.length / pageSize);
    const optionsToShow = allOptions.slice(page * pageSize, (page + 1) * pageSize);
    
    const lastSwipeTime = useRef(0);

    const handleWheel = (e: React.WheelEvent) => {
        // Debounce to prevent rapid flipping
        const now = Date.now();
        if (now - lastSwipeTime.current < 400) return;

        // Detect horizontal swipe (common for trackpad pagination)
        if (Math.abs(e.deltaX) > 20) {
            if (e.deltaX > 0) {
                // Swipe Right -> Next Page
                setPage(p => (p + 1) % numPages);
            } else {
                // Swipe Left -> Prev Page
                setPage(p => (p - 1 + numPages) % numPages);
            }
            lastSwipeTime.current = now;
        }
    };


    return (
        <div 
            onWheel={handleWheel}
            className="w-full h-full flex flex-col items-center justify-center bg-[var(--bg-primary)] p-2 relative rounded-lg"
        >
            <button onClick={onCancel} className="absolute top-2 right-2 p-1 rounded-full hover:bg-[var(--bg-secondary)] btn-press z-10 text-[var(--text-secondary)]">
                <CloseIcon className="w-4 h-4"/>
            </button>
            
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-3">Select Widget</h3>
            
            <div className="grid grid-cols-3 gap-2 w-full h-full content-start overflow-y-auto custom-scrollbar px-1 pb-1">
                {optionsToShow.map(option => (
                    <button 
                        key={option.type}
                        onClick={() => onSelect(option.type as WidgetType)}
                        className="group flex flex-col items-center justify-center gap-2 p-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--accent)] hover:shadow-md transition-all aspect-square btn-press"
                    >
                        <div className="text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors mb-1">
                             {option.icon}
                        </div>
                        <span className="text-[9px] font-medium text-center leading-tight truncate w-full">{option.label}</span>
                    </button>
                ))}
            </div>
            {numPages > 1 && (
                <div className="flex items-center gap-3 mt-2">
                    <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="disabled:opacity-30 hover:text-[var(--accent)]"><ChevronLeftIcon className="w-4 h-4"/></button>
                    <div className="flex gap-1">
                        {Array.from({length: numPages}).map((_, i) => (
                            <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === page ? 'bg-[var(--accent)]' : 'bg-[var(--text-secondary)] opacity-30'}`} />
                        ))}
                    </div>
                    <button disabled={page === numPages - 1} onClick={() => setPage(p => p + 1)} className="disabled:opacity-30 hover:text-[var(--accent)]"><ChevronRightIcon className="w-4 h-4"/></button>
                </div>
            )}
        </div>
    );
};


// Widget Wrapper
interface WidgetWrapperProps {
    title: string;
    children: React.ReactNode;
    noPadding?: boolean;
}
export const WidgetWrapper: React.FC<WidgetWrapperProps> = ({ title, children, noPadding = false }) => (
    <div className="relative w-full h-full bg-[var(--bg-secondary)] text-[var(--text-primary)]">
        {children}
    </div>
);


// Pomodoro Widget
export const PomodoroWidget: React.FC = () => {
    const [mode, setMode] = useState<'work' | 'break'>('work');
    const [time, setTime] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [isHidden, setIsHidden] = useState(false);
    const [isAlerting, setIsAlerting] = useState(false);
    const [randomBg, setRandomBg] = useState('https://source.unsplash.com/random/400x400/?nature,water,forest');
    
    useEffect(() => {
        if (isHidden) {
            setRandomBg(`https://source.unsplash.com/random/400x400/?nature,landscape,calm&t=${Date.now()}`);
        }
    }, [isHidden]);

    useEffect(() => {
        let interval: number | undefined;
        if (isActive && time > 0) {
            interval = window.setInterval(() => setTime(t => t - 1), 1000);
        } else if (isActive && time === 0) {
            setIsActive(false);
            setIsHidden(false);
            setIsAlerting(true);
            setTimeout(() => setIsAlerting(false), 800);
            
            if (mode === 'work') {
                setMode('break');
                setTime(5 * 60);
            } else {
                setMode('work');
                setTime(25 * 60);
            }
        }
        return () => window.clearInterval(interval);
    }, [isActive, time, mode]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const resetTimer = () => {
        setIsActive(false);
        setMode('work');
        setTime(25 * 60);
    };

    const startBreak = () => {
        setIsActive(true);
        setMode('break');
        setTime(5 * 60);
    };

    if (isHidden) {
        return (
            <div 
                className="w-full h-full flex flex-col items-center justify-center text-center text-white cursor-pointer relative overflow-hidden"
                onClick={() => setIsHidden(false)}
            >
                <div className="absolute inset-0 z-0">
                    <img src={randomBg} alt="Relaxing Background" className="w-full h-full object-cover transition-transform duration-10000 hover:scale-110" />
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"></div>
                </div>
                
                <div className="relative z-10 flex flex-col items-center animate-in fade-in duration-500">
                    <div className="p-3 bg-white/10 rounded-full backdrop-blur-md mb-2 border border-white/20 shadow-lg">
                        <EyeIcon className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-sm drop-shadow-md">Timer Hidden</p>
                    <p className="text-xs opacity-80 drop-shadow-md">Stay focused</p>
                </div>
            </div>
        );
    }

    const isWorkSession = mode === 'work';
    const bgColor = isWorkSession ? 'bg-[#FF6347]' : 'bg-[var(--success)]';

    return (
        <div className={`relative w-full h-full flex flex-col items-center justify-center text-center text-white transition-colors duration-500 ${bgColor} ${isAlerting ? 'pomodoro-alert' : ''}`}>
            <button onClick={() => setIsHidden(true)} className="absolute top-2 right-2 p-1.5 rounded-full bg-white/20 hover:bg-white/40 btn-press transition-all" title="Hide Timer">
                <EyeSlashIcon className="w-4 h-4" />
            </button>
            <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">{isWorkSession ? 'Focus Session' : 'Break Time'}</p>
            <p className="text-5xl font-mono font-medium tracking-tight mb-4">{formatTime(time)}</p>
            
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setIsActive(!isActive)} 
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all btn-press border border-white/10"
                    title={isActive ? 'Pause' : 'Start'}
                >
                    {isActive ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5 ml-0.5" />}
                </button>
                
                <button onClick={resetTimer} className="px-3 py-1.5 text-xs font-semibold rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all btn-press border border-white/5">
                    Reset
                </button>
                
                <button onClick={startBreak} className="px-3 py-1.5 text-xs font-semibold rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all btn-press border border-white/5">
                    Skip
                </button>
            </div>
        </div>
    );
};

// Image Widget
interface ImageWidgetProps { data: { url?: string }; onChange: (data: { url: string }) => void; }
export const ImageWidget: React.FC<ImageWidgetProps> = ({ data, onChange }) => {
    const [url, setUrl] = useState(data?.url || '');
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (loadEvent) => {
                    if (loadEvent.target && typeof loadEvent.target.result === 'string') {
                        onChange({ url: loadEvent.target.result });
                    }
                };
                reader.readAsDataURL(file);
                return;
            }
        }

        try {
            let url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/html');
            if (url) {
                if (e.dataTransfer.getData('text/html')) {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = url;
                    const img = tempDiv.querySelector('img');
                    if (img && img.src) {
                        url = img.src;
                    }
                }
                if (url && (url.startsWith('http') || url.startsWith('data:image'))) {
                    onChange({ url });
                    return;
                }
            }
            const plainUrl = e.dataTransfer.getData('text/plain');
            if (plainUrl && (plainUrl.startsWith('http') || plainUrl.startsWith('data:image'))) {
                onChange({ url: plainUrl });
                return;
            }
        } catch (error) {
            console.error("Error handling dropped URL:", error);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true); };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false); };
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') onChange({ url }); };

    if (data?.url) {
        return (
            <div className="relative w-full h-full" onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>
                <img src={data.url} alt="user content" className="w-full h-full object-cover" />
                {isDraggingOver && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold p-2 text-center text-sm">Drop Image to Replace</div>}
            </div>
        );
    }

    return (
        <div className="w-full h-full flex items-center justify-center p-2 relative" onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>
            {isDraggingOver ? (
                 <div className="w-full h-full flex items-center justify-center text-[var(--accent)] font-bold p-2 text-center text-sm border-2 border-dashed border-[var(--accent)] rounded-lg bg-[var(--highlight-kp-bg)]">Drop Image File</div>
            ) : (
                <input type="text" value={url} onChange={e => setUrl(e.target.value)} onKeyDown={handleKeyDown} onBlur={() => onChange({ url })} placeholder="Image or GIF URL..." className="w-full px-2 py-1 text-xs bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
            )}
        </div>
    );
};


// Hyperlink Widget
export const HyperlinkWidget: React.FC<{ data: { url?: string, text?: string }; onChange: (data: { url: string, text: string }) => void }> = ({ data, onChange }) => {
    const [url, setUrl] = useState(data?.url || '');
    const [text, setText] = useState(data?.text || '');
    
    if (data?.url && data?.text) {
        return (
            <div className="w-full h-full flex items-center justify-center p-2">
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] font-bold break-all text-center">{text}</a>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-2">
            <input type="text" value={text} onChange={e => setText(e.target.value)} placeholder="Display text..." className="w-full px-2 py-1 text-xs bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"/>
            <input type="text" value={url} onChange={e => setUrl(e.target.value)} placeholder="URL..." className="w-full px-2 py-1 text-xs bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"/>
            <button onClick={() => onChange({ url, text })} className="w-full px-3 py-1 text-xs rounded bg-[var(--accent)] text-white btn-press">Save</button>
        </div>
    );
};

// Sticky Note Widget
const stickyColors = [
    'bg-[#fef3c7] text-[#92400e] placeholder-[#d97706]', // Yellow (Amber-100)
    'bg-[#fce7f3] text-[#9d174d] placeholder-[#db2777]', // Pink (Pink-100)
    'bg-[#dcfce7] text-[#166534] placeholder-[#15803d]', // Green (Green-100)
    'bg-[#dbeafe] text-[#1e40af] placeholder-[#2563eb]', // Blue (Blue-100)
    'bg-[#f3e8ff] text-[#6b21a8] placeholder-[#7c3aed]', // Purple (Purple-100)
    'bg-[#ffedd5] text-[#9a3412] placeholder-[#ea580c]', // Orange (Orange-100)
];

export const StickyNoteWidget: React.FC<{ data: { notes?: string[] }, onChange: (data: { notes: string[] }) => void }> = ({ data, onChange }) => {
    const notes = data?.notes || [''];
    const MAX_NOTES = 8;

    const handleChange = (index: number, value: string) => {
        const newNotes = [...notes];
        newNotes[index] = value;
        onChange({ notes: newNotes });
    };
    
    const addNote = () => {
        if (notes.length < MAX_NOTES) {
            onChange({ notes: [...notes, ''] });
        }
    };
    
    const removeNote = (index: number) => {
        const newNotes = notes.filter((_, i) => i !== index);
        onChange({ notes: newNotes.length ? newNotes : [''] });
    };

    return (
        <div className="w-full h-full flex flex-col p-2 bg-[var(--bg-secondary)]">
            <div className="flex-grow overflow-y-auto custom-scrollbar grid grid-cols-2 gap-2 auto-rows-min content-start pb-2">
                {notes.map((note, i) => (
                    <div 
                        key={i} 
                        className={`relative group aspect-square shadow-sm hover:shadow-md transition-shadow rounded p-1 ${stickyColors[i % stickyColors.length]}`}
                    >
                        <textarea 
                            className="w-full h-full bg-transparent text-xs p-1 resize-none border-none outline-none leading-tight" 
                            value={note} 
                            onChange={(e) => handleChange(i, e.target.value)} 
                            placeholder="Note..."
                        />
                        {notes.length > 1 && (
                            <button 
                                onClick={() => removeNote(i)} 
                                className="absolute -top-1.5 -right-1.5 bg-white rounded-full p-0.5 shadow text-[var(--danger)] opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                            >
                                <TrashIcon className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                ))}
            </div>
            {notes.length < MAX_NOTES && (
                <button 
                    onClick={addNote} 
                    className="mt-1 w-full py-1.5 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded transition-colors flex items-center justify-center gap-1 flex-shrink-0 btn-press"
                >
                    <PlusIcon className="w-3 h-3" /> Add Sticky
                </button>
            )}
        </div>
    );
};

// Music Player Widget
export const MusicPlayerWidget: React.FC<{ data: any, onChange: (data: any) => void }> = ({ data, onChange }) => {
    const queue = data?.queue || [];
    const currentSongIndex = data?.currentSongIndex || 0;
    const isPlaying = data?.isPlaying || false;
    const volume = data?.volume ?? 1;
    const audioRef = useRef<HTMLAudioElement>(null);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showPlaylist, setShowPlaylist] = useState(false);
    const currentSong = queue[currentSongIndex];

    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying) { audioRef.current.play().catch(e => console.error("Play error", e)); } else { audioRef.current.pause(); }
            audioRef.current.volume = volume;
        }
    }, [isPlaying, currentSongIndex, volume, currentSong]); 

    const togglePlay = () => onChange({ ...data, isPlaying: !isPlaying });
    const nextSong = () => onChange({ ...data, currentSongIndex: (currentSongIndex + 1) % queue.length, isPlaying: true });
    const prevSong = () => onChange({ ...data, currentSongIndex: (currentSongIndex - 1 + queue.length) % queue.length, isPlaying: true });
    
    const handleTimeUpdate = () => { if (audioRef.current) { setProgress(audioRef.current.currentTime); setDuration(audioRef.current.duration || 0); } };
    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => { const time = Number(e.target.value); if (audioRef.current) { audioRef.current.currentTime = time; setProgress(time); } };
    const removeSong = (index: number) => {
        const newQueue = queue.filter((_: any, i: number) => i !== index);
        let newIndex = currentSongIndex;
        if (index < currentSongIndex) newIndex--;
        else if (index === currentSongIndex && newQueue.length > 0) newIndex = newIndex % newQueue.length;
        else if (newQueue.length === 0) newIndex = 0;
        onChange({ ...data, queue: newQueue, currentSongIndex: newIndex, isPlaying: newQueue.length > 0 ? isPlaying : false });
    };
    
    const formatTime = (time: number) => { if(isNaN(time)) return "0:00"; const mins = Math.floor(time / 60); const secs = Math.floor(time % 60); return `${mins}:${secs < 10 ? '0' : ''}${secs}`; };

    return (
        <div className="w-full h-full flex flex-col bg-[var(--bg-secondary)] relative overflow-hidden">
            {currentSong ? (
                <>
                    <audio ref={audioRef} src={currentSong.url} onTimeUpdate={handleTimeUpdate} onEnded={nextSong} />
                    {currentSong.albumArt && <div className="absolute inset-0 opacity-20 pointer-events-none blur-xl"><img src={currentSong.albumArt} className="w-full h-full object-cover" /></div>}
                    <div className="relative z-10 flex flex-col h-full p-4">
                        <div className="flex justify-between items-start mb-2">
                             <div className="flex-1 min-w-0"><h4 className="font-bold text-sm truncate">{currentSong.title}</h4><p className="text-xs text-[var(--text-secondary)] truncate">{currentSong.artist}</p></div>
                             <button onClick={() => setShowPlaylist(!showPlaylist)} className="p-1.5 rounded-full hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] btn-press"><QueueListIcon className="w-4 h-4" /></button>
                        </div>
                        <div className="flex-grow flex items-center justify-center mb-4">
                            <div className={`w-24 h-24 rounded-full shadow-lg border-4 border-[var(--bg-primary)] overflow-hidden ${isPlaying ? 'animate-spin-slow' : ''}`}>
                                {currentSong.albumArt ? <img src={currentSong.albumArt} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-[var(--accent)] flex items-center justify-center text-white"><MusicalNoteIcon className="w-10 h-10" /></div>}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <input type="range" min="0" max={duration || 100} value={progress} onChange={handleSeek} className="w-full h-1 bg-[var(--border-primary)] rounded-full appearance-none cursor-pointer accent-[var(--accent)]"/>
                            <div className="flex justify-between text-[10px] text-[var(--text-secondary)] font-mono"><span>{formatTime(progress)}</span><span>{formatTime(duration)}</span></div>
                            <div className="flex items-center justify-between">
                                 <button onClick={prevSong} className="p-2 rounded-full hover:bg-[var(--bg-primary)] btn-press"><BackwardIcon className="w-5 h-5" /></button>
                                 <button onClick={togglePlay} className="p-3 rounded-full bg-[var(--accent)] text-white shadow-lg btn-press">{isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6 ml-0.5" />}</button>
                                 <button onClick={nextSong} className="p-2 rounded-full hover:bg-[var(--bg-primary)] btn-press"><ForwardIcon className="w-5 h-5" /></button>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-[var(--text-secondary)]">
                    <MusicalNoteIcon className="w-12 h-12 mb-2 opacity-50" />
                    <p className="text-sm font-semibold">No Music Playing</p>
                    <p className="text-xs mt-1">Drag & Drop audio files here</p>
                </div>
            )}
            {showPlaylist && (
                <div className="absolute inset-0 bg-[var(--bg-secondary)] z-20 flex flex-col animate-[slideUp_0.2s_ease-out]">
                    <div className="p-3 border-b border-[var(--border-primary)] flex justify-between items-center bg-[var(--bg-primary)]">
                        <span className="text-xs font-bold uppercase">Queue</span>
                        <button onClick={() => setShowPlaylist(false)}><CloseIcon className="w-4 h-4" /></button>
                    </div>
                    <div className="flex-grow overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {queue.map((song: any, i: number) => (
                            <div key={i} className={`flex items-center justify-between p-2 rounded-lg text-xs group ${i === currentSongIndex ? 'bg-[var(--accent)] text-white' : 'hover:bg-[var(--bg-primary)]'}`}>
                                <div className="flex items-center gap-2 truncate flex-1 cursor-pointer" onClick={() => onChange({ ...data, currentSongIndex: i, isPlaying: true })}>{i === currentSongIndex && <span className="animate-pulse">▶</span>}<span className="truncate">{song.title}</span></div>
                                <button onClick={() => removeSong(i)} className="p-1 opacity-0 group-hover:opacity-100 hover:text-[var(--danger)]"><TrashIcon className="w-3 h-3" /></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// Enhanced Spotify Widget
const presets = [
    { id: 'lofi', name: 'Lo-Fi', url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DWWQRwui0ExPn?utm_source=generator', icon: '☕' },
    { id: 'piano', name: 'Piano', url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX4sWSpwq3LiO?utm_source=generator', icon: '🎹' },
    { id: 'nature', name: 'Nature', url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX4PP3DA4J0N8?utm_source=generator', icon: '🌿' },
    { id: 'focus', name: 'Focus', url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DWWEJlAGA9gs0?utm_source=generator', icon: '🧠' },
    { id: 'energy', name: 'Energy', url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX4eRPd9frC1m?utm_source=generator', icon: '⚡' },
];

export const SpotifyWidget: React.FC<{ data: { url?: string }, onChange: (data: { url: string }) => void }> = ({ data, onChange }) => {
    const [inputUrl, setInputUrl] = useState('');
    const [showLibraries, setShowLibraries] = useState(!data.url); // Show library by default if empty

    const getEmbedUrl = (url: string) => {
        try { 
            if (url.includes('embed')) return url;
            const urlObj = new URL(url); 
            return `https://open.spotify.com/embed${urlObj.pathname}`; 
        } catch { return null; }
    };
    const embedUrl = data.url ? getEmbedUrl(data.url) : null;
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onChange({ url: inputUrl }); setShowLibraries(false); };

    return (
        <div className="w-full h-full relative group flex flex-col overflow-hidden bg-[var(--bg-secondary)]">
            {embedUrl ? (
                <div className="flex-grow relative">
                    <iframe src={embedUrl} width="100%" height="100%" frameBorder="0" allow="encrypted-media" className="bg-[var(--bg-secondary)]"></iframe>
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setShowLibraries(!showLibraries)} className="p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors text-xs" title="Libraries">
                            <QueueListIcon className="w-3 h-3" />
                        </button>
                        <button onClick={() => onChange({ url: '' })} className="p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors text-xs" title="Close Player">
                            <CloseIcon className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex-grow flex flex-col items-center justify-center p-4 text-center">
                    <SpotifyIcon className="w-10 h-10 text-[#1DB954] mb-3" />
                    <form onSubmit={handleSubmit} className="w-full max-w-[80%]">
                        <input type="text" value={inputUrl} onChange={(e) => setInputUrl(e.target.value)} placeholder="Paste Link..." className="w-full px-3 py-2 text-xs bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-md focus:outline-none focus:ring-1 focus:ring-[#1DB954] mb-2" />
                        <button type="submit" className="w-full py-1.5 bg-[#1DB954] text-white text-xs font-bold rounded-md hover:opacity-90 transition-opacity">Load</button>
                    </form>
                    <button onClick={() => setShowLibraries(true)} className="mt-2 text-xs text-[var(--text-secondary)] underline hover:text-[var(--text-primary)]">Browse Libraries</button>
                </div>
            )}

            {/* Library Drawer */}
            <div className={`absolute inset-y-0 left-0 w-16 bg-[var(--bg-primary)] border-r border-[var(--border-primary)] flex flex-col items-center py-2 gap-2 transition-transform duration-300 z-10 ${showLibraries ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="mb-2 pb-2 border-b border-[var(--border-primary)] w-full flex justify-center">
                    <button onClick={() => setShowLibraries(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><ChevronLeftIcon className="w-4 h-4" /></button>
                </div>
                <div className="flex-grow flex flex-col gap-2 overflow-y-auto custom-scrollbar w-full px-1">
                    {presets.map(p => (
                        <button 
                            key={p.id} 
                            onClick={() => { onChange({ url: p.url }); setShowLibraries(false); }}
                            className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors group/btn w-full"
                            title={p.name}
                        >
                            <span className="text-xl mb-1 group-hover/btn:scale-110 transition-transform">{p.icon}</span>
                            <span className="text-[8px] font-bold uppercase tracking-wide truncate w-full text-center">{p.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const ToDoListWidget: React.FC<{ data: ToDoItem[], onChange: (data: ToDoItem[]) => void }> = ({ data, onChange }) => <ToDoList todos={data || []} onChange={onChange} isWidget={true} />;

export const TerminalWidget: React.FC<{ onClose: () => void, data: any, onCommand: (cmd: string, args: string[]) => void }> = ({ onClose, data, onCommand }) => {
    const [input, setInput] = useState('');
    const history = data?.history || [];
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const cwdPath = data?.cwdPath || '/';

    useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [history]);
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { const parts = input.trim().split(' '); onCommand(parts[0], parts.slice(1)); setInput(''); } };

    return (
        <div className="w-full h-full bg-[#1e1e1e] text-[#cccccc] font-mono text-xs p-2 flex flex-col rounded-lg overflow-hidden border border-[#333]">
             <div className="flex justify-between items-center bg-[#252526] px-2 py-1 -mx-2 -mt-2 mb-1 border-b border-[#333]"><span className="font-bold">Terminal</span><button onClick={onClose} className="hover:text-white"><CloseIcon className="w-3 h-3" /></button></div>
            <div className="flex-grow overflow-y-auto custom-scrollbar space-y-1" ref={scrollRef} onClick={() => inputRef.current?.focus()}>
                {history.map((line: string, i: number) => <div key={i} className="break-words whitespace-pre-wrap">{line}</div>)}
                <div className="flex items-center"><span className="text-green-500 mr-1">user@zen-notes:{cwdPath}$</span><input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} className="flex-grow bg-transparent border-none outline-none text-[#cccccc]" autoFocus /></div>
            </div>
        </div>
    );
};

export const GoogleSearchWidget: React.FC<{ data: any, onSearch: (query: string) => void }> = ({ data, onSearch }) => {
    const [query, setQuery] = useState(data?.query || '');
    const { text, sources, loading, error } = data || {};
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSearch(query); };

    return (
        <div className="w-full h-full flex flex-col p-3 bg-[var(--bg-secondary)] overflow-hidden">
             <form onSubmit={handleSubmit} className="flex gap-2 mb-3 flex-shrink-0">
                 <div className="relative flex-grow">
                     <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ask Google..." className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
                     <GoogleIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 opacity-70" />
                 </div>
                 <button type="submit" disabled={loading} className="px-3 py-1.5 bg-[var(--accent)] text-white text-xs font-bold rounded-md hover:opacity-90 disabled:opacity-50 btn-press">{loading ? <Spinner className="w-3 h-3" /> : 'Go'}</button>
             </form>
             <div className="flex-grow overflow-y-auto custom-scrollbar text-sm space-y-3">
                 {error && <div className="text-[var(--danger)] text-xs p-2 bg-[var(--danger)]/10 rounded">{error}</div>}
                 {text ? (
                     <>
                        <div className="markdown-body text-xs leading-relaxed">{text.split('\n').map((line: string, i: number) => <p key={i} className="mb-1">{line}</p>)}</div>
                        {sources && sources.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-[var(--border-primary)]">
                                <p className="text-[10px] font-bold uppercase text-[var(--text-secondary)] mb-2">Sources</p>
                                <ul className="space-y-1">{sources.map((source: any, i: number) => (<li key={i}><a href={source.web?.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[var(--accent)] hover:underline truncate block">{source.web?.title || source.web?.uri}</a></li>))}</ul>
                            </div>
                        )}
                     </>
                 ) : !loading && <div className="h-full flex items-center justify-center text-[var(--text-secondary)] text-xs opacity-50 italic">Search results will appear here</div>}
             </div>
        </div>
    );
};

export const DictionaryWidget: React.FC<{ data: any, onChange: (data: any) => void }> = ({ data, onChange }) => {
    const [word, setWord] = useState(data?.word || '');
    const { result, loading, error } = data || {};
    const handleSearch = async (e: React.FormEvent) => { e.preventDefault(); if (!word.trim()) return; onChange({ ...data, word, loading: true, error: null }); try { const res = await lookupDictionary(word); onChange({ ...data, word, result: res, loading: false }); } catch (err) { onChange({ ...data, word, loading: false, error: "Definition not found." }); } };

    return (
        <div className="w-full h-full flex flex-col p-3 bg-[var(--bg-secondary)]">
             <form onSubmit={handleSearch} className="flex gap-2 mb-3 flex-shrink-0">
                 <input type="text" value={word} onChange={(e) => setWord(e.target.value)} placeholder="Define word..." className="w-full px-3 py-1.5 text-xs bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
                 <button type="submit" disabled={loading} className="px-3 py-1.5 bg-[var(--accent)] text-white text-xs font-bold rounded-md hover:opacity-90 disabled:opacity-50 btn-press">{loading ? <Spinner className="w-3 h-3" /> : <LanguageIcon className="w-4 h-4" />}</button>
             </form>
             <div className="flex-grow overflow-y-auto custom-scrollbar">
                 {error && <div className="text-[var(--danger)] text-xs text-center mt-4">{error}</div>}
                 {result && (
                     <div className="text-sm">
                         <div className="flex items-baseline gap-2 mb-2"><h3 className="text-xl font-bold capitalize">{result.word}</h3><span className="text-[var(--text-secondary)] font-mono text-xs">{result.phonetic}</span></div>
                         <div className="space-y-3">{result.meanings.map((m: any, i: number) => (<div key={i}><span className="italic text-xs text-[var(--accent)] font-bold">{m.partOfSpeech}</span><ul className="list-disc pl-4 mt-1 space-y-1">{m.definitions.slice(0, 2).map((d: any, j: number) => (<li key={j} className="text-xs">{d.definition}{d.example && <div className="text-[var(--text-secondary)] italic mt-0.5">"{d.example}"</div>}</li>))}</ul></div>))}</div>
                     </div>
                 )}
             </div>
        </div>
    );
};

export const ZipGameWidget: React.FC = () => {
    const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
    useEffect(() => { const cycle = async () => { while(true) { setPhase('Inhale'); await new Promise(r => setTimeout(r, 4000)); setPhase('Hold'); await new Promise(r => setTimeout(r, 4000)); setPhase('Exhale'); await new Promise(r => setTimeout(r, 4000)); setPhase('Hold'); await new Promise(r => setTimeout(r, 4000)); } }; cycle(); }, []);
    return (
        <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden bg-[var(--bg-secondary)]">
            <div className={`absolute w-32 h-32 bg-[var(--accent)] rounded-full opacity-20 blur-xl transition-all duration-[4000ms] ease-in-out ${phase === 'Inhale' ? 'scale-150 opacity-40' : phase === 'Exhale' ? 'scale-50 opacity-10' : 'scale-100 opacity-30'}`}></div>
            <div className="relative z-10 text-center"><div className="text-2xl font-bold tracking-widest uppercase mb-2 text-[var(--text-primary)] transition-all duration-500">{phase}</div><div className="text-xs text-[var(--text-secondary)]">4-4-4-4 Box Breathing</div></div>
        </div>
    );
};

export const TicTacToeWidget: React.FC = () => {
    const [squares, setSquares] = useState<string[]>(Array(9).fill(null));
    const [xIsNext, setXIsNext] = useState(true);
    const [winner, setWinner] = useState<string | null>(null);

    const handleClick = (i: number) => {
        if (winner || squares[i]) return;
        const newSquares = [...squares];
        newSquares[i] = xIsNext ? 'X' : 'O';
        setSquares(newSquares);
        setXIsNext(!xIsNext);
        calculateWinner(newSquares);
    };

    const calculateWinner = (squares: string[]) => {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        for (let i = 0; i < lines.length; i++) {
            const [a, b, c] = lines[i];
            if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
                setWinner(squares[a]);
                return;
            }
        }
        if (!squares.includes(null as any)) {
            setWinner('Draw');
        }
    };

    const resetGame = () => {
        setSquares(Array(9).fill(null));
        setXIsNext(true);
        setWinner(null);
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-[var(--bg-secondary)]">
            <div className="text-sm font-bold mb-2 text-[var(--text-primary)]">
                {winner ? (winner === 'Draw' ? "It's a Draw!" : `Winner: ${winner}`) : `Next Player: ${xIsNext ? 'X' : 'O'}`}
            </div>
            <div className="grid grid-cols-3 gap-1 bg-[var(--border-primary)] p-1 rounded">
                {squares.map((val, i) => (
                    <button 
                        key={i} 
                        onClick={() => handleClick(i)}
                        className="w-10 h-10 bg-[var(--bg-primary)] text-[var(--text-primary)] font-bold text-lg flex items-center justify-center hover:bg-[var(--bg-secondary)] transition-colors"
                    >
                        <span className={val === 'X' ? 'text-[var(--accent)]' : 'text-[var(--danger)]'}>{val}</span>
                    </button>
                ))}
            </div>
            <button 
                onClick={resetGame}
                className="mt-3 px-3 py-1 text-xs font-bold bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded hover:bg-[var(--border-primary)] transition-colors btn-press text-[var(--text-secondary)]"
            >
                Reset Game
            </button>
        </div>
    );
};

// Lightweight Single Player Snake Game
export const SnakeGameWidget: React.FC = () => {
    const [snake, setSnake] = useState<{x: number, y: number}[]>([{x: 5, y: 5}]);
    const [food, setFood] = useState<{x: number, y: number}>({x: 10, y: 10});
    const [direction, setDirection] = useState<'UP' | 'DOWN' | 'LEFT' | 'RIGHT'>('RIGHT');
    const [isPlaying, setIsPlaying] = useState(false);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const grid = 15; // 15x15 grid

    useEffect(() => {
        if (!isPlaying) return;
        
        const moveSnake = () => {
            setSnake(prev => {
                const newHead = { ...prev[0] };
                
                switch (direction) {
                    case 'UP': newHead.y -= 1; break;
                    case 'DOWN': newHead.y += 1; break;
                    case 'LEFT': newHead.x -= 1; break;
                    case 'RIGHT': newHead.x += 1; break;
                }

                // Check collision with walls
                if (newHead.x < 0 || newHead.x >= grid || newHead.y < 0 || newHead.y >= grid) {
                    setGameOver(true);
                    setIsPlaying(false);
                    return prev;
                }

                // Check collision with self
                if (prev.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
                    setGameOver(true);
                    setIsPlaying(false);
                    return prev;
                }

                const newSnake = [newHead, ...prev];
                
                // Check food
                if (newHead.x === food.x && newHead.y === food.y) {
                    setScore(s => s + 1);
                    // Generate new food
                    let newFood;
                    do {
                        newFood = {
                            x: Math.floor(Math.random() * grid),
                            y: Math.floor(Math.random() * grid)
                        };
                    } while (newSnake.some(s => s.x === newFood.x && s.y === newFood.y));
                    setFood(newFood);
                } else {
                    newSnake.pop();
                }
                
                return newSnake;
            });
        };

        const gameLoop = setInterval(moveSnake, 200); // Faster pace
        return () => clearInterval(gameLoop);
    }, [isPlaying, direction, food]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        switch(e.key) {
            case 'ArrowUp': if(direction !== 'DOWN') setDirection('UP'); break;
            case 'ArrowDown': if(direction !== 'UP') setDirection('DOWN'); break;
            case 'ArrowLeft': if(direction !== 'RIGHT') setDirection('LEFT'); break;
            case 'ArrowRight': if(direction !== 'LEFT') setDirection('RIGHT'); break;
        }
    };

    const resetGame = () => {
        setSnake([{x: 5, y: 5}]);
        setFood({x: 10, y: 10});
        setDirection('RIGHT');
        setScore(0);
        setGameOver(false);
        setIsPlaying(true);
    };

    return (
        <div 
            className="w-full h-full flex flex-col items-center justify-center bg-[var(--bg-secondary)] p-2 relative outline-none"
            tabIndex={0}
            onKeyDown={handleKeyDown}
        >
            <div className="absolute top-2 left-2 text-xs font-bold text-[var(--text-secondary)]">Score: {score}</div>
            
            {gameOver ? (
                <div className="text-center z-10">
                    <p className="text-[var(--danger)] font-bold mb-2">Game Over</p>
                    <button onClick={resetGame} className="px-3 py-1 bg-[var(--accent)] text-white rounded text-xs btn-press shadow-lg">Try Again</button>
                </div>
            ) : !isPlaying ? (
                <div className="text-center z-10">
                    <p className="text-[var(--text-primary)] font-bold mb-1">Snake</p>
                    <button onClick={resetGame} className="px-3 py-1 bg-[var(--accent)] text-white rounded text-xs btn-press shadow-lg">Start</button>
                </div>
            ) : null}

            <div 
                className="relative bg-[var(--bg-primary)] border border-[var(--border-primary)] shadow-inner"
                style={{ 
                    width: '150px', 
                    height: '150px', 
                    display: 'grid', 
                    gridTemplateColumns: `repeat(${grid}, 1fr)`, 
                    gridTemplateRows: `repeat(${grid}, 1fr)` 
                }}
            >
                {Array.from({length: grid * grid}).map((_, i) => {
                    const x = i % grid;
                    const y = Math.floor(i / grid);
                    const isSnake = snake.some(s => s.x === x && s.y === y);
                    const isFood = food.x === x && food.y === y;
                    return (
                        <div key={i} className={`${isSnake ? 'bg-[var(--accent)] rounded-sm' : isFood ? 'bg-[var(--danger)] rounded-full transform scale-75' : ''}`}></div>
                    );
                })}
            </div>
            
            {/* Mobile/Touch Controls */}
            <div className="mt-2 flex gap-1">
                <button onClick={() => direction !== 'RIGHT' && setDirection('LEFT')} className="p-1 bg-[var(--bg-primary)] rounded border border-[var(--border-primary)] hover:bg-[var(--accent)] hover:text-white"><ChevronLeftIcon className="w-3 h-3"/></button>
                <div className="flex flex-col gap-1">
                    <button onClick={() => direction !== 'DOWN' && setDirection('UP')} className="p-1 bg-[var(--bg-primary)] rounded border border-[var(--border-primary)] hover:bg-[var(--accent)] hover:text-white"><ChevronLeftIcon className="w-3 h-3 rotate-90"/></button>
                    <button onClick={() => direction !== 'UP' && setDirection('DOWN')} className="p-1 bg-[var(--bg-primary)] rounded border border-[var(--border-primary)] hover:bg-[var(--accent)] hover:text-white"><ChevronLeftIcon className="w-3 h-3 -rotate-90"/></button>
                </div>
                <button onClick={() => direction !== 'LEFT' && setDirection('RIGHT')} className="p-1 bg-[var(--bg-primary)] rounded border border-[var(--border-primary)] hover:bg-[var(--accent)] hover:text-white"><ChevronRightIcon className="w-3 h-3"/></button>
            </div>
        </div>
    );
};

// Export CalculatorWidget from external file to avoid duplication if already defined in Widget.tsx
export { CalculatorWidget } from './CalculatorWidget';
