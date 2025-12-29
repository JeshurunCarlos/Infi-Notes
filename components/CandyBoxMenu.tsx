
import React, { useState, useRef, useEffect } from 'react';
import { HomeIcon, RocketIcon, PencilIcon, Squares2X2Icon, SwatchIcon, UserIcon, LogoutIcon, CloseIcon, CandyBoxIcon } from './Icons';
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

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleNavigate = (view: string) => {
        onNavigate(view);
        setIsOpen(false);
    };

    const cycleTheme = () => {
        const themes: Theme[] = ['light', 'frosty', 'matrix', 'cyberpunk', 'monokai', 'pitch-black', 'paper'];
        const currentIndex = themes.indexOf(theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        setTheme(themes[nextIndex]);
    };

    const menuItems = [
        { id: 'landing', label: 'Home', icon: <HomeIcon className="w-6 h-6" />, action: () => handleNavigate('landing'), active: currentView === 'landing' },
        { id: 'app', label: 'Workspace', icon: <RocketIcon className="w-6 h-6" />, action: () => { if (user) handleNavigate('app'); else onLogin(); }, active: currentView === 'app' },
        { id: 'journal', label: 'Journal', icon: <PencilIcon className="w-6 h-6" />, action: () => handleNavigate('journal'), active: currentView === 'journal' },
        { id: 'widgets', label: 'Widgets', icon: <Squares2X2Icon className="w-6 h-6" />, action: () => handleNavigate('widgets'), active: currentView === 'widgets' },
        { id: 'theme', label: 'Theme', icon: <SwatchIcon className="w-6 h-6" />, action: cycleTheme, active: false },
        { id: 'auth', label: user ? 'Logout' : 'Login', icon: user ? <LogoutIcon className="w-6 h-6" /> : <UserIcon className="w-6 h-6" />, action: () => { if (user) onLogout(); else onLogin(); setIsOpen(false); }, active: false }
    ];

    return (
        <div ref={menuRef} className="fixed top-[20px] left-6 z-[100] flex flex-col items-start">
            <button onClick={() => setIsOpen(!isOpen)} className="group w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-105 btn-press bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--accent)] hover:shadow-[var(--accent)]/20 z-50">
                <div className={`relative w-6 h-6 text-[var(--text-primary)] transition-all duration-300 ${isOpen ? 'rotate-180 scale-90' : ''}`}>
                    {isOpen ? <CloseIcon className="w-full h-full text-[var(--danger)]" /> : <CandyBoxIcon className="w-full h-full text-[var(--accent)]" />}
                </div>
            </button>

            <div className={`mt-4 origin-top-left transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] absolute top-full left-0 z-40 ${isOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-90 -translate-y-4 pointer-events-none'}`}>
                <div className="bg-[var(--bg-secondary)]/80 backdrop-blur-2xl border border-[var(--border-primary)] p-3 rounded-3xl shadow-2xl grid grid-cols-2 gap-3 w-64 animate-[fade-in-scale_0.2s_ease-out]">
                    {menuItems.map((item, index) => (
                        <button key={item.id} onClick={item.action} className={`relative group flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-300 btn-press border border-[var(--border-primary)] shadow-sm hover:shadow-md hover:scale-105 active:scale-95 ${item.active ? 'bg-[var(--accent)] text-white border-transparent' : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]'}`} style={{ animationDelay: `${index * 50}ms`, transitionDelay: `${index * 20}ms` }}>
                            <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-1 transition-opacity pointer-events-none ${item.active ? 'bg-white/10' : 'bg-[var(--accent)]/5'}`}></div>
                            <div className="relative z-10 drop-shadow-sm transition-transform group-hover:scale-110 duration-300">{item.icon}</div>
                            <span className="relative z-10 text-[10px] font-bold mt-2 uppercase tracking-wide">{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
