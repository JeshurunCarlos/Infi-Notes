
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
        <div className="fixed inset-0 z-[9999] bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col items-center justify-center overflow-hidden transition-colors duration-500">
            {/* Decorative Background Blobs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--accent)]/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '4s' }}></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--success)]/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>

            <div className="relative z-10 flex flex-col items-center">
                {/* Custom Zen Loader */}
                <div className="relative w-32 h-32 mb-12">
                    {/* Outer Rotating Ring */}
                    <div className="absolute inset-0 border-2 border-[var(--border-primary)] rounded-full"></div>
                    <div className="absolute inset-0 border-t-2 border-[var(--accent)] rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
                    
                    {/* Inner Breathing Circle */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 bg-[var(--bg-secondary)] rounded-full shadow-xl flex items-center justify-center border border-[var(--border-primary)] animate-pulse" style={{ animationDuration: '2s' }}>
                            <InfinityIcon className="w-10 h-10 text-[var(--accent)] opacity-80" />
                        </div>
                    </div>
                </div>

                {/* Title */}
                <h1 className="font-journal text-5xl font-bold tracking-tight mb-6 animate-[popIn_0.8s_cubic-bezier(0.16,1,0.3,1)]">
                    Infi-Notes
                </h1>

                {/* Quote */}
                <div className="max-w-md text-center px-6">
                    <p className="text-sm font-medium text-[var(--text-secondary)] italic leading-relaxed animate-[fadeIn_1s_ease-out_0.3s_both]">
                        "{quote}"
                    </p>
                </div>
            </div>
            
            {/* Loading Indicator Text */}
            <div className="absolute bottom-12 text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] opacity-50 animate-pulse">
                Loading Workspace...
            </div>
        </div>
    );
};

export default LoadingScreen;
