
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MagnifyingGlassIcon } from './Icons';

const timezones = {
    'UTC': 'UTC',
    'America/New_York': 'New York',
    'America/Chicago': 'Chicago',
    'America/Denver': 'Denver',
    'America/Los_Angeles': 'Los Angeles',
    'Europe/London': 'London',
    'Europe/Paris': 'Paris',
    'Europe/Berlin': 'Berlin',
    'Asia/Tokyo': 'Tokyo',
    'Asia/Shanghai': 'Shanghai',
    'Asia/Singapore': 'Singapore',
    'Australia/Sydney': 'Sydney',
    'Pacific/Auckland': 'Auckland',
    'Asia/Dubai': 'Dubai',
    'Asia/Kolkata': 'Kolkata',
};


interface ClockProps {
    timezone: string;
    isThemeChanging: boolean;
    onChange: (timezone: string) => void;
}

const Clock: React.FC<ClockProps> = ({ timezone, isThemeChanging, onChange }) => {
    const [time, setTime] = useState(new Date());
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
                setSearchQuery('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (isDropdownOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isDropdownOpen]);

    const formattedTime = useMemo(() => {
        return time.toLocaleTimeString('en-US', {
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    }, [time, timezone]);

    const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const filteredTimezones = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return Object.entries(timezones).filter(([tz, label]) => 
            label.toLowerCase().includes(query) || tz.toLowerCase().includes(query)
        );
    }, [searchQuery]);

    return (
        <div ref={dropdownRef} className="relative">
            <button
                onClick={() => setIsDropdownOpen(prev => !prev)}
                className={`clock-widget-container relative flex items-center justify-center rounded-full px-4 py-1.5 shadow-sm transition-all btn-press animated-gradient-bg ${isThemeChanging ? 'theme-switch-animation' : ''}`}
            >
                <span className="font-mono text-base font-bold tracking-wider text-[var(--clock-text)] min-w-[90px]">{formattedTime}</span>
            </button>
            
            {isDropdownOpen && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-72 bg-[var(--bg-secondary)] rounded-xl shadow-xl border border-[var(--border-primary)] z-50 animated-popover overflow-hidden">
                    <div className="p-3 border-b border-[var(--border-primary)] bg-[var(--bg-primary)]">
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                            <input 
                                ref={searchInputRef}
                                type="text" 
                                placeholder="Search city..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-8 pr-2 py-1.5 text-sm bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-all"
                            />
                        </div>
                    </div>
                    
                    <ul className="max-h-64 overflow-y-auto custom-scrollbar">
                        <li 
                            onClick={() => { onChange(localTimezone); setIsDropdownOpen(false); }} 
                            className={`px-4 py-3 text-sm cursor-pointer flex justify-between items-center transition-colors border-b border-[var(--border-primary)]/50 ${timezone === localTimezone ? 'bg-[var(--accent)] text-white' : 'hover:bg-[var(--bg-primary)] text-[var(--text-primary)]'}`}
                        >
                            <div className="flex flex-col">
                                <span className="font-bold">Local Time</span>
                                <span className={`text-[10px] ${timezone === localTimezone ? 'text-white/80' : 'text-[var(--text-secondary)]'}`}>{localTimezone.split('/').pop()?.replace(/_/g, ' ')}</span>
                            </div>
                            {timezone === localTimezone && <span className="h-2 w-2 rounded-full bg-white"></span>}
                        </li>
                        
                        {filteredTimezones.map(([tz, label]) => {
                            const isActive = timezone === tz;
                            return (
                                <li 
                                    key={tz} 
                                    onClick={() => { onChange(tz); setIsDropdownOpen(false); }} 
                                    className={`px-4 py-2.5 text-sm cursor-pointer flex justify-between items-center transition-colors ${isActive ? 'bg-[var(--accent)] text-white' : 'hover:bg-[var(--bg-primary)] text-[var(--text-primary)]'}`}
                                >
                                    <div className="flex flex-col">
                                        <span className="font-medium">{label}</span>
                                        <span className={`text-[10px] ${isActive ? 'text-white/80' : 'text-[var(--text-secondary)]'}`}>{tz}</span>
                                    </div>
                                    {isActive && <span className="h-2 w-2 rounded-full bg-white"></span>}
                                </li>
                            );
                        })}
                        
                        {filteredTimezones.length === 0 && (
                            <li className="px-4 py-8 text-center text-sm text-[var(--text-secondary)]">
                                No timezones found
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default Clock;
