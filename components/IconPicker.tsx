import React, { useRef, useEffect } from 'react';
import { CloseIcon } from './Icons';

interface IconPickerProps {
    onSelect: (icon: string) => void;
    onClose: () => void;
    position: { top: number; left: number };
}

const EMOJI_LIST = [
    "📄", "📁", "📝", "📓", "📕", "📗", "📘", "📙", "📚", "🔖",
    "💡", "🔔", "📅", "✅", "❌", "❤️", "⭐", "🔥", "⚠️", "🚩",
    "🏠", "🏢", "👤", "👥", "⚙️", "🔧", "🔨", "🛒", "💰", "💳",
    "💻", "📱", "📷", "🎥", "🎧", "🎤", "🎮", "🎨", "🎭", "🎪",
    "🌍", "🌎", "🌏", "🗺️", "🚀", "✈️", "🚗", "🚲", "⚓", "🚧",
    "☀️", "🌙", "☁️", "❄️", "⚡", "💧", "🌊", "🌱", "🌲", "🍀",
    "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯",
    "🍎", "🍌", "🍒", "🍇", "🍉", "🍓", "🍑", "🍍", "🥭", "🥥",
    "🍕", "🍔", "🍟", "🌭", "🍿", "🧂", "🥓", "🥚", "🍳", "🥞",
    "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🎱", "🏓"
];

const IconPicker: React.FC<IconPickerProps> = ({ onSelect, onClose, position }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Adjust position if it goes off screen
    const adjustedPosition = { ...position };
    if (window.innerWidth - position.left < 280) {
        adjustedPosition.left = window.innerWidth - 280;
    }
    // Ensure it doesn't go off top/bottom essentially
    if (adjustedPosition.top + 250 > window.innerHeight) {
        adjustedPosition.top = position.top - 260; // Flip to above
    }

    return (
        <div 
            ref={ref}
            className="fixed z-[60] bg-[var(--bg-secondary)] border border-[var(--border-primary)] shadow-xl rounded-lg w-64 p-2 animated-popover"
            style={{ top: adjustedPosition.top, left: adjustedPosition.left }}
        >
             <div className="flex justify-between items-center mb-2 px-1">
                <span className="text-xs font-bold uppercase text-[var(--text-secondary)]">Select Icon</span>
                 <button onClick={onClose} className="p-1 rounded-full hover:bg-[var(--border-primary)] btn-press">
                    <CloseIcon className="w-3 h-3" />
                </button>
            </div>
            <div className="grid grid-cols-6 gap-1 max-h-60 overflow-y-auto custom-scrollbar">
                {EMOJI_LIST.map((emoji) => (
                    <button
                        key={emoji}
                        onClick={() => { onSelect(emoji); onClose(); }}
                        className="p-1.5 text-lg rounded hover:bg-[var(--bg-primary)] transition-colors flex items-center justify-center btn-press"
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default IconPicker;