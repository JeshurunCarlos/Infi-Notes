import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDownIcon } from './Icons';

const timezones = {
    'UTC': 'UTC',
    'America/New_York': 'NY', // US East
    'America/Chicago': 'CH', // US Central
    'America/Denver': 'DN', // US Mountain
    'America/Los_Angeles': 'LA', // US Pacific
    'Europe/London': 'LD', // London
    'Europe/Paris': 'PR', // Paris
    'Asia/Tokyo': 'TK', // Tokyo
    'Australia/Sydney': 'SY', // Sydney
};

interface TimezoneSelectorProps {
    timezone: string;
    onChange: (timezone: string) => void;
}

const TimezoneSelector: React.FC<TimezoneSelectorProps> = ({ timezone, onChange }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

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
    
    const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const displayTimezone = useMemo(() => {
        if (timezone === localTimezone) return 'LCL';
        return timezones[timezone as keyof typeof timezones] || timezone.substring(0, 3).toUpperCase();
    }, [timezone, localTimezone]);

    return (
        <div ref={dropdownRef} className="relative">
            <button
                onClick={() => setIsDropdownOpen(prev => !prev)}
                className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--border-primary)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] focus:ring-[var(--accent)] transition-all btn-press"
                title="Change timezone"
            >
                <span>{displayTimezone}</span>
                <ChevronDownIcon className={`w-3 h-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
                <div className="absolute top-full mt-2 right-0 w-48 bg-[var(--bg-secondary)] rounded-lg shadow-lg border border-[var(--border-primary)] z-20 animated-popover">
                    <ul className="py-1 max-h-48 overflow-y-auto">
                        <li key="local" onClick={() => { onChange(localTimezone); setIsDropdownOpen(false); }} className="px-3 py-1.5 text-sm hover:bg-[var(--border-primary)] cursor-pointer text-[var(--text-primary)] flex justify-between">
                            <span>Local</span>
                            <span className="text-[var(--text-secondary)]">LCL</span>
                        </li>
                        {Object.entries(timezones)
                            .filter(([tz]) => tz !== localTimezone)
                            .map(([tz, short]) => (
                            <li key={tz} onClick={() => { onChange(tz); setIsDropdownOpen(false); }} className="px-3 py-1.5 text-sm hover:bg-[var(--border-primary)] cursor-pointer text-[var(--text-primary)] flex justify-between">
                                <span>{tz.split('/').pop()?.replace('_', ' ')}</span>
                                <span className="text-[var(--text-secondary)]">{short}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default TimezoneSelector;
