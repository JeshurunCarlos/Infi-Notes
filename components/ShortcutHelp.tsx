import React, { useState, useEffect } from 'react';
import Modal from './Modal';

interface ShortcutHelpProps {
    isOpen: boolean;
    onClose: () => void;
}

const windowsShortcuts = [
    { keys: ['/'], description: 'Focus on the notebook' },
    { keys: ['Ctrl', 'L'], description: 'Toggle the Task List' },
    { keys: ['Ctrl', 'A'], description: 'Cycle through color themes' },
    { keys: ['Ctrl', 'S'], description: 'Toggle the pages sidebar' },
    { keys: ['X'], description: 'Delete the selected widget' },
];

const macosShortcuts = [
    { keys: ['/'], description: 'Focus on the notebook' },
    { keys: ['⌘', 'L'], description: 'Toggle the Task List' },
    { keys: ['⌘', 'A'], description: 'Cycle through color themes' },
    { keys: ['⌘', 'S'], description: 'Toggle the pages sidebar' },
    { keys: ['X'], description: 'Delete the selected widget' },
];

const ShortcutHelp: React.FC<ShortcutHelpProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'windows' | 'macos'>('windows');

    useEffect(() => {
        if (isOpen) {
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            setActiveTab(isMac ? 'macos' : 'windows');
        }
    }, [isOpen]);

    const shortcuts = activeTab === 'windows' ? windowsShortcuts : macosShortcuts;

    const TabButton: React.FC<{ tabName: 'windows' | 'macos'; children: React.ReactNode }> = ({ tabName, children }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                activeTab === tabName
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--border-primary)]'
            }`}
        >
            {children}
        </button>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts">
            <div className="space-y-4">
                <div className="flex justify-center p-1 rounded-lg bg-[var(--bg-primary)]">
                    <TabButton tabName="windows">Windows / Linux</TabButton>
                    <TabButton tabName="macos">macOS</TabButton>
                </div>
                <ul className="space-y-3 pt-2">
                    {shortcuts.map((shortcut, index) => (
                        <li key={index} className="flex items-center justify-between">
                            <span className="text-[var(--text-primary)]">{shortcut.description}</span>
                            <div className="flex items-center gap-1.5">
                                {shortcut.keys.map(key => (
                                    <kbd key={key} className="px-2 py-1 text-xs font-semibold text-[var(--text-secondary)] bg-[var(--border-primary)] border-b-2 border-gray-400/50 rounded-md">
                                        {key}
                                    </kbd>
                                ))}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </Modal>
    );
};

export default ShortcutHelp;