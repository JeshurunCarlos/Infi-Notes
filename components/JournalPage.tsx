
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { User, Theme } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, SparklesIcon, LogoutIcon, SwatchIcon, LightBulbIcon, CheckIcon, HomeIcon } from './Icons';
import { chatWithJournal } from '../lib/ai';
import Spinner from './Spinner';

interface JournalPageProps {
    user: User;
    onBack: () => void;
    onLogout: () => void;
    theme: Theme;
    setTheme: (theme: Theme) => void;
    onGoHome?: () => void;
}

interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

const ClassicDrawings = [
    (props: any) => (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
            <path d="M50 20 C30 35, 10 50, 50 80 C90 50, 70 35, 50 20 Z" strokeOpacity="0.8" />
            <circle cx="50" cy="45" r="12" strokeOpacity="0.6" />
            <circle cx="50" cy="45" r="4" fill="currentColor" fillOpacity="0.2"/>
            <path d="M50 15 L50 5 M50 95 L50 85 M10 50 L20 50 M90 50 L80 50" strokeOpacity="0.4" />
        </svg>
    ),
    (props: any) => (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
            <circle cx="50" cy="50" r="40" strokeOpacity="0.3" />
            <path d="M50 10 L50 90 M10 50 L90 50" strokeOpacity="0.2" />
            <path d="M50 10 L60 40 L90 50 L60 60 L50 90 L40 60 L10 50 L40 40 Z" strokeOpacity="0.6" />
        </svg>
    ),
];

const JournalPage: React.FC<JournalPageProps> = ({ user, onBack, onLogout, theme, setTheme, onGoHome }) => {
    const [entry, setEntry] = useState('');
    const [showChat, setShowChat] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [date, setDate] = useState(new Date());
    const scrollRef = useRef<HTMLDivElement>(null);
    const [mood, setMood] = useState<string | null>(null);
    const [gratitude, setGratitude] = useState('');
    const [showThemeMenu, setShowThemeMenu] = useState(false);
    const themeMenuRef = useRef<HTMLDivElement>(null);
    const [allEntries, setAllEntries] = useState<Record<string, string>>({});
    const dateKey = date.toLocaleDateString('en-CA'); 

    useEffect(() => {
        if (user?.id) {
            const savedData = localStorage.getItem(`journal_entries_${user.id}`);
            if (savedData) {
                try {
                    setAllEntries(JSON.parse(savedData));
                } catch (e) {
                    console.error("Failed to parse journal entries", e);
                }
            }
        }
    }, [user?.id]);

    useEffect(() => {
        setEntry(allEntries[dateKey] || '');
    }, [dateKey, allEntries]);

    const handleEntryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setEntry(val);
        const updatedEntries = { ...allEntries, [dateKey]: val };
        setAllEntries(updatedEntries);
        if (user?.id) localStorage.setItem(`journal_entries_${user.id}`, JSON.stringify(updatedEntries));
    };

    const moods = [
        { label: 'Stressed', themeKey: 'danger' },
        { label: 'Sad', themeKey: 'accent' },
        { label: 'Neutral', themeKey: 'text-secondary' },
        { label: 'Calm', themeKey: 'success' },
        { label: 'Happy', themeKey: 'warning' },
        { label: 'Energetic', themeKey: 'accent' },
    ];

    const SelectedDrawing = useMemo(() => {
        const dateString = date.toLocaleDateString();
        let hash = 0;
        for (let i = 0; i < dateString.length; i++) hash = dateString.charCodeAt(i) + ((hash << 5) - hash);
        const index = Math.abs(hash) % ClassicDrawings.length;
        return ClassicDrawings[index];
    }, [date]);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [chatHistory, showChat, isAiThinking]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) setShowThemeMenu(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const sendMessage = async (message: string) => {
        const newHistory = [...chatHistory, { role: 'user' as const, text: message }];
        setChatHistory(newHistory);
        setChatInput('');
        setIsAiThinking(true);
        const fullContext = `Journal Entry: ${entry}\nMood: ${mood || 'Not specified'}\nGratitude: ${gratitude}`;
        try {
            const response = await chatWithJournal(fullContext, message, chatHistory);
            setChatHistory([...newHistory, { role: 'model' as const, text: response }]);
        } catch (error) {
            console.error("Chat error", error);
        } finally {
            setIsAiThinking(false);
        }
    };

    const handleChatSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim()) return;
        sendMessage(chatInput.trim());
    };

    const handleGetPrompt = () => {
        if (isAiThinking) return;
        sendMessage("Give me a thought-provoking question to guide my journaling.");
    };
    
    const handleDateChange = (days: number) => {
        const newDate = new Date(date);
        newDate.setDate(date.getDate() + days);
        setDate(newDate);
    };

    return (
        <div className="h-screen w-full bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-500 ease-in-out flex flex-col relative overflow-hidden selection:bg-[var(--accent)] selection:text-white">
            <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[var(--accent)]/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[var(--success)]/5 rounded-full blur-[120px]" />
            </div>

            <header className="flex-none relative z-20 px-6 py-4 flex justify-between items-center max-w-7xl mx-auto w-full border-b border-[var(--border-primary)]/50 bg-[var(--bg-primary)]/50 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <button onClick={onBack} className="group flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                        <div className="p-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] group-hover:border-[var(--accent)] transition-colors">
                            <ChevronLeftIcon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium hidden sm:block">Back</span>
                    </button>
                    {onGoHome && (
                        <button onClick={onGoHome} className="p-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--accent)] transition-all text-[var(--accent)] ml-2" title="Home">
                            <HomeIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={() => handleDateChange(-1)} className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors p-1 rounded-full hover:bg-[var(--bg-secondary)]"><ChevronLeftIcon className="w-5 h-5" /></button>
                    <div className="text-center min-w-[180px]">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>{date.toLocaleDateString('en-US', { weekday: 'long' })}</h2>
                        <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] opacity-80">{date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                    <button onClick={() => handleDateChange(1)} className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors p-1 rounded-full hover:bg-[var(--bg-secondary)]"><ChevronRightIcon className="w-5 h-5" /></button>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative" ref={themeMenuRef}>
                        <button onClick={() => setShowThemeMenu(prev => !prev)} className="p-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--accent)] transition-all text-[var(--text-secondary)] hover:text-[var(--text-primary)]" title="Change Theme">
                            <SwatchIcon className="w-5 h-5" />
                        </button>
                        {showThemeMenu && (
                            <div className="absolute top-full right-0 mt-2 z-50 bg-[var(--bg-secondary)] rounded-xl shadow-2xl border border-[var(--border-primary)] animated-popover p-2 flex flex-col gap-1 min-w-[150px]">
                                {['light', 'matrix', 'monokai', 'pitch-black', 'frosty', 'cyberpunk', 'paper'].map((t) => (
                                    <button 
                                        key={t} 
                                        onClick={() => { setTheme(t as Theme); setShowThemeMenu(false); }}
                                        className="px-3 py-2 text-left text-sm font-bold capitalize hover:bg-[var(--bg-primary)] rounded-lg transition-colors flex items-center justify-between text-[var(--text-primary)]"
                                    >
                                        {t}
                                        {theme === t && <CheckIcon className="w-3 h-3 text-[var(--accent)]" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button onClick={onLogout} className="p-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--danger)] text-[var(--text-secondary)] hover:text-[var(--danger)] transition-all" title="Sign Out">
                        <LogoutIcon className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-4 flex gap-6 relative z-10 min-h-0">
                <div className={`flex-1 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${showChat ? 'mr-[380px] hidden md:flex' : ''}`}>
                    <div className="flex-1 bg-[var(--bg-secondary)]/30 backdrop-blur-xl rounded-[2rem] border border-[var(--border-primary)] shadow-2xl flex flex-col overflow-hidden relative transition-all">
                        <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center opacity-[0.03]">
                             <div className="w-[60%] h-[60%] text-[var(--text-primary)] rotate-6"><SelectedDrawing className="w-full h-full" /></div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 relative z-10 flex flex-col">
                            <div className="flex flex-wrap items-center gap-2 mb-8 animate-[fadeIn_0.5s_ease-out]">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] mr-2">I'm feeling</span>
                                {moods.map((m) => (
                                    <button 
                                        key={m.label} 
                                        onClick={() => setMood(m.label)}
                                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border
                                            ${mood === m.label 
                                                ? `bg-[var(--accent)] text-white ring-2 ring-offset-1 ring-offset-[var(--bg-secondary)] border-transparent shadow-sm scale-105` 
                                                : 'bg-[var(--bg-primary)] border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--accent)]'
                                            }`}
                                    >
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                            <input 
                                type="text" 
                                placeholder="Title your day..." 
                                className="w-full bg-transparent border-none outline-none text-3xl md:text-4xl font-bold text-[var(--text-primary)] placeholder-[var(--text-secondary)]/30 mb-6"
                                style={{ fontFamily: 'var(--font-heading)' }}
                            />
                            <textarea 
                                value={entry} 
                                onChange={handleEntryChange} 
                                placeholder="Start writing..." 
                                className="w-full bg-transparent border-none outline-none text-lg md:text-xl leading-relaxed text-[var(--text-primary)] placeholder-[var(--text-secondary)]/30 resize-none flex-grow min-h-[300px]" 
                                style={{ fontFamily: 'var(--font-body)' }}
                            />
                            <div className="mt-8 pt-8 border-t border-[var(--border-primary)]/50">
                                <div className="flex items-center gap-2 mb-3">
                                    <SparklesIcon className="w-4 h-4 text-[var(--accent)]" />
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">Daily Gratitude</h3>
                                </div>
                                <div className="bg-[var(--bg-primary)]/50 rounded-xl p-4 border border-[var(--border-primary)] focus-within:border-[var(--accent)] transition-all">
                                    <textarea 
                                        value={gratitude} 
                                        onChange={(e) => setGratitude(e.target.value)} 
                                        placeholder="I am grateful for..." 
                                        className="w-full bg-transparent border-none outline-none text-base text-[var(--text-primary)] placeholder-[var(--text-secondary)]/40 resize-none h-16 leading-relaxed p-0" 
                                        style={{ fontFamily: 'var(--font-body)' }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="absolute bottom-6 right-6 z-20">
                            <button onClick={() => setShowChat(!showChat)} className={`flex items-center gap-3 pl-4 pr-2 py-2 rounded-full shadow-lg border transition-all hover:scale-105 ${showChat ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-primary)]' : 'bg-[var(--accent)] text-white border-transparent'}`}>
                                <span className="text-sm font-bold">{showChat ? 'Close AI' : 'AI Companion'}</span>
                                <div className={`p-2 rounded-full ${showChat ? 'bg-[var(--bg-secondary)]' : 'bg-white/20'}`}><SparklesIcon className="w-4 h-4" /></div>
                            </button>
                        </div>
                    </div>
                </div>

                <div className={`fixed top-[85px] right-6 bottom-6 w-[360px] z-30 pointer-events-none transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${showChat ? 'translate-x-0' : 'translate-x-[120%]'}`}>
                    <div className="w-full h-full flex flex-col bg-[var(--bg-secondary)]/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-[var(--border-primary)] overflow-hidden pointer-events-auto">
                        <div className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center bg-[var(--bg-primary)]/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[var(--accent)]/10 rounded-lg text-[var(--accent)]"><LightBulbIcon className="w-5 h-5" /></div>
                                <div>
                                    <h3 className="font-bold text-[var(--text-primary)] text-sm">Reflection AI</h3>
                                    <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wide">Journal Companion</p>
                                </div>
                            </div>
                            <button onClick={handleGetPrompt} className="text-[10px] font-bold text-[var(--accent)] hover:bg-[var(--accent)]/10 px-3 py-1.5 rounded-full transition-colors border border-[var(--border-primary)]">Get Prompt</button>
                        </div>
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[var(--bg-primary)]/30">
                            {chatHistory.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-[var(--text-secondary)] opacity-60 text-center p-6 gap-4">
                                    <div className="w-16 h-16 rounded-full bg-[var(--bg-primary)] flex items-center justify-center border border-[var(--border-primary)]"><SparklesIcon className="w-8 h-8 text-[var(--accent)]" /></div>
                                    <p className="text-sm">I'm here to help you process your thoughts. Start writing or ask me anything.</p>
                                </div>
                            )}
                            {chatHistory.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-[messageSlideUp_0.3s_ease-out]`}>
                                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-[var(--accent)] text-white rounded-br-sm' : 'bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-primary)] rounded-bl-sm'}`}>{msg.text}</div>
                                </div>
                            ))}
                            {isAiThinking && (
                                <div className="flex justify-start">
                                    <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm flex gap-1">
                                        <div className="w-1.5 h-1.5 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-1.5 h-1.5 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-1.5 h-1.5 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-3 bg-[var(--bg-primary)]/80 border-t border-[var(--border-primary)]">
                            <form onSubmit={handleChatSubmit} className="relative">
                                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type a message..." className="w-full pl-4 pr-10 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl focus:ring-2 focus:ring-[var(--accent)] outline-none text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 shadow-inner transition-all" />
                                <button type="submit" disabled={!chatInput.trim() || isAiThinking} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all shadow-sm"><ChevronRightIcon className="w-4 h-4" /></button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default JournalPage;
