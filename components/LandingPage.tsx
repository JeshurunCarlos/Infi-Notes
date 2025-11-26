
import React, { useState, useEffect, useRef } from 'react';
import { InfinityIcon, GoogleIcon, SparklesIcon, LightBulbIcon, TimerIcon, ThemeIcon, PencilIcon, DocumentTextIcon } from './Icons';
import LandingPageBackground from './LandingPageBackground';

interface LandingPageProps {
  onLogin: () => void;
  onOpenJournal: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onOpenJournal }) => {
    const [theme, setTheme] = useState<'light' | 'matrix' | 'monokai' | 'pitch-black' | 'frosty'>('light');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        document.documentElement.className = theme;
        return () => {
            document.documentElement.className = '';
        }
    }, [theme]);

    const cycleTheme = () => {
        const themes: ('light' | 'matrix' | 'monokai' | 'pitch-black' | 'frosty')[] = ['light', 'frosty', 'matrix', 'monokai', 'pitch-black'];
        const currentIndex = themes.indexOf(theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        setTheme(themes[nextIndex]);
    };

    return (
        <div ref={scrollRef} className="h-screen w-full text-[var(--text-primary)] relative bg-[var(--bg-primary)] transition-colors duration-500 selection:bg-[var(--accent)] selection:text-white overflow-y-auto custom-scrollbar">
            
            {/* Scroll-Synced Background Animation */}
            <LandingPageBackground scrollContainerRef={scrollRef} />

            {/* Background Gradients - Fixed so they don't scroll with content */}
            <div className="fixed inset-0 animated-landing-gradient opacity-30 pointer-events-none"></div>
            <div className="fixed top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[var(--accent)]/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }}></div>
            <div className="fixed bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-[var(--success)]/10 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDuration: '10s' }}></div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col min-h-full">
                {/* Navbar */}
                <header className="py-6 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="relative group cursor-default">
                            {/* Enhanced Logo Container */}
                            <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)] to-[var(--success)] rounded-xl blur-md opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>
                            <div className="relative p-3 bg-gradient-to-br from-[var(--accent)] to-[var(--success)] rounded-xl shadow-xl text-white transform group-hover:scale-105 transition-transform duration-300">
                                <InfinityIcon className="w-12 h-12" strokeColor="white" />
                            </div>
                        </div>
                        <span className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)]">Infi-Notes</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={onOpenJournal} 
                            className="hidden sm:flex items-center gap-2 px-4 py-2 font-semibold text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-full transition-all btn-press border border-transparent hover:border-[var(--border-primary)]"
                        >
                            <PencilIcon className="w-4 h-4" />
                            <span>Journal</span>
                        </button>
                        <button 
                            onClick={onLogin} 
                            className="px-5 py-2 font-semibold text-sm bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-full hover:opacity-90 transition-all btn-press shadow-md"
                        >
                            Sign In
                        </button>
                        <button
                            onClick={cycleTheme}
                            className="p-2 rounded-full bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--border-primary)] transition-all btn-press ml-2"
                            title="Change Theme"
                        >
                            <ThemeIcon className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                {/* Hero Section */}
                <main className="flex-grow flex flex-col items-center justify-center text-center py-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-xs font-semibold uppercase tracking-wider mb-8 animate-[fadeIn_1s_ease-out]">
                        <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse"></span>
                        <span>v2.0 Now Available</span>
                    </div>
                    
                    <h1 className="font-journal text-6xl md:text-8xl font-bold tracking-tight mb-6 leading-tight animate-[popIn_0.8s_cubic-bezier(0.16,1,0.3,1)]">
                        Focus. Watch. <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-[var(--success)]">Create.</span>
                    </h1>
                    
                    <p className="max-w-2xl mx-auto text-lg md:text-xl text-[var(--text-secondary)] mb-10 leading-relaxed animate-[fadeIn_1s_ease-out_0.2s_both]">
                        The all-in-one workspace for your second brain. Capture infinite ideas, watch content, and test your knowledge with AI-powered active recall.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-4 animate-[fadeIn_1s_ease-out_0.4s_both]">
                        <button 
                            onClick={onLogin} 
                            className="flex items-center gap-3 px-8 py-4 bg-[var(--accent)] text-white rounded-full font-bold text-lg shadow-lg shadow-[var(--accent)]/30 hover:scale-105 transition-transform btn-press"
                        >
                            <GoogleIcon className="w-5 h-5" />
                            <span>Start for Free</span>
                        </button>
                        <button 
                            onClick={onOpenJournal} 
                            className="flex items-center gap-3 px-8 py-4 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)] rounded-full font-bold text-lg hover:bg-[var(--border-primary)] transition-all btn-press"
                        >
                            <SparklesIcon className="w-5 h-5" />
                            <span>Try Journal</span>
                        </button>
                    </div>
                </main>

                {/* Bento Grid Features */}
                <section className="py-20 animate-[fadeIn_1s_ease-out_0.6s_both]">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(180px,auto)]">
                        
                        {/* Card 1: AI Summary - Large */}
                        <div className="md:col-span-2 bg-[var(--bg-secondary)]/60 backdrop-blur-md border border-[var(--border-primary)] rounded-3xl p-8 relative overflow-hidden group hover:border-[var(--accent)] transition-colors">
                            <div className="relative z-10">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white mb-4 shadow-lg">
                                    <SparklesIcon className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">AI Summaries</h3>
                                <p className="text-[var(--text-secondary)] max-w-md">Instantly condense long articles and notes into highlighted, actionable summaries.</p>
                            </div>
                            <div className="absolute right-[-20px] top-[20px] w-[200px] h-[200px] opacity-10 group-hover:opacity-20 transition-opacity rotate-12">
                                <DocumentTextIcon className="w-full h-full" />
                            </div>
                        </div>

                        {/* Card 2: Active Recall */}
                        <div className="bg-[var(--bg-secondary)]/60 backdrop-blur-md border border-[var(--border-primary)] rounded-3xl p-8 relative overflow-hidden group hover:border-[var(--success)] transition-colors">
                            <div className="relative z-10">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white mb-4 shadow-lg">
                                    <LightBulbIcon className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">Active Recall</h3>
                                <p className="text-[var(--text-secondary)]">Auto-generated quizzes to reinforce your memory.</p>
                            </div>
                        </div>

                        {/* Card 3: Widgets */}
                        <div className="bg-[var(--bg-secondary)]/60 backdrop-blur-md border border-[var(--border-primary)] rounded-3xl p-8 relative overflow-hidden group hover:border-[var(--warning)] transition-colors">
                            <div className="relative z-10">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white mb-4 shadow-lg">
                                    <TimerIcon className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">Focus Tools</h3>
                                <p className="text-[var(--text-secondary)]">Pomodoro, Music, and Games to keep you in flow.</p>
                            </div>
                        </div>

                        {/* Card 4: Journal - Wide */}
                        <div className="md:col-span-2 bg-[var(--bg-secondary)]/60 backdrop-blur-md border border-[var(--border-primary)] rounded-3xl p-8 relative overflow-hidden group hover:border-purple-500 transition-colors flex flex-col md:flex-row items-start md:items-center gap-6">
                            <div className="flex-grow z-10">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center text-white mb-4 shadow-lg">
                                    <PencilIcon className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">Zen Journal</h3>
                                <p className="text-[var(--text-secondary)]">Reflect on your day with an empathetic AI companion that guides your thoughts.</p>
                            </div>
                            <button onClick={onOpenJournal} className="px-6 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] font-bold text-sm hover:scale-105 transition-transform z-10 shadow-sm">
                                Open Journal
                            </button>
                            {/* Decorative blob */}
                            <div className="absolute bottom-[-50px] right-[-50px] w-40 h-40 bg-purple-500/20 rounded-full blur-3xl group-hover:bg-purple-500/30 transition-colors"></div>
                        </div>

                    </div>
                </section>

                <footer className="py-8 text-center text-[var(--text-secondary)] text-sm border-t border-[var(--border-primary)]">
                    <p>&copy; {new Date().getFullYear()} Infi-Notes. Crafted for infinite ideas.</p>
                </footer>
            </div>
        </div>
    );
};

export default LandingPage;