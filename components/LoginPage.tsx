
import React from 'react';
import { User } from '../types';
import { ChevronLeftIcon, UserIcon, PlusIcon } from './Icons';

interface LoginPageProps {
    onSelectUser: (user: User) => void;
    onBack: () => void;
}

const MOCK_ACCOUNTS: User[] = [
    {
        id: 'mock-user-123',
        name: 'Thanos Subramaniyam',
        email: 'thanos.subm@example.com',
        avatar: 'https://i.pravatar.cc/150?u=alexrider'
    },
    {
        id: 'mock-user-456',
        name: 'Guest User',
        email: 'guest@infi-notes.app',
        avatar: 'https://i.pravatar.cc/150?u=guest'
    }
];

const LoginPage: React.FC<LoginPageProps> = ({ onSelectUser, onBack }) => {
    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)] relative overflow-hidden p-6 animate-[fadeIn_0.5s_ease-out]">
            
            <button 
                onClick={onBack}
                className="absolute top-8 left-8 p-2 rounded-full hover:bg-[var(--bg-secondary)] transition-colors flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
                <ChevronLeftIcon className="w-5 h-5" />
                <span className="font-bold text-sm">Back</span>
            </button>

            <div className="w-full max-w-md bg-[var(--bg-secondary)]/50 backdrop-blur-xl border border-[var(--border-primary)] rounded-3xl p-8 shadow-2xl flex flex-col items-center">
                <div className="w-16 h-16 bg-[var(--accent)] rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-[var(--accent)]/30">
                    <UserIcon className="w-8 h-8" />
                </div>
                
                <h1 className="text-2xl font-bold mb-2">Welcome Back</h1>
                <p className="text-[var(--text-secondary)] text-sm mb-8">Choose an account to continue</p>

                <div className="w-full space-y-3">
                    {MOCK_ACCOUNTS.map(user => (
                        <button
                            key={user.id}
                            onClick={() => onSelectUser(user)}
                            className="w-full flex items-center gap-4 p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] hover:border-[var(--accent)] hover:shadow-md transition-all group text-left"
                        >
                            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border border-[var(--border-primary)]" />
                            <div className="flex-grow">
                                <p className="font-bold text-sm group-hover:text-[var(--accent)] transition-colors">{user.name}</p>
                                <p className="text-xs text-[var(--text-secondary)]">{user.email}</p>
                            </div>
                        </button>
                    ))}
                    
                    <button className="w-full flex items-center gap-4 p-3 rounded-xl border border-dashed border-[var(--border-primary)] hover:bg-[var(--bg-primary)]/50 hover:border-[var(--text-secondary)] transition-all group text-left text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                        <div className="w-10 h-10 rounded-full border border-dashed border-[var(--border-primary)] flex items-center justify-center group-hover:border-[var(--text-secondary)]">
                            <PlusIcon className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-sm">Add another account</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
