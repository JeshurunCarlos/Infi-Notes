
import React, { useEffect, useState } from 'react';
import { InfinityIcon, SparklesIcon } from './Icons';
import { Theme } from '../types';

interface LoadingScreenProps {
    theme?: Theme;
}

const DEFAULT_QUOTES = [
    "The mind is everything. What you think you become.",
    "Act as if what you do makes a difference. It does.",
    "Simplicity is the ultimate sophistication.",
    "Quiet the mind, and the soul will speak."
];

const THEME_QUOTES: Record<string, string[]> = {
    'matrix': [
        "Everything that has a beginning has an end.",
        "There is no spoon.",
        "I'm trying to free your mind, Neo.",
        "Follow the white rabbit."
    ],
    'cyberpunk': [
        "Wake up, Samurai. We have a city to burn.",
        "High tech, low life.",
        "Chrome don't get you home.",
        "The future is already here."
    ],
    'monokai': [
        "Code is like humor. When you have to explain it, it’s bad.",
        "First, solve the problem. Then, write the code.",
        "Simplicity is the soul of efficiency.",
        "Compiling your thoughts..."
    ],
    'paper': [
        "Ink is the soul of the paper.",
        "The pen is mightier than the sword.",
        "Every secret of a writer's soul is written in their words.",
        "Sharpening the mind."
    ],
    'pitch-black': [
        "In the void, there is focus.",
        "Darkness is the absence of distraction.",
        "Embrace the silence.",
        "Steady the soul."
    ],
    'frosty': [
        "Clear as ice, sharp as winter.",
        "Cool heads prevail.",
        "Breath of fresh air.",
        "Crystallizing your workspace."
    ]
};

const THEME_PHRASES: Record<string, string[]> = {
    'matrix': ["System breach detected...", "Overriding reality...", "Decoding stream...", "Accessing the Source..."],
    'cyberpunk': ["Interfacing with the Net...", "Booting cyber-neural link...", "Syncing chrome...", "Accessing data havens..."],
    'monokai': ["Compiling assets...", "Garbage collection active...", "Linting workspace...", "Linking binaries..."],
    'paper': ["Unfolding parchment...", "Refilling ink reservoir...", "Stitching binding...", "Sharpening pencils..."],
    'pitch-black': ["Stabilizing void...", "Dark matter alignment...", "Reaching absolute zero...", "Silencing background noise..."],
    'frosty': ["Glacier sync...", "Freezing frame...", "Crystallizing UI...", "Thawing assets..."],
    'light': ["Initializing Workspace...", "Loading Assets...", "Connecting to AI...", "Preparing your Second Brain..."]
};

const LoadingScreen: React.FC<LoadingScreenProps> = ({ theme = 'light' }) => {
    const [quote, setQuote] = useState("");
    const [loadingText, setLoadingText] = useState("");

    useEffect(() => {
        const quoteList = THEME_QUOTES[theme] || DEFAULT_QUOTES;
        const randomQuote = quoteList[Math.floor(Math.random() * quoteList.length)];
        setQuote(randomQuote);
        
        const phraseList = THEME_PHRASES[theme] || THEME_PHRASES['light'];
        setLoadingText(phraseList[0]);

        let index = 0;
        const interval = setInterval(() => {
            index = (index + 1) % phraseList.length;
            setLoadingText(phraseList[index]);
        }, 800);
        return () => clearInterval(interval);
    }, [theme]);

    return (
        <div className="fixed inset-0 z-[9999] bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col items-center justify-center overflow-hidden transition-colors duration-500 loading-screen-exit">
            
            {/* Theme-aware ambient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg-primary)] via-[var(--bg-secondary)] to-[var(--bg-primary)] opacity-80"></div>
            
            {/* Decorative Background Blobs */}
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[var(--accent)]/5 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '6s' }}></div>
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[var(--success)]/5 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }}></div>

            <div className="relative z-10 flex flex-col items-center max-w-2xl w-full px-6">
                
                {/* Logo & Spinner */}
                <div className="relative mb-12 group">
                    {/* Outer Glow */}
                    <div className="absolute inset-0 bg-[var(--accent)]/20 blur-xl rounded-full animate-pulse group-hover:bg-[var(--accent)]/30 transition-colors"></div>
                    
                    <div className="w-24 h-24 flex items-center justify-center relative">
                        {/* Spinner Ring */}
                        <div className="absolute inset-[-8px] border-2 border-transparent border-t-[var(--accent)] border-r-[var(--accent)]/50 rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
                        <div className="absolute inset-[-16px] border border-transparent border-b-[var(--success)]/30 border-l-[var(--success)]/20 rounded-full animate-spin" style={{ animationDuration: '2.5s', animationDirection: 'reverse' }}></div>
                        
                        {/* Logo */}
                        <InfinityIcon className="w-14 h-14 text-[var(--text-primary)] drop-shadow-lg animate-[pulse_3s_ease-in-out_infinite]" />
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-4xl md:text-6xl font-journal font-bold tracking-tight mb-8 animate-[popIn_0.8s_cubic-bezier(0.16,1,0.3,1)] text-transparent bg-clip-text bg-gradient-to-r from-[var(--text-primary)] via-[var(--accent)] to-[var(--text-secondary)] bg-[length:200%_auto] animate-[gradient-move_5s_linear_infinite]">
                    Infi-Notes
                </h1>

                {/* Quote Card */}
                <div className="relative bg-[var(--bg-secondary)]/50 backdrop-blur-md p-8 rounded-2xl border border-[var(--border-primary)] shadow-xl w-full max-w-lg animate-[fadeIn_1s_ease-out_0.3s_both]">
                    <div className="absolute -top-4 -left-4 w-8 h-8 bg-[var(--bg-primary)] rounded-full flex items-center justify-center border border-[var(--border-primary)] shadow-sm">
                        <SparklesIcon className="w-4 h-4 text-[var(--accent)]" />
                    </div>
                    
                    <p className="text-lg md:text-xl font-medium text-[var(--text-primary)] italic leading-relaxed text-center font-serif">
                        "{quote}"
                    </p>
                    
                    <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-[var(--bg-primary)] rounded-full flex items-center justify-center border border-[var(--border-primary)] shadow-sm">
                        <SparklesIcon className="w-4 h-4 text-[var(--success)]" />
                    </div>
                </div>
                
                {/* Progress Section */}
                <div className="mt-12 w-full max-w-md flex flex-col items-center gap-3">
                    <div className="w-full h-1.5 bg-[var(--border-primary)] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--success)] animate-[loading-bar_2s_ease-in-out_infinite] w-[40%] rounded-full shadow-[0_0_10px_rgba(var(--accent),0.5)]"></div>
                    </div>
                    <div className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] opacity-70 animate-pulse min-h-[1.5em]">
                        {loadingText}
                    </div>
                </div>

                <style>{`
                    @keyframes loading-bar {
                        0% { transform: translateX(-100%); width: 20%; }
                        50% { width: 60%; }
                        100% { transform: translateX(250%); width: 20%; }
                    }
                `}</style>
            </div>
        </div>
    );
};

export default LoadingScreen;
