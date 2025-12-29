
import React, { useState, useEffect, useMemo, useRef } from 'react';

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
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const formattedTime = useMemo(() => {
        return time.toLocaleTimeString('en-US', {
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    }, [time, timezone]);

    const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return (
        <div ref={dropdownRef} className="relative">
            <button
                onClick={() => setIsDropdownOpen(prev => !prev)}
                className={`clock-widget-container relative flex items-center justify-center gap-2 rounded-full px-6 py-2 shadow-sm transition-all active:scale-95 duration-200 animated-gradient-bg ${isThemeChanging ? 'theme-switch-animation' : ''} ${isDropdownOpen ? 'scale-105 shadow-md' : ''}`}
            >
                <span className="font-mono text-lg font-bold tracking-wider text-[var(--clock-text)] min-w-[80px]">{formattedTime}</span>
            </button>
            
            {/* Seamless Animated Horizontal Dropdown (RTC Menu) */}
            <div 
                className={`absolute top-full mt-3 left-1/2 -translate-x-1/2 w-max max-w-[90vw] bg-[var(--bg-secondary)] rounded-xl shadow-2xl border border-[var(--border-primary)] z-50 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] origin-top
                    ${isDropdownOpen 
                        ? 'opacity-100 transform scale-100 translate-y-0 pointer-events-auto' 
                        : 'opacity-0 transform scale-95 -translate-y-2 pointer-events-none'
                    }
                `}
            >
                <div className="p-2 overflow-x-auto custom-scrollbar">
                    <ul className="flex flex-row gap-2">
                        <li 
                            onClick={() => { onChange(localTimezone); setIsDropdownOpen(false); }} 
                            className={`flex-shrink-0 px-4 py-3 cursor-pointer flex flex-col items-center justify-center gap-1 transition-all rounded-lg border border-[var(--border-primary)]/50 ${timezone === localTimezone ? 'bg-[var(--accent)] text-white shadow-md' : 'hover:bg-[var(--bg-primary)] text-[var(--text-primary)]'}`}
                            style={{ minWidth: '100px' }}
                        >
                            <span className="font-bold text-xs whitespace-nowrap">Local Time</span>
                            <span className={`text-[10px] ${timezone === localTimezone ? 'text-white/80' : 'text-[var(--text-secondary)]'} whitespace-nowrap`}>{localTimezone.split('/').pop()?.replace(/_/g, ' ')}</span>
                        </li>
                        
                        {Object.entries(timezones).map(([tz, label]) => {
                            const isActive = timezone === tz;
                            return (
                                <li 
                                    key={tz} 
                                    onClick={() => { onChange(tz); setIsDropdownOpen(false); }} 
                                    className={`flex-shrink-0 px-4 py-3 cursor-pointer flex flex-col items-center justify-center gap-1 transition-all rounded-lg border border-[var(--border-primary)]/50 ${isActive ? 'bg-[var(--accent)] text-white shadow-md' : 'hover:bg-[var(--bg-primary)] text-[var(--text-primary)]'}`}
                                    style={{ minWidth: '100px' }}
                                >
                                    <span className="font-medium text-xs whitespace-nowrap">{label}</span>
                                    <span className={`text-[10px] ${isActive ? 'text-white/80' : 'text-[var(--text-secondary)]'} whitespace-nowrap`}>{tz}</span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Clock;
