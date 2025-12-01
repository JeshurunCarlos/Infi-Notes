
import React, { useState, useRef, useEffect } from 'react';
import { HomeIcon, RocketIcon, PencilIcon, Squares2X2Icon, ThemeIcon, UserIcon, LogoutIcon, CloseIcon } from './Icons';
import { Theme, User } from '../types';

interface CandyBoxMenuProps {
    currentView: string;
    onNavigate: (view: any) => void;
    theme: Theme;
    setTheme: (t: Theme) => void;
    user: User | null;
    onLogin: () => void;
    onLogout: () => void;
}

export const CandyBoxMenu: React.FC<CandyBoxMenuProps> = ({ 
    currentView, 
    onNavigate, 
    theme, 
    setTheme, 
    user, 
    onLogin, 
    onLogout 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleNavigate = (view: string) => {
        onNavigate(view);
        setIsOpen(false);
    };

    const cycleTheme = () => {
        const themes: Theme[] = ['light', 'frosty', 'matrix', 'cyberpunk', 'monokai', 'pitch-black'];
        const currentIndex = themes.indexOf(theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        setTheme(themes[nextIndex]);
    };

    const menuItems = [
        { 
            id: 'landing', 
            label: 'Home', 
            icon: <HomeIcon className="w-6 h-6 text-white" />, 
            color: 'bg-gradient-to-br from-emerald-400 to-green-600',
            action: () => handleNavigate('landing'),
            active: currentView === 'landing'
        },
        { 
            id: 'app', 
            label: 'Workspace', 
            icon: <RocketIcon className="w-6 h-6 text-white" />, 
            color: 'bg-gradient-to-br from-indigo-400 to-violet-600',
            action: () => {
                if (user) handleNavigate('app');
                else onLogin();
            },
            active: currentView === 'app'
        },
        { 
            id: 'journal', 
            label: 'Journal', 
            icon: <PencilIcon className="w-6 h-6 text-white" />, 
            color: 'bg-gradient-to-br from-pink-400 to-rose-600',
            action: () => handleNavigate('journal'),
            active: currentView === 'journal'
        },
        { 
            id: 'widgets', 
            label: 'Widgets', 
            icon: <Squares2X2Icon className="w-6 h-6 text-white" />, 
            color: 'bg-gradient-to-br from-cyan-400 to-blue-600',
            action: () => handleNavigate('widgets'),
            active: currentView === 'widgets'
        },
        { 
            id: 'theme', 
            label: 'Theme', 
            icon: <ThemeIcon className="w-6 h-6 text-white" />, 
            color: 'bg-gradient-to-br from-amber-400 to-orange-600',
            action: cycleTheme,
            active: false
        },
        { 
            id: 'auth', 
            label: user ? 'Logout' : 'Login', 
            icon: user ? <LogoutIcon className="w-6 h-6 text-white" /> : <UserIcon className="w-6 h-6 text-white" />, 
            color: 'bg-gradient-to-br from-slate-500 to-slate-800',
            action: () => {
                if (user) onLogout();
                else onLogin();
                setIsOpen(false);
            },
            active: false
        }
    ];

    return (
        <div 
            ref={menuRef}
            className="fixed top-4 left-4 z-[100] flex flex-col items-start"
        >
            {/* The Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    group w-12 h-12 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 btn-press
                    bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-primary)] border border-[var(--border-primary)]
                    hover:border-[var(--accent)] hover:shadow-[var(--accent)]/20 z-50
                `}
                title={isOpen ? "Close Menu" : "Open Menu"}
            >
                <div className={`relative w-6 h-6 text-[var(--text-primary)] transition-all duration-300 ${isOpen ? 'rotate-180 scale-90' : 'rotate-0'}`}>
                    {isOpen ? (
                        <CloseIcon className="w-full h-full text-[var(--danger)]" />
                    ) : (
                        // Diamond shape grid icon representing the "box"
                        <div className="transform rotate-45 transition-transform group-hover:rotate-90">
                            <Squares2X2Icon className="w-full h-full text-[var(--accent)]" />
                        </div>
                    )}
                </div>
            </button>

            {/* The Expanded Menu Box */}
            <div 
                className={`mt-2 origin-top-left transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] absolute top-full left-0 z-40 ${
                    isOpen 
                    ? 'opacity-100 scale-100 translate-y-0' 
                    : 'opacity-0 scale-90 -translate-y-4 pointer-events-none'
                }`}
            >
                <div className="bg-[var(--bg-secondary)]/30 backdrop-blur-2xl border border-white/20 p-3 rounded-3xl shadow-2xl grid grid-cols-2 gap-3 w-64 animate-[fade-in-scale_0.2s_ease-out]">
                    {menuItems.map((item, index) => (
                        <button
                            key={item.id}
                            onClick={item.action}
                            className={`
                                relative group flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-300 btn-press
                                ${item.color} shadow-lg hover:shadow-xl hover:scale-105 active:scale-95
                                ${item.active ? 'ring-2 ring-white ring-offset-2 ring-offset-transparent' : ''}
                            `}
                            style={{ 
                                animationDelay: `${index * 50}ms`,
                                transitionDelay: `${index * 20}ms`
                            }}
                        >
                            {/* Glass gloss overlay */}
                            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-2xl pointer-events-none"></div>
                            
                            <div className="relative z-10 drop-shadow-md transition-transform group-hover:scale-110 duration-300">
                                {item.icon}
                            </div>
                            <span className="relative z-10 text-[10px] font-bold text-white mt-1 uppercase tracking-wide drop-shadow-sm">
                                {item.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};