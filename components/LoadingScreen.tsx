
import React, { useEffect, useState } from 'react';
import { InfinityIcon, SparklesIcon } from './Icons';

const quotes = [
    "The mind is everything. What you think you become.",
    "Act as if what you do makes a difference. It does.",
    "Simplicity is the ultimate sophistication.",
    "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.",
    "Quiet the mind, and the soul will speak.",
    "Wherever you go, go with all your heart.",
    "Productivity is being able to do things that you were never able to do before.",
    "Focus on being productive instead of busy.",
    "The only way to do great work is to love what you do."
];

const LoadingScreen: React.FC = () => {
    const [quote, setQuote] = useState("");

    useEffect(() => {
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        setQuote(randomQuote);
    }, []);

    return (
        <div className="fixed inset-0 z-[9999] bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col items-center justify-center overflow-hidden transition-colors duration-500 loading-screen-exit">
            {/* Decorative Background Blobs */}
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[var(--accent)]/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '4s' }}></div>
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[var(--success)]/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>

            <div className="relative z-10 flex flex-col items-center scale-110">
                {/* Custom Zen Loader - Enlarged */}
                <div className="relative w-64 h-64 mb-16">
                    {/* Outer Rotating Ring */}
                    <div className="absolute inset-0 border-4 border-[var(--border-primary)] rounded-full"></div>
                    <div className="absolute inset-0 border-t-4 border-[var(--accent)] rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
                    
                    {/* Inner Breathing Circle */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-48 h-48 bg-[var(--bg-secondary)] rounded-full shadow-2xl flex items-center justify-center border border-[var(--border-primary)] animate-pulse" style={{ animationDuration: '2s' }}>
                            <InfinityIcon className="w-24 h-24 text-[var(--accent)] opacity-80" />
                        </div>
                    </div>
                </div>

                {/* Title */}
                <h1 className="font-journal text-6xl font-bold tracking-tight mb-8 animate-[popIn_0.8s_cubic-bezier(0.16,1,0.3,1)] text-[var(--text-primary)]">
                    Infi-Notes
                </h1>

                {/* Quote */}
                <div className="max-w-xl text-center px-6">
                    <p className="text-lg font-medium text-[var(--text-secondary)] italic leading-relaxed animate-[fadeIn_1s_ease-out_0.3s_both]">
                        "{quote}"
                    </p>
                </div>
            </div>
            
            {/* Loading Indicator Text */}
            <div className="absolute bottom-16 text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] opacity-50 animate-pulse">
                Loading Workspace...
            </div>
        </div>
    );
};

export default LoadingScreen;
