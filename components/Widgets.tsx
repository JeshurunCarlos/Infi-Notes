
import React, { useState, useEffect, useRef } from 'react';
import { WidgetType, ToDoItem } from '../types';
import { TimerIcon, ImageIcon, LinkIcon, CalculatorIcon, CloseIcon, MicrophoneIcon, ClipboardIcon, MusicNoteIcon, PlayIcon, PauseIcon, BackwardIcon, ForwardIcon, SpotifyIcon, PlusIcon, MinusIcon, TerminalIcon, ArrowsPointingInIcon, EyeIcon, EyeSlashIcon, GoogleIcon, ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon, SpeakerWaveIcon, QueueListIcon, TrashIcon, MusicalNoteIcon, SpeakerXMarkIcon, FolderIcon, SparklesIcon, ArrowPathIcon, LanguageIcon, ClipboardDocumentCheckIcon, ArrowsPointingOutIcon, BoltIcon, ChatBubbleLeftRightIcon, CubeIcon, ListBulletIcon, Squares2X2Icon, NewspaperIcon, ArrowDownIcon, ArrowPathIcon as RefreshIcon } from './Icons';
import Spinner from './Spinner';
import ToDoList from './ToDoList';
import { performGoogleSearch, getMusicSuggestions, lookupDictionary, DictionaryResult, performChat, fetchNews, NewsItem } from '../lib/ai';
import { CalculatorWidget } from './CalculatorWidget';

// Re-export CalculatorWidget
export { CalculatorWidget };

declare global {
  interface Window {
    jsmediatags: any;
  }
}

// --- Simple Markdown Parser Component ---
const SimpleMarkdown: React.FC<{ content: string }> = ({ content }) => {
    if (!content) return null;

    // Helper to process inline formatting
    const renderInline = (text: string) => {
        // Regex splits: bold, italic, inline code, images, links
        const parts = text.split(/(\*\*[^*]+\*\*|_[^_]+_|`[^`]+`|!\[[^\]]*\]\([^)]+\)|\[[^\]]+\]\([^)]+\))/g);
        
        return parts.map((part, i) => {
            // Bold
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-bold text-[var(--text-primary)]">{part.slice(2, -2)}</strong>;
            }
            // Italic
            if (part.startsWith('_') && part.endsWith('_')) {
                return <em key={i} className="italic text-[var(--text-secondary)]">{part.slice(1, -1)}</em>;
            }
            // Inline Code
            if (part.startsWith('`') && part.endsWith('`')) {
                return <code key={i} className="bg-[var(--bg-primary)] border border-[var(--border-primary)] px-1 rounded font-mono text-[var(--accent)] text-xs">{part.slice(1, -1)}</code>;
            }
            // Images: ![alt](url)
            if (part.startsWith('![') && part.includes('](') && part.endsWith(')')) {
                const match = part.match(/!\[(.*?)\]\((.*?)\)/);
                if (match) return <img key={i} src={match[2]} alt={match[1]} className="max-w-full rounded-lg my-2 border border-[var(--border-primary)]" />;
            }
            // Links: [text](url)
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
        
        // Handle Lists
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            inList = true;
            listBuffer.push(<li key={`li-${index}`} className="mb-1">{renderInline(trimmed.substring(2))}</li>);
            return;
        } 
        
        // Flush List if needed
        if (inList) {
            elements.push(<ul key={`ul-${index}`} className="list-disc pl-5 mb-2 space-y-1">{listBuffer}</ul>);
            listBuffer = [];
            inList = false;
        }

        if (!trimmed) {
            // Empty line -> implies spacing, maybe handled by margin of previous block
            return;
        }

        // Headings
        if (trimmed.startsWith('### ')) {
            elements.push(<h3 key={index} className="text-sm font-bold mt-3 mb-1 text-[var(--text-primary)]">{renderInline(trimmed.substring(4))}</h3>);
        } else if (trimmed.startsWith('## ')) {
            elements.push(<h2 key={index} className="text-base font-bold mt-4 mb-2 text-[var(--text-primary)]">{renderInline(trimmed.substring(3))}</h2>);
        } else if (trimmed.startsWith('# ')) {
            elements.push(<h1 key={index} className="text-lg font-bold mt-4 mb-2 text-[var(--text-primary)]">{renderInline(trimmed.substring(2))}</h1>);
        }
        // Code Blocks (simplistic handling for lines starting with ```)
        else if (trimmed.startsWith('```')) {
             // For simplicity in this lightweight parser, we just ignore the fence line or treat content as code block if logic was more complex.
             // Here we'll just skip the fence line to avoid rendering it as text.
        }
        // Standard Paragraph
        else {
            elements.push(<p key={index} className="mb-2 leading-relaxed">{renderInline(trimmed)}</p>);
        }
    });

    // Flush remaining list
    if (inList && listBuffer.length > 0) {
        elements.push(<ul key="ul-end" className="list-disc pl-5 mb-2 space-y-1">{listBuffer}</ul>);
    }

    return <div className="markdown-content text-xs">{elements}</div>;
};


// Widget Selection (Inline)
interface WidgetSelectionViewProps {
  onSelect: (type: WidgetType) => void;
  onCancel: () => void;
}

export const WidgetSelectionView: React.FC<WidgetSelectionViewProps> = ({ onSelect, onCancel }) => {
    const allOptions = [
        { type: 'news', label: 'News', description: 'Latest World Headlines', icon: <NewspaperIcon className="w-6 h-6" /> },
        { type: 'pomodoro', label: 'Pomodoro', description: 'Focus Timer', icon: <TimerIcon className="w-6 h-6" /> },
        { type: 'googlesearch', label: 'Search', description: 'Quick Google Search', icon: <GoogleIcon className="w-6 h-6" /> },
        { type: 'chatgpt', label: 'ChatGPT', description: 'AI Assistant', icon: <ChatBubbleLeftRightIcon className="w-6 h-6" /> },
        { type: 'todolist', label: 'To-Do', description: 'Task Manager', icon: <ClipboardIcon className="w-6 h-6" /> },
        { type: 'calculator', label: 'Calc', description: 'Scientific Calculator', icon: <CalculatorIcon className="w-6 h-6" /> },
        { type: 'dictionary', label: 'Dict', description: 'Definitions & Synonyms', icon: <LanguageIcon className="w-6 h-6" /> },
        { type: 'spotify', label: 'Spotify', description: 'Music Player', icon: <SpotifyIcon className="w-6 h-6" /> },
        { type: 'music', label: 'Local Music', description: 'Play Local Files', icon: <MusicNoteIcon className="w-6 h-6" /> },
        { type: 'stickynote', label: 'Notes', description: 'Quick Memo', icon: <ClipboardIcon className="w-6 h-6" /> },
        { type: 'image', label: 'Image', description: 'Photo Frame', icon: <ImageIcon className="w-6 h-6" /> },
        { type: 'hyperlink', label: 'Link', description: 'Quick Bookmark', icon: <LinkIcon className="w-6 h-6" /> },
        { type: 'terminal', label: 'Terminal', description: 'Command Line', icon: <TerminalIcon className="w-6 h-6" /> },
        { type: 'game2048', label: '2048', description: 'Puzzle Game', icon: <CubeIcon className="w-6 h-6" /> },
        { type: 'snake', label: 'Snake', description: 'Classic Game', icon: <span className="text-xl">🐍</span> },
        { type: 'zipgame', label: 'Breathe', description: '4-7-8 Breathing', icon: <SparklesIcon className="w-6 h-6" /> },
    ] as const;
    
    const [page, setPage] = useState(0);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    
    const pageSize = 9;
    const numPages = Math.ceil(allOptions.length / pageSize);
    const optionsToShow = allOptions.slice(page * pageSize, (page + 1) * pageSize);
    
    const lastSwipeTime = useRef(0);

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.altKey && e.key.toLowerCase() === 'e') {
                e.preventDefault();
                onCancel();
            } else if (viewMode === 'grid') {
                if (e.key === 'ArrowRight') {
                    setPage(p => (p + 1) % numPages);
                } else if (e.key === 'ArrowLeft') {
                    setPage(p => (p - 1 + numPages) % numPages);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [viewMode, numPages, onCancel]);

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
            className="w-full h-full flex flex-col p-2 relative rounded-xl overflow-hidden animated-gradient-placeholder"
        >
            {/* Inner Glass Container */}
            <div className="absolute inset-0 bg-[var(--bg-primary)]/80 backdrop-blur-md z-0"></div>

            {/* Header */}
            <div className="relative z-10 flex justify-between items-center mb-2 px-1 flex-shrink-0 h-8 border-b border-[var(--border-primary)]/50 pb-1">
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-1 rounded transition-colors ${viewMode === 'grid' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'}`}
                        title="Grid View"
                    >
                        <Squares2X2Icon className="w-3 h-3" />
                    </button>
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`p-1 rounded transition-colors ${viewMode === 'list' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'}`}
                        title="List View"
                    >
                        <ListBulletIcon className="w-3 h-3" />
                    </button>
                </div>
                <button 
                    onClick={onCancel} 
                    className="p-1 rounded-full hover:bg-[var(--bg-primary)] btn-press text-[var(--text-secondary)] hover:text-[var(--danger)] transition-colors flex items-center gap-1"
                    title="Close (Alt+E)"
                >
                    <span className="text-[9px] font-mono opacity-50 hidden sm:inline">Alt+E</span>
                    <CloseIcon className="w-3 h-3"/>
                </button>
            </div>
            
            {/* Content Area */}
            {viewMode === 'grid' ? (
                <>
                    <div className="relative z-10 flex-grow min-h-0 grid grid-cols-3 grid-rows-3 gap-2">
                        {optionsToShow.map(option => (
                            <button 
                                key={option.type}
                                onClick={() => onSelect(option.type as WidgetType)}
                                className="group flex flex-col items-center justify-center rounded-lg transition-all duration-300 w-full h-full btn-press relative overflow-hidden hover:bg-[var(--bg-secondary)] border border-transparent hover:border-[var(--border-primary)]"
                            >
                                <div className="text-[var(--text-secondary)] group-hover:text-[var(--accent)] group-hover:scale-110 transition-all duration-300">
                                     {option.icon}
                                </div>
                                <span className="text-[9px] font-semibold mt-1 text-[var(--text-primary)]/70 group-hover:text-[var(--text-primary)] transition-colors">{option.label}</span>
                            </button>
                        ))}
                        {/* Fillers for empty slots */}
                        {Array.from({ length: pageSize - optionsToShow.length }).map((_, i) => (
                            <div key={`empty-${i}`} className="w-full h-full" />
                        ))}
                    </div>

                    {/* Pagination Dots */}
                    {numPages > 1 && (
                        <div className="relative z-10 flex items-center justify-center gap-2 mt-1 flex-shrink-0 h-5">
                            <button 
                                onClick={() => setPage(p => (p - 1 + numPages) % numPages)} 
                                className="p-0.5 hover:text-[var(--accent)] disabled:opacity-30"
                            >
                                <ChevronLeftIcon className="w-3 h-3" />
                            </button>
                            <div className="flex gap-1">
                                {Array.from({length: numPages}).map((_, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => setPage(i)}
                                        className={`h-1.5 rounded-full transition-all duration-300 ${i === page ? 'bg-[var(--accent)] w-3' : 'bg-[var(--border-primary)] w-1.5'}`} 
                                    />
                                ))}
                            </div>
                            <button 
                                onClick={() => setPage(p => (p + 1) % numPages)} 
                                className="p-0.5 hover:text-[var(--accent)] disabled:opacity-30"
                            >
                                <ChevronRightIcon className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                </>
            ) : (
                /* List View */
                <div className="relative z-10 flex-grow overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-1">
                    {allOptions.map(option => (
                        <button
                            key={option.type}
                            onClick={() => onSelect(option.type as WidgetType)}
                            className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-[var(--bg-secondary)] border border-transparent hover:border-[var(--border-primary)] transition-all group text-left"
                        >
                            <div className="text-[var(--text-secondary)] group-hover:text-[var(--accent)]">
                                {option.icon}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-[var(--text-primary)]">{option.label}</span>
                                <span className="text-[9px] text-[var(--text-secondary)]">{option.description}</span>
                            </div>
                        </button>
                    ))}
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
    <div className={`relative w-full h-full bg-[var(--bg-secondary)] text-[var(--text-primary)] ${noPadding ? '' : 'p-4'}`}>
        {children}
    </div>
);

// News Widget
export const NewsWidget: React.FC = () => {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadNews = async () => {
        setLoading(true);
        setError(null);
        try {
            const items = await fetchNews();
            if (items.length > 0) {
                setNews(items);
            } else {
                setError("No news found.");
            }
        } catch (e) {
            setError("Failed to fetch news.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNews();
    }, []);

    const nextNews = () => {
        if (news.length > 0) {
            setCurrentIndex((prev) => (prev + 1) % news.length);
        }
    };

    const currentItem = news[currentIndex];

    return (
        <div className="w-full h-full flex flex-col relative overflow-hidden bg-[var(--bg-secondary)]">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-[var(--border-primary)] bg-[var(--bg-primary)]">
                <div className="flex items-center gap-2">
                    <NewspaperIcon className="w-4 h-4 text-[var(--accent)]" />
                    <span className="text-xs font-bold uppercase tracking-wider">Latest News</span>
                </div>
                <button 
                    onClick={loadNews} 
                    className={`p-1.5 rounded-full hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] transition-all btn-press ${loading ? 'animate-spin' : ''}`}
                    title="Refresh"
                >
                    <RefreshIcon className="w-3 h-3" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-grow p-4 relative flex flex-col">
                {loading ? (
                    <div className="flex-grow flex items-center justify-center">
                        <Spinner className="w-6 h-6 text-[var(--accent)]" />
                    </div>
                ) : error ? (
                    <div className="flex-grow flex items-center justify-center text-center text-xs text-[var(--danger)]">
                        {error}
                    </div>
                ) : currentItem ? (
                    <div className="flex-grow flex flex-col justify-between animate-slide-fade" key={currentIndex}>
                        <div>
                            <a href={currentItem.url} target="_blank" rel="noopener noreferrer" className="block text-sm font-bold leading-snug mb-2 hover:text-[var(--accent)] transition-colors line-clamp-3">
                                {currentItem.title}
                            </a>
                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-4">
                                {currentItem.summary}
                            </p>
                        </div>
                        <div className="mt-3 flex justify-between items-end">
                            <span className="text-[10px] font-mono text-[var(--text-secondary)] opacity-70 italic">
                                {currentItem.source}
                            </span>
                            <div className="text-[10px] text-[var(--text-secondary)]">
                                {currentIndex + 1} / {news.length}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-grow flex items-center justify-center text-xs text-[var(--text-secondary)]">
                        No articles available.
                    </div>
                )}
            </div>

            {/* Controls */}
            {!loading && !error && news.length > 0 && (
                <div className="absolute bottom-3 right-3">
                    <button 
                        onClick={nextNews}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-lg hover:bg-[var(--accent)]/90 transition-all btn-press"
                        title="Next Story"
                    >
                        <ArrowDownIcon className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
};

// 2048 Game Widget (unchanged)
export const Game2048Widget: React.FC = () => {
    // ... existing code for 2048 ...
    const [grid, setGrid] = useState<number[][]>([[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [hasWon, setHasWon] = useState(false);
    const initialized = useRef(false);

    // Initialize game
    useEffect(() => {
        if (!initialized.current) {
            initializeGame();
            initialized.current = true;
        }
    }, []);

    const initializeGame = () => {
        let newGrid = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
        addRandomTile(newGrid);
        addRandomTile(newGrid);
        setGrid(newGrid);
        setScore(0);
        setGameOver(false);
        setHasWon(false);
    };

    const addRandomTile = (currentGrid: number[][]) => {
        const emptyCells = [];
        for(let r=0; r<4; r++) {
            for(let c=0; c<4; c++) {
                if(currentGrid[r][c] === 0) emptyCells.push({r, c});
            }
        }
        if(emptyCells.length > 0) {
            const {r, c} = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            currentGrid[r][c] = Math.random() < 0.9 ? 2 : 4;
        }
    };

    const move = (direction: 'up' | 'down' | 'left' | 'right') => {
        if(gameOver) return;

        let newGrid = grid.map(row => [...row]);
        let moved = false;
        let scoreGain = 0;

        const slide = (row: number[]) => {
            const filtered = row.filter(val => val !== 0);
            const missing = 4 - filtered.length;
            const zeros = Array(missing).fill(0);
            return filtered.concat(zeros);
        };

        const combine = (row: number[]) => {
            for (let i = 0; i < 3; i++) {
                if (row[i] !== 0 && row[i] === row[i + 1]) {
                    row[i] *= 2;
                    scoreGain += row[i];
                    row[i + 1] = 0;
                    if(row[i] === 2048) setHasWon(true);
                }
            }
            return row;
        };

        if (direction === 'left' || direction === 'right') {
            for(let r=0; r<4; r++) {
                let row = newGrid[r];
                if (direction === 'right') row.reverse();
                let original = [...row];
                
                row = slide(row);
                row = combine(row);
                row = slide(row); // Slide again after merge

                if (direction === 'right') row.reverse();
                newGrid[r] = row;
                
                if(JSON.stringify(newGrid[r]) !== JSON.stringify(grid[r])) moved = true;
            }
        } else {
            // Transpose for up/down
            for (let c=0; c<4; c++) {
                let col = [newGrid[0][c], newGrid[1][c], newGrid[2][c], newGrid[3][c]];
                if(direction === 'down') col.reverse();
                
                let original = [...col];
                col = slide(col);
                col = combine(col);
                col = slide(col);
                
                if(direction === 'down') col.reverse();
                
                for(let r=0; r<4; r++) newGrid[r][c] = col[r];
                if(JSON.stringify(col) !== JSON.stringify(original)) moved = true;
            }
        }

        if (moved) {
            addRandomTile(newGrid);
            setGrid(newGrid);
            setScore(prev => prev + scoreGain);
            
            let canMove = false;
            for(let r=0; r<4; r++) {
                for(let c=0; c<4; c++) {
                    if(newGrid[r][c] === 0) canMove = true;
                    if(c < 3 && newGrid[r][c] === newGrid[r][c+1]) canMove = true;
                    if(r < 3 && newGrid[r][c] === newGrid[r+1][c]) canMove = true;
                }
            }
            if (!canMove) setGameOver(true);
        }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault(); 
            const dirMap: {[key: string]: 'up'|'down'|'left'|'right'} = {
                'ArrowUp': 'up', 'ArrowDown': 'down', 'ArrowLeft': 'left', 'ArrowRight': 'right'
            };
            move(dirMap[e.key]);
        }
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    });
    
    const getTileColor = (val: number) => {
        const colors: {[key: number]: string} = {
            0: 'bg-[var(--bg-secondary)]',
            2: 'bg-[#eee4da] text-[#776e65]',
            4: 'bg-[#ede0c8] text-[#776e65]',
            8: 'bg-[#f2b179] text-white',
            16: 'bg-[#f59563] text-white',
            32: 'bg-[#f67c5f] text-white',
            64: 'bg-[#f65e3b] text-white',
            128: 'bg-[#edcf72] text-white text-xl',
            256: 'bg-[#edcc61] text-white text-xl',
            512: 'bg-[#edc850] text-white text-xl',
            1024: 'bg-[#edc53f] text-white text-lg',
            2048: 'bg-[#edc22e] text-white text-lg shadow-[0_0_30px_10px_rgba(243,215,116,0.4)]',
        };
        return colors[val] || 'bg-[#3c3a32] text-white';
    }

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-3 bg-[#bbada0] rounded-lg relative overflow-hidden" tabIndex={0}>
             <div className="flex justify-between w-full mb-2 px-1">
                 <div className="text-2xl font-bold text-[#776e65] dark:text-white">2048</div>
                 <div className="bg-[#8f7a66] rounded px-2 py-1 text-center min-w-[60px]">
                     <div className="text-[10px] text-[#eee4da] font-bold uppercase">Score</div>
                     <div className="text-white font-bold text-sm leading-none">{score}</div>
                 </div>
             </div>
             
             <div className="relative bg-[#bbada0] p-1 rounded w-full aspect-square grid grid-cols-4 gap-1.5 sm:gap-2">
                 {grid.map((row, rIndex) => (
                     row.map((val, cIndex) => (
                         <div 
                            key={`${rIndex}-${cIndex}`} 
                            className={`rounded flex items-center justify-center font-bold text-2xl transition-all duration-100 ${getTileColor(val)}`}
                        >
                             {val > 0 ? val : ''}
                         </div>
                     ))
                 ))}
                 
                 {(gameOver || hasWon) && (
                    <div className="absolute inset-0 bg-[rgba(238,228,218,0.73)] flex flex-col items-center justify-center z-10 rounded animate-in fade-in">
                        <div className="text-3xl font-bold text-[#776e65] mb-2">{hasWon ? 'You Win!' : 'Game Over'}</div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); initializeGame(); }} 
                            className="px-4 py-2 bg-[#8f7a66] text-white font-bold rounded hover:bg-[#9f8b77] transition-colors btn-press"
                        >
                            Try Again
                        </button>
                    </div>
                 )}
             </div>
             
             <p className="text-[10px] text-[#776e65] dark:text-white/70 mt-2 text-center font-medium">Use arrow keys to merge tiles</p>
        </div>
    );
};

// Pomodoro Widget (unchanged code...)
export const PomodoroWidget: React.FC = () => {
    // ... existing PomodoroWidget code
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

// Image Widget (unchanged)
interface ImageWidgetProps { data: { url?: string }; onChange: (data: { url: string }) => void; }
export const ImageWidget: React.FC<ImageWidgetProps> = ({ data, onChange }) => {
    // ... existing ImageWidget code
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

    return (
        <div 
            className={`w-full h-full flex flex-col items-center justify-center p-2 rounded-lg relative overflow-hidden group border-2 border-dashed transition-all ${isDraggingOver ? 'border-[var(--accent)] bg-[var(--highlight-kp-bg)]' : 'border-transparent'}`}
            onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={handleDrop}
        >
            {data?.url ? (
                <img src={data.url} alt="Widget" className="w-full h-full object-cover rounded-md pointer-events-none" />
            ) : (
                <div className="flex flex-col items-center text-[var(--text-secondary)] opacity-50">
                    <ImageIcon className="w-8 h-8 mb-2" />
                    <span className="text-xs">Drop Image Here</span>
                </div>
            )}
        </div>
    );
};

// Hyperlink Widget (unchanged)
interface HyperlinkWidgetProps { data: { url?: string, text?: string }; onChange: (data: { url: string, text: string }) => void; }
export const HyperlinkWidget: React.FC<HyperlinkWidgetProps> = ({ data, onChange }) => {
    // ... existing HyperlinkWidget code
    const [isEditing, setIsEditing] = useState(!data?.url);
    const [url, setUrl] = useState(data?.url || '');
    const [text, setText] = useState(data?.text || '');

    const handleSave = () => {
        onChange({ url, text: text || url });
        setIsEditing(false);
    };

    return (
        <div className="w-full h-full flex flex-col p-4">
             <div className="flex justify-between items-center mb-2">
                 <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                     <LinkIcon className="w-4 h-4" />
                     <span className="text-xs font-bold uppercase">Link</span>
                 </div>
                 {!isEditing && <button onClick={() => setIsEditing(true)} className="text-xs hover:text-[var(--accent)]">Edit</button>}
             </div>
             
             {isEditing ? (
                 <div className="flex flex-col gap-2 h-full justify-center">
                     <input 
                         type="text" 
                         placeholder="URL (https://...)" 
                         value={url} 
                         onChange={e => setUrl(e.target.value)}
                         className="w-full p-1 text-xs bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded"
                     />
                     <input 
                         type="text" 
                         placeholder="Label" 
                         value={text} 
                         onChange={e => setText(e.target.value)}
                         className="w-full p-1 text-xs bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded"
                     />
                     <button onClick={handleSave} className="w-full py-1 bg-[var(--accent)] text-white text-xs rounded">Save</button>
                 </div>
             ) : (
                 <a href={url} target="_blank" rel="noopener noreferrer" className="flex-grow flex items-center justify-center text-center p-2 hover:bg-[var(--bg-primary)] rounded-lg border border-[var(--border-primary)] transition-all group">
                     <div>
                         <div className="text-lg font-bold text-[var(--accent)] group-hover:underline">{text}</div>
                         <div className="text-[10px] text-[var(--text-secondary)] truncate max-w-[120px]">{url}</div>
                     </div>
                 </a>
             )}
        </div>
    );
};

// Sticky Note Widget (unchanged)
interface StickyNoteWidgetProps { data: { notes?: string[] }; onChange: (data: { notes: string[] }) => void; }
export const StickyNoteWidget: React.FC<StickyNoteWidgetProps> = ({ data, onChange }) => {
    // ... existing StickyNoteWidget code
    const [note, setNote] = useState(data?.notes?.[0] || '');
    
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNote(e.target.value);
        onChange({ notes: [e.target.value] });
    };

    return (
        <div className="w-full h-full bg-[#fef3c7] text-gray-800 p-3 relative flex flex-col font-handwriting">
            <div className="w-full h-4 bg-[#fde68a] absolute top-0 left-0 opacity-50"></div>
            <textarea 
                className="w-full h-full bg-transparent resize-none outline-none text-sm pt-4" 
                value={note}
                onChange={handleChange}
                placeholder="Type a note..."
            />
        </div>
    );
};

// Music Player Widget (unchanged)
export const MusicPlayerWidget: React.FC<any> = () => {
    return (
        <div className="w-full h-full flex items-center justify-center bg-black/5 p-4 rounded-lg">
             <div className="text-center">
                 <MusicNoteIcon className="w-8 h-8 mx-auto mb-2 text-[var(--accent)]" />
                 <p className="text-xs text-[var(--text-secondary)]">Drop Audio Files Here</p>
             </div>
        </div>
    );
};

// Spotify Widget (unchanged)
const PLAYLIST_LIBRARIES = [
    { id: 'lofi', name: 'Lo-Fi Beats', color: '#8b5cf6', url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DWWQRwui0ExPn' },
    { id: 'focus', name: 'Deep Focus', color: '#3b82f6', url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DWZeKCadgRdKQ' },
    { id: 'piano', name: 'Peaceful Piano', color: '#10b981', url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX4sWSpwq3LiO' },
    { id: 'nature', name: 'Nature Sounds', color: '#f59e0b', url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX4PP3DA4J0N8' },
    { id: 'classical', name: 'Classical', color: '#ef4444', url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DWWEJlAGA9gs0' },
    { id: 'jazz', name: 'Jazz Vibes', color: '#ec4899', url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DXbITwg1ZjkYt' }
];

interface SpotifyWidgetProps { data: { url?: string }; onChange: (data: { url: string }) => void; }
export const SpotifyWidget: React.FC<SpotifyWidgetProps> = ({ data, onChange }) => {
    // ... existing SpotifyWidget code
    const [url, setUrl] = useState(data?.url || '');
    const [embedUrl, setEmbedUrl] = useState('');
    const [view, setView] = useState<'player' | 'library' | 'custom'>(data?.url ? 'player' : 'library');
    const [customInput, setCustomInput] = useState('');

    useEffect(() => {
        if (data?.url) {
            const processed = processUrl(data.url);
            setEmbedUrl(processed);
            setView('player');
        } else {
            setView('library');
        }
    }, [data?.url]);

    const processUrl = (rawUrl: string) => {
        if (!rawUrl) return '';
        if (rawUrl.includes('/embed/')) return rawUrl;
        const parts = rawUrl.split('.com/');
        if (parts.length > 1) {
            return `https://open.spotify.com/embed/${parts[1]}`;
        }
        return rawUrl;
    };

    const handleLibrarySelect = (libUrl: string) => {
        onChange({ url: libUrl });
    };

    const handleCustomSave = () => {
        if (customInput) {
            onChange({ url: customInput });
        }
    };

    if (view === 'player' && embedUrl) {
        return (
            <div className="w-full h-full relative group bg-black">
                <iframe 
                    src={embedUrl} 
                    width="100%" 
                    height="100%" 
                    frameBorder="0" 
                    allow="encrypted-media" 
                    className="absolute inset-0"
                    title="Spotify Embed"
                ></iframe>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button 
                        onClick={() => setView('library')} 
                        className="p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 backdrop-blur-md"
                        title="Change Playlist"
                    >
                        <QueueListIcon className="w-3 h-3" />
                    </button>
                </div>
            </div>
        );
    }

    if (view === 'custom') {
        return (
             <div className="w-full h-full flex flex-col items-center justify-center p-4 gap-3 bg-[var(--bg-secondary)]">
                 <div className="flex items-center gap-2 w-full">
                    <button onClick={() => setView('library')} className="p-1 hover:bg-[var(--border-primary)] rounded"><ChevronLeftIcon className="w-4 h-4" /></button>
                    <span className="text-xs font-bold uppercase text-[var(--text-secondary)]">Custom Link</span>
                 </div>
                 <SpotifyIcon className="w-8 h-8 text-[#1DB954]" />
                 <input 
                     type="text" 
                     placeholder="Spotify Link..." 
                     value={customInput} 
                     onChange={e => setCustomInput(e.target.value)}
                     className="w-full p-2 text-xs bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded focus:ring-1 focus:ring-[#1DB954] outline-none"
                 />
                 <button onClick={handleCustomSave} className="w-full py-1.5 bg-[#1DB954] text-white text-xs font-bold rounded hover:opacity-90">Load</button>
             </div>
        );
    }

    // Library View
    return (
        <div className="w-full h-full flex flex-col bg-[var(--bg-secondary)] overflow-hidden">
            <div className="p-3 border-b border-[var(--border-primary)] flex justify-between items-center bg-[var(--bg-primary)]">
                <span className="text-xs font-bold uppercase text-[var(--text-secondary)] flex items-center gap-2">
                    <SpotifyIcon className="w-4 h-4 text-[#1DB954]" /> Library
                </span>
                <button onClick={() => setView('custom')} className="text-[10px] text-[var(--accent)] hover:underline">Paste Link</button>
            </div>
            <div className="flex-grow overflow-y-auto custom-scrollbar p-2 grid grid-cols-2 gap-2 content-start">
                {PLAYLIST_LIBRARIES.map(lib => (
                    <button
                        key={lib.id}
                        onClick={() => handleLibrarySelect(lib.url)}
                        className="relative aspect-[1.2] rounded-lg overflow-hidden group flex flex-col justify-end p-2 transition-transform hover:scale-[1.02]"
                        style={{ backgroundColor: lib.color }}
                    >
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                        <span className="relative z-10 text-white text-[10px] font-bold leading-tight text-left">{lib.name}</span>
                        <div className="absolute top-2 right-2 opacity-50">
                            <MusicNoteIcon className="w-3 h-3 text-white" />
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

// ToDo List Widget Wrapper (unchanged)
export const ToDoListWidget: React.FC<any> = ({ data, onChange }) => {
    return <ToDoList todos={data?.todos || []} onChange={(todos) => onChange({ todos })} isWidget={true} />;
};

// Terminal Widget (unchanged)
export const TerminalWidget: React.FC<any> = ({ data, onCommand }) => {
    // ... existing TerminalWidget code
    const [input, setInput] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [data?.history]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        const parts = input.trim().split(' ');
        const cmd = parts[0];
        const args = parts.slice(1);
        onCommand(cmd, args);
        setInput('');
    };

    return (
        <div className="w-full h-full bg-[#1e1e1e] text-green-400 font-mono text-xs p-2 overflow-hidden flex flex-col">
            <div className="flex-grow overflow-y-auto custom-scrollbar p-1">
                {data?.history?.map((line: string, i: number) => (
                    <div key={i} className="whitespace-pre-wrap mb-1">{line}</div>
                ))}
                <div ref={bottomRef} />
            </div>
            <form onSubmit={handleSubmit} className="flex gap-1 border-t border-white/20 pt-2 mt-1">
                <span className="text-blue-400">$</span>
                <input 
                    type="text" 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    className="flex-grow bg-transparent outline-none text-white"
                    autoFocus
                />
            </form>
        </div>
    );
};

// Google Search Widget - Updated to use SimpleMarkdown & onChange sync
export const GoogleSearchWidget: React.FC<any> = ({ data, onSearch, onChange, onExpand }) => {
    const [query, setQuery] = useState(data?.query || '');

    // Sync local state when prop updates (e.g. from expanded view)
    useEffect(() => {
        if (data?.query !== undefined && data?.query !== query) {
            setQuery(data.query);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data?.query]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) onSearch(query);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        if(onChange) onChange({ ...data, query: val });
    }

    return (
        <div className="w-full h-full flex flex-col p-3 relative group">
             {/* Expand Button */}
             {onExpand && (
                <button 
                    onClick={onExpand}
                    className="absolute top-2 right-2 p-1 rounded-full bg-[var(--bg-secondary)] hover:bg-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Expand"
                >
                    <ArrowsPointingOutIcon className="w-4 h-4" />
                </button>
             )}

             <form onSubmit={handleSubmit} className="relative mb-3 flex-shrink-0">
                 <input 
                    type="text" 
                    value={query} 
                    onChange={handleInputChange} 
                    placeholder="Search Google..."
                    className="w-full pl-8 pr-8 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-full text-xs focus:ring-1 focus:ring-[var(--accent)] outline-none"
                 />
                 <GoogleIcon className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2" />
             </form>
             
             <div className="flex-grow overflow-y-auto custom-scrollbar text-xs">
                 {data?.loading ? (
                     <div className="flex justify-center p-4"><Spinner className="w-5 h-5 text-[var(--accent)]" /></div>
                 ) : data?.text ? (
                     <div className="space-y-2">
                         <SimpleMarkdown content={data.text} />
                         {data.sources && data.sources.length > 0 && (
                             <div className="mt-2 pt-2 border-t border-[var(--border-primary)]">
                                 <p className="font-bold mb-1">Sources:</p>
                                 <ul className="list-disc pl-4">
                                     {data.sources.map((s: any, i: number) => (
                                         <li key={i}><a href={s.uri} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline truncate block">{s.title || s.uri}</a></li>
                                     ))}
                                 </ul>
                             </div>
                         )}
                     </div>
                 ) : (
                     <div className="text-center text-[var(--text-secondary)] mt-4">Results will appear here</div>
                 )}
                 {data?.error && <p className="text-[var(--danger)]">{data.error}</p>}
             </div>
        </div>
    );
};

// ChatGPT Widget - Updated to use SimpleMarkdown & Sync State
export const ChatGPTWidget: React.FC<any> = ({ data, onChange, onExpand }) => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>(data?.messages || []);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Sync local state when prop updates
    useEffect(() => {
        if (data?.messages && JSON.stringify(data.messages) !== JSON.stringify(messages)) {
            setMessages(data.messages);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data?.messages]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        const newMessages = [...messages, { role: 'user' as const, text: userMsg }];
        
        setMessages(newMessages);
        setInput('');
        setLoading(true);
        onChange({ messages: newMessages }); // Persist user message

        try {
            const response = await performChat(userMsg, messages);
            const updatedMessages = [...newMessages, { role: 'model' as const, text: response }];
            setMessages(updatedMessages);
            onChange({ messages: updatedMessages }); // Persist AI response
        } catch (error) {
            console.error("Chat error", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full h-full flex flex-col relative group bg-[var(--bg-secondary)] overflow-hidden">
             {/* Header with Expand */}
             <div className="flex justify-between items-center p-2 border-b border-[var(--border-primary)] bg-[var(--bg-primary)]">
                 <div className="flex items-center gap-2 text-xs font-bold uppercase text-[var(--text-secondary)]">
                     <ChatBubbleLeftRightIcon className="w-4 h-4 text-[var(--accent)]" /> ChatGPT
                 </div>
                 {onExpand && (
                    <button 
                        onClick={onExpand}
                        className="p-1 rounded-full hover:bg-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        title="Expand"
                    >
                        <ArrowsPointingOutIcon className="w-3 h-3" />
                    </button>
                 )}
             </div>

             {/* Messages Area */}
             <div ref={scrollRef} className="flex-grow overflow-y-auto p-3 space-y-3 custom-scrollbar text-xs">
                 {messages.length === 0 && (
                     <div className="text-center text-[var(--text-secondary)] opacity-60 mt-4">
                         Start a conversation...
                     </div>
                 )}
                 {messages.map((msg, i) => (
                     <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} message-enter`}>
                         <div className={`max-w-[90%] p-2.5 rounded-2xl shadow-sm ${
                             msg.role === 'user' 
                                 ? 'bg-[var(--accent)] text-white rounded-br-none' 
                                 : 'bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[var(--text-primary)] rounded-bl-none'
                         }`}>
                             <SimpleMarkdown content={msg.text} />
                         </div>
                     </div>
                 ))}
                 {loading && (
                     <div className="flex justify-start message-enter">
                         <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] px-3 py-2 rounded-2xl rounded-bl-none">
                             <div className="flex gap-1">
                                 <div className="w-1.5 h-1.5 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                 <div className="w-1.5 h-1.5 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                 <div className="w-1.5 h-1.5 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                             </div>
                         </div>
                     </div>
                 )}
             </div>

             {/* Input Area */}
             <form onSubmit={handleSubmit} className="p-2 border-t border-[var(--border-primary)] bg-[var(--bg-primary)] flex gap-2">
                 <input 
                     type="text" 
                     value={input}
                     onChange={e => setInput(e.target.value)}
                     placeholder="Type a message..."
                     className="flex-grow bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-2 py-1.5 text-xs outline-none focus:border-[var(--accent)]"
                 />
                 <button 
                    type="submit" 
                    disabled={loading || !input.trim()}
                    className="p-1.5 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                 >
                     <ForwardIcon className="w-3 h-3" />
                 </button>
             </form>
        </div>
    );
};

// Dictionary Widget (unchanged)
export const DictionaryWidget: React.FC<any> = ({ data, onChange }) => {
    // ... existing DictionaryWidget code
    const [word, setWord] = useState('');
    const [result, setResult] = useState<DictionaryResult | null>(data?.result || null);
    const [loading, setLoading] = useState(false);

    const handleLookup = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!word.trim()) return;
        setLoading(true);
        try {
            const res = await lookupDictionary(word);
            setResult(res);
            onChange({ result: res });
        } catch(e) {
            setResult(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full h-full flex flex-col p-3">
            <form onSubmit={handleLookup} className="flex gap-2 mb-2">
                <input 
                    type="text" 
                    value={word} 
                    onChange={e => setWord(e.target.value)} 
                    placeholder="Define..." 
                    className="flex-grow min-w-0 p-1.5 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-xs outline-none"
                />
                <button type="submit" disabled={loading} className="p-1.5 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded hover:bg-[var(--bg-secondary)]">
                    <MagnifyingGlassIcon className="w-4 h-4" />
                </button>
            </form>
            <div className="flex-grow overflow-y-auto custom-scrollbar text-xs">
                {loading ? <Spinner className="w-4 h-4 mx-auto" /> : result ? (
                    <div>
                        <div className="font-bold text-sm mb-1">{result.word} <span className="text-[var(--text-secondary)] font-normal text-xs">{result.phonetic}</span></div>
                        {result.meanings.map((m, i) => (
                            <div key={i} className="mb-2">
                                <div className="italic text-[var(--text-secondary)] mb-0.5">{m.partOfSpeech}</div>
                                <ul className="list-disc pl-4 space-y-1">
                                    {m.definitions.slice(0, 2).map((d, j) => (
                                        <li key={j}>
                                            {d.definition}
                                            {d.example && <div className="text-[var(--text-secondary)] mt-0.5">"{d.example}"</div>}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-[var(--text-secondary)] mt-4">Look up a word</div>
                )}
            </div>
        </div>
    );
};

// Zip Game (Breathing) (unchanged)
export const ZipGameWidget: React.FC = () => {
    // ... existing ZipGameWidget code
    const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
    
    useEffect(() => {
        const inhale = setTimeout(() => setPhase('Hold'), 4000);
        const hold = setTimeout(() => setPhase('Exhale'), 8000); // 4 + 4
        const exhale = setTimeout(() => setPhase('Inhale'), 16000); // 4 + 4 + 8
        
        const loop = setInterval(() => {
            setPhase('Inhale');
            setTimeout(() => setPhase('Hold'), 4000);
            setTimeout(() => setPhase('Exhale'), 8000);
        }, 16000);
        
        return () => {
            clearTimeout(inhale);
            clearTimeout(hold);
            clearTimeout(exhale);
            clearInterval(loop);
        };
    }, []);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20">
            <div className={`
                rounded-full flex items-center justify-center text-xs font-bold text-white transition-all duration-[4000ms]
                ${phase === 'Inhale' ? 'w-24 h-24 bg-blue-400 shadow-lg' : ''}
                ${phase === 'Hold' ? 'w-24 h-24 bg-blue-500 shadow-xl scale-110' : ''}
                ${phase === 'Exhale' ? 'w-12 h-12 bg-blue-300 shadow-sm duration-[8000ms]' : ''}
            `}>
                {phase}
            </div>
            <p className="mt-4 text-xs font-medium text-blue-500">4-7-8 Breathing</p>
        </div>
    );
};

// TicTacToe (unchanged)
export const TicTacToeWidget: React.FC = () => {
    // ... existing TicTacToeWidget code
    const [board, setBoard] = useState(Array(9).fill(null));
    const [xIsNext, setXIsNext] = useState(true);
    const winner = calculateWinner(board);

    function handleClick(i: number) {
        if (winner || board[i]) return;
        const nextBoard = board.slice();
        nextBoard[i] = xIsNext ? 'X' : 'O';
        setBoard(nextBoard);
        setXIsNext(!xIsNext);
    }
    
    function calculateWinner(squares: any[]) {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        for (let i = 0; i < lines.length; i++) {
            const [a, b, c] = lines[i];
            if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
                return squares[a];
            }
        }
        return null;
    }

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-2">
            <div className="grid grid-cols-3 gap-1 w-full max-w-[150px] aspect-square">
                {board.map((val, i) => (
                    <button 
                        key={i} 
                        onClick={() => handleClick(i)}
                        className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded flex items-center justify-center text-xl font-bold hover:bg-[var(--bg-secondary)]"
                    >
                        <span className={val === 'X' ? 'text-[var(--accent)]' : 'text-[var(--success)]'}>{val}</span>
                    </button>
                ))}
            </div>
            <div className="mt-2 text-xs font-bold">
                {winner ? (
                    <span className="text-[var(--success)]">Winner: {winner}</span>
                ) : board.every(Boolean) ? (
                    <span className="text-[var(--text-secondary)]">Draw</span>
                ) : (
                    <span>Next: {xIsNext ? 'X' : 'O'}</span>
                )}
                {(winner || board.every(Boolean)) && (
                    <button onClick={() => setBoard(Array(9).fill(null))} className="ml-2 text-[var(--accent)] hover:underline">Reset</button>
                )}
            </div>
        </div>
    );
};

// Snake Game (unchanged)
export const SnakeGameWidget: React.FC = () => {
    // ... existing SnakeGameWidget code
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);

    // Game state refs to avoid closure staleness in loop
    const snake = useRef([{x: 5, y: 5}]);
    const food = useRef({x: 10, y: 10});
    const dir = useRef({x: 1, y: 0});
    const nextDir = useRef({x: 1, y: 0}); // Buffer for rapid key presses
    
    const gridSize = 15;
    const tileCount = 15; // 225x225 canvas assumed roughly

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const handleKey = (e: KeyboardEvent) => {
            switch(e.key) {
                case 'ArrowUp': if (dir.current.y === 0) nextDir.current = {x: 0, y: -1}; break;
                case 'ArrowDown': if (dir.current.y === 0) nextDir.current = {x: 0, y: 1}; break;
                case 'ArrowLeft': if (dir.current.x === 0) nextDir.current = {x: -1, y: 0}; break;
                case 'ArrowRight': if (dir.current.x === 0) nextDir.current = {x: 1, y: 0}; break;
            }
        };
        window.addEventListener('keydown', handleKey);

        const loop = setInterval(() => {
            if (gameOver) return;

            dir.current = nextDir.current;
            const head = { x: snake.current[0].x + dir.current.x, y: snake.current[0].y + dir.current.y };

            // Wall collision
            if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
                setGameOver(true);
                return;
            }
            // Self collision
            if (snake.current.some(s => s.x === head.x && s.y === head.y)) {
                setGameOver(true);
                return;
            }

            snake.current.unshift(head);

            if (head.x === food.current.x && head.y === food.current.y) {
                setScore(s => s + 1);
                food.current = {
                    x: Math.floor(Math.random() * tileCount),
                    y: Math.floor(Math.random() * tileCount)
                };
            } else {
                snake.current.pop();
            }

            // Draw
            ctx.fillStyle = '#222';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#4ade80'; // Green snake
            snake.current.forEach(s => ctx.fillRect(s.x * gridSize, s.y * gridSize, gridSize - 2, gridSize - 2));

            ctx.fillStyle = '#ef4444'; // Red food
            ctx.fillRect(food.current.x * gridSize, food.current.y * gridSize, gridSize - 2, gridSize - 2);

        }, 150);

        return () => {
            clearInterval(loop);
            window.removeEventListener('keydown', handleKey);
        };
    }, [gameOver]);

    const reset = () => {
        snake.current = [{x: 5, y: 5}];
        dir.current = {x: 1, y: 0};
        nextDir.current = {x: 1, y: 0};
        setScore(0);
        setGameOver(false);
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-black p-2 rounded relative">
             <div className="flex justify-between w-full text-xs text-white mb-1 px-1">
                 <span>Snake</span>
                 <span>Score: {score}</span>
             </div>
             <canvas ref={canvasRef} width={225} height={225} className="bg-[#222] border border-gray-700 w-full aspect-square" />
             {gameOver && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
                     <p className="text-red-500 font-bold mb-2">Game Over</p>
                     <button onClick={reset} className="px-3 py-1 bg-white text-black text-xs font-bold rounded hover:bg-gray-200">Restart</button>
                 </div>
             )}
        </div>
    );
};
