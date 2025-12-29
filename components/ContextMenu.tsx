
import React, { useEffect, useRef } from 'react';

export interface ContextMenuItem {
    label?: string;
    icon?: React.ReactNode;
    action?: () => void;
    danger?: boolean;
    separator?: boolean;
}

interface ContextMenuProps {
    x: number;
    y: number;
    items: ContextMenuItem[];
    onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Adjust position to keep within viewport
    const adjustedX = Math.min(x, window.innerWidth - 240);
    const adjustedY = Math.min(y, window.innerHeight - (items.length * 45));

    return (
        <div 
            ref={menuRef}
            className="fixed z-[9999] w-60 bg-[var(--bg-secondary)]/90 backdrop-blur-2xl border border-[var(--border-primary)]/50 rounded-xl shadow-2xl overflow-hidden animate-[popIn_0.15s_cubic-bezier(0.16,1,0.3,1)] origin-top-left ring-1 ring-black/5"
            style={{ top: adjustedY, left: adjustedX }}
        >
            <div className="py-1.5">
                {items.map((item, index) => (
                    <React.Fragment key={index}>
                        {item.separator ? (
                            <div className="h-px bg-[var(--border-primary)]/60 my-1.5 mx-3" />
                        ) : (
                            <button
                                onClick={() => { if (item.action) item.action(); onClose(); }}
                                className={`group w-full text-left px-3 py-2 mx-1 rounded-lg flex items-center gap-3 transition-all duration-200
                                    ${item.danger 
                                        ? 'text-red-500 hover:bg-red-500/10' 
                                        : 'text-[var(--text-primary)] hover:bg-[var(--bg-primary)] hover:text-[var(--accent)] hover:shadow-sm'
                                    }
                                    max-w-[calc(100%-8px)]
                                `}
                            >
                                {item.icon && (
                                    <span className={`w-5 h-5 flex items-center justify-center transition-transform group-hover:scale-110 ${item.danger ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>
                                        {item.icon}
                                    </span>
                                )}
                                <span className="font-medium text-sm tracking-wide">{item.label}</span>
                            </button>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default ContextMenu;
