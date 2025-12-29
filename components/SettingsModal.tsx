
import React, { useState } from 'react';
import Modal from './Modal';
import { User } from '../types';
import { CameraIcon, LogoutIcon, UserIcon, EyeSlashIcon, CheckIcon, ArrowsPointingOutIcon, LayoutDashboardIcon } from './Icons';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    onUpdateUser: (user: User) => void;
    onLogout: () => void;
    hideHeader: boolean;
    onToggleHideHeader: () => void;
    layoutMode: 'modern' | 'classic';
    onLayoutChange: (mode: 'modern' | 'classic') => void;
}

const DEFAULT_AVATARS = [
    'https://i.pravatar.cc/150?u=alexrider',
    'https://i.pravatar.cc/150?u=janesmith',
    'https://i.pravatar.cc/150?u=mikejones',
    'https://i.pravatar.cc/150?u=sarahconnor',
    'https://i.pravatar.cc/150?u=kylereese',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Ginger',
];

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, user, onUpdateUser, onLogout, hideHeader, onToggleHideHeader, layoutMode, onLayoutChange }) => {
    const [name, setName] = useState(user.name);
    const [avatar, setAvatar] = useState(user.avatar);
    const [incognito, setIncognito] = useState(false);

    const handleSave = () => {
        onUpdateUser({ ...user, name, avatar });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Settings" size="md">
            <div className="space-y-6">
                {/* Profile Section */}
                <div className="flex flex-col items-center gap-4">
                    <div className="relative group">
                        <img src={avatar} alt="Profile" className="w-24 h-24 rounded-full border-4 border-[var(--bg-secondary)] shadow-lg object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <CameraIcon className="w-8 h-8 text-white" />
                        </div>
                        {/* Avatar URL Input (Hidden but accessible via click) */}
                        <input 
                            type="text" 
                            value={avatar}
                            onChange={(e) => setAvatar(e.target.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            title="Paste Image URL or select below"
                        />
                    </div>
                    
                    {/* Default Avatars Selection */}
                    <div className="w-full">
                        <label className="text-xs font-bold uppercase text-[var(--text-secondary)] mb-2 block text-center">Choose Avatar</label>
                        <div className="flex flex-wrap justify-center gap-3">
                            {DEFAULT_AVATARS.map((url, index) => (
                                <button
                                    key={index}
                                    onClick={() => setAvatar(url)}
                                    className={`relative w-10 h-10 rounded-full overflow-hidden border-2 transition-all ${avatar === url ? 'border-[var(--accent)] scale-110' : 'border-transparent hover:border-[var(--border-primary)]'}`}
                                >
                                    <img src={url} alt={`Avatar ${index + 1}`} className="w-full h-full object-cover" />
                                    {avatar === url && (
                                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                            <CheckIcon className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="w-full">
                        <label className="text-xs font-bold uppercase text-[var(--text-secondary)] mb-1 block">Display Name</label>
                        <div className="flex items-center gap-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2">
                            <UserIcon className="w-5 h-5 text-[var(--text-secondary)]" />
                            <input 
                                type="text" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)}
                                className="bg-transparent outline-none flex-grow text-sm text-[var(--text-primary)]"
                            />
                        </div>
                    </div>
                </div>

                <div className="h-px bg-[var(--border-primary)]" />

                {/* Interface Layout */}
                <div className="space-y-3">
                    <label className="text-xs font-bold uppercase text-[var(--text-secondary)]">Interface Layout</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => onLayoutChange('modern')}
                            className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${layoutMode === 'modern' ? 'border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--accent)]' : 'border-[var(--border-primary)] hover:bg-[var(--bg-primary)]'}`}
                        >
                            <div className="flex gap-1">
                                <div className="w-4 h-6 rounded bg-current opacity-50"></div>
                                <div className="w-6 h-6 rounded bg-current opacity-80"></div>
                            </div>
                            <span className="text-xs font-bold">Modern (Curved)</span>
                        </button>
                        <button
                            onClick={() => onLayoutChange('classic')}
                            className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${layoutMode === 'classic' ? 'border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--accent)]' : 'border-[var(--border-primary)] hover:bg-[var(--bg-primary)]'}`}
                        >
                            <div className="flex gap-0 border border-current p-0.5 opacity-80">
                                <div className="w-4 h-5 border-r border-current"></div>
                                <div className="w-6 h-5"></div>
                            </div>
                            <span className="text-xs font-bold">Classic (Sharp)</span>
                        </button>
                    </div>
                </div>

                <div className="h-px bg-[var(--border-primary)]" />

                {/* Preferences */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[var(--text-primary)]">
                                <EyeSlashIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold text-sm text-[var(--text-primary)]">Incognito Mode</p>
                                <p className="text-xs text-[var(--text-secondary)]">Don't save history locally</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={incognito} onChange={(e) => setIncognito(e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[var(--text-primary)]">
                                <ArrowsPointingOutIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold text-sm text-[var(--text-primary)]">Auto-hide Header</p>
                                <p className="text-xs text-[var(--text-secondary)]">Show top bar only on hover</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={hideHeader} onChange={onToggleHideHeader} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]"></div>
                        </label>
                    </div>
                </div>

                <div className="h-px bg-[var(--border-primary)]" />

                {/* Actions */}
                <div className="flex flex-col gap-3">
                    <button onClick={handleSave} className="w-full py-2 bg-[var(--accent)] text-white rounded-lg font-bold shadow-md hover:opacity-90 transition-opacity btn-press">
                        Save Changes
                    </button>
                    <button onClick={onLogout} className="w-full py-2 border border-[var(--danger)] text-[var(--danger)] rounded-lg font-bold hover:bg-[var(--danger)] hover:text-white transition-colors flex items-center justify-center gap-2 btn-press">
                        <LogoutIcon className="w-4 h-4" /> Log Out
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default SettingsModal;
