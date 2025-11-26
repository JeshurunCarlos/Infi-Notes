
import React, { useState, useRef, useEffect } from 'react';
import { User, Theme } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, SparklesIcon, LogoutIcon, ThemeIcon, LightBulbIcon } from './Icons';
import { chatWithJournal } from '../lib/ai';
import Spinner from './Spinner';

interface JournalPageProps {
    user: User;
    onBack: () => void;
    onLogout: () => void;
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

const JournalPage: React.FC<JournalPageProps> = ({ user, onBack, onLogout, theme, setTheme }) => {
    const [entry, setEntry] = useState('');
    const [showChat, setShowChat] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [date, setDate] = useState(new Date());
    const scrollRef = useRef<HTMLDivElement>(null);
    
    // New Features State
    const [mood, setMood] = useState<string | null>(null);
    const [gratitude, setGratitude] = useState('');
    
    // Theme State
    const [showThemeMenu, setShowThemeMenu] = useState(false);
    const themeMenuRef = useRef<HTMLDivElement>(null);

    const moods = [
        'Stressed',
        'Sad',
        'Neutral',
        'Calm',
        'Happy',
        'Energetic',
    ];

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatHistory, showChat, isAiThinking]);
    
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

    const sendMessage = async (message: string) => {
        const newHistory = [...chatHistory, { role: 'user' as const, text: message }];
        setChatHistory(newHistory);
        setChatInput('');
        setIsAiThinking(true);

        // Combine entry, mood, and gratitude for context
        const fullContext = `
        Journal Entry: ${entry}
        Mood: ${mood || 'Not specified'}
        Gratitude: ${gratitude}
        `;

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
        <div className="min-h-screen w-full bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans transition-colors duration-500 ease-in-out flex flex-col relative overflow-hidden selection:bg-[var(--accent)] selection:text-white">
            
            {/* Decorative Background Elements - Subtle and static */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[var(--accent)]/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[var(--success)]/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Header */}
            <header className="relative z-20 px-6 py-6 flex justify-between items-center max-w-7xl mx-auto w-full">
                <button 
                    onClick={onBack} 
                    className="group flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                    <div className="p-2 rounded-full bg-[var(--bg-secondary)]/50 border border-[var(--border-primary)] group-hover:border-[var(--accent)] transition-colors">
                        <ChevronLeftIcon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium hidden sm:block">Back</span>
                </button>

                {/* Central Date Display */}
                <div className="flex flex-col items-center">
                    <div className="flex items-center gap-6">
                        <button onClick={() => handleDateChange(-1)} className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors p-2"><ChevronLeftIcon className="w-5 h-5" /></button>
                        <div className="text-center">
                            <h2 className="font-journal text-3xl font-bold text-[var(--text-primary)] tracking-tight">
                                {date.toLocaleDateString('en-US', { weekday: 'long' })}
                            </h2>
                            <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mt-1">
                                {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                        </div>
                        <button onClick={() => handleDateChange(1)} className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors p-2"><ChevronRightIcon className="w-5 h-5" /></button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Theme Switcher */}
                    <div className="relative" ref={themeMenuRef}>
                        <button 
                            onClick={() => setShowThemeMenu(prev => !prev)} 
                            className="p-2 rounded-full bg-[var(--bg-secondary)]/50 border border-[var(--border-primary)] hover:border-[var(--accent)] transition-all text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            title="Change Theme"
                        >
                            <ThemeIcon className="w-5 h-5" />
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

                    <button 
                        onClick={onLogout} 
                        className="p-2 rounded-full bg-[var(--bg-secondary)]/50 border border-[var(--border-primary)] hover:border-[var(--danger)] text-[var(--text-secondary)] hover:text-[var(--danger)] transition-all" 
                        title="Sign Out"
                    >
                        <LogoutIcon className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Main Workspace */}
            <main className="flex-grow w-full max-w-5xl mx-auto px-4 pb-8 flex gap-6 relative z-10 h-[calc(100vh-120px)]">
                
                {/* Editor Section */}
                <div className={`flex-grow flex flex-col transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${showChat ? 'mr-[400px]' : ''}`}>
                    <div className="flex-grow bg-[var(--bg-secondary)]/40 backdrop-blur-xl rounded-[2rem] border border-[var(--border-primary)] shadow-2xl flex flex-col overflow-hidden relative transition-all">
                        
                        <div className="flex-grow overflow-y-auto custom-scrollbar p-8 md:p-12">
                            
                            {/* Mood Selector - Text Pill Row */}
                            <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-2 no-scrollbar">
                                <span className="text-xs font-bold uppercase text-[var(--text-secondary)] whitespace-nowrap mr-2">Current Mood</span>
                                {moods.map(mLabel => (
                                    <button 
                                        key={mLabel}
                                        onClick={() => setMood(mLabel)}
                                        className={`group px-4 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm whitespace-nowrap
                                            ${mood === mLabel 
                                                ? 'bg-[var(--accent)] border-[var(--accent)] text-white shadow-md scale-105' 
                                                : 'bg-[var(--bg-primary)] border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                                            }`}
                                    >
                                        {mLabel}
                                    </button>
                                ))}
                            </div>

                            {/* Title Input */}
                            <input 
                                type="text" 
                                placeholder="Title your day..." 
                                className="w-full bg-transparent border-none outline-none text-4xl md:text-5xl font-journal font-bold text-[var(--text-primary)] placeholder-[var(--text-secondary)]/30 mb-6"
                            />

                            {/* Text Editor */}
                            <textarea 
                                value={entry}
                                onChange={(e) => setEntry(e.target.value)}
                                placeholder="What's on your mind?" 
                                className="w-full bg-transparent border-none outline-none text-xl md:text-2xl leading-loose font-journal text-[var(--text-primary)] placeholder-[var(--text-secondary)]/30 resize-none min-h-[400px]"
                            />

                            {/* Gratitude Card */}
                            <div className="mt-16">
                                <div className="bg-gradient-to-br from-[var(--bg-primary)]/80 to-[var(--bg-primary)]/40 rounded-2xl p-6 border border-[var(--border-primary)] shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="p-1.5 rounded-md bg-[var(--accent)]/10 text-[var(--accent)]">
                                            <SparklesIcon className="w-4 h-4" />
                                        </div>
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">Daily Gratitude</h3>
                                    </div>
                                    <textarea 
                                        value={gratitude}
                                        onChange={(e) => setGratitude(e.target.value)}
                                        placeholder="I am grateful for..."
                                        className="w-full bg-transparent border-none outline-none text-lg font-journal text-[var(--text-primary)] placeholder-[var(--text-secondary)]/40 resize-none h-24 leading-relaxed"
                                    />
                                </div>
                            </div>

                            <div className="h-20" />
                        </div>

                        {/* Floating Chat Trigger */}
                        <div className="absolute bottom-8 right-8 z-20">
                            <button 
                                onClick={() => setShowChat(!showChat)}
                                className={`flex items-center gap-3 pl-4 pr-2 py-2 rounded-full shadow-xl border transition-all hover:scale-105 active:scale-95
                                    ${showChat 
                                        ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-primary)]' 
                                        : 'bg-[var(--accent)] text-white border-transparent'
                                    }`}
                            >
                                <span className="text-sm font-bold">{showChat ? 'Close Companion' : 'AI Companion'}</span>
                                <div className={`p-2 rounded-full ${showChat ? 'bg-[var(--bg-secondary)]' : 'bg-white/20'}`}>
                                    <SparklesIcon className="w-4 h-4" />
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar - Chat */}
                <div className={`fixed top-[100px] right-4 md:right-8 bottom-8 w-[380px] z-30 pointer-events-none transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${showChat ? 'translate-x-0' : 'translate-x-[120%]'}`}>
                    <div className="w-full h-full flex flex-col bg-[var(--bg-secondary)]/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-[var(--border-primary)] overflow-hidden pointer-events-auto">
                        {/* Header */}
                        <div className="p-5 border-b border-[var(--border-primary)] flex justify-between items-center bg-[var(--bg-primary)]/50">
                            <div>
                                <h3 className="font-bold text-[var(--text-primary)] text-lg">Companion</h3>
                                <p className="text-xs text-[var(--text-secondary)]">AI-Powered Reflection</p>
                            </div>
                            <button onClick={handleGetPrompt} className="text-xs font-bold text-[var(--accent)] hover:bg-[var(--accent)]/10 px-3 py-1.5 rounded-full transition-colors border border-[var(--accent)]/20">
                                Get Prompt
                            </button>
                        </div>

                        {/* Chat History */}
                        <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[var(--bg-primary)]/30">
                            {chatHistory.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-[var(--text-secondary)] opacity-60 text-center p-6">
                                    <LightBulbIcon className="w-12 h-12 mb-3 stroke-1" />
                                    <p className="text-sm">I'm here to help you process your thoughts. Start writing or ask me anything.</p>
                                </div>
                            )}
                            {chatHistory.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                        msg.role === 'user' 
                                            ? 'bg-[var(--accent)] text-white rounded-br-sm' 
                                            : 'bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-primary)] rounded-bl-sm'
                                    }`}>
                                        {msg.text}
                                    </div>
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

                        {/* Input Area */}
                        <div className="p-4 bg-[var(--bg-primary)]/80 border-t border-[var(--border-primary)]">
                            <form onSubmit={handleChatSubmit} className="relative">
                                <input 
                                    type="text" 
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Type a message..." 
                                    className="w-full pl-4 pr-12 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 shadow-inner transition-all"
                                />
                                <button 
                                    type="submit" 
                                    disabled={!chatInput.trim() || isAiThinking}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                                >
                                    <ChevronRightIcon className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default JournalPage;