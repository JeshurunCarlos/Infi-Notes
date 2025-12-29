
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, Theme, ToDoItem, NotePage } from '../types';
import { LayoutDashboardIcon, MailIcon, StickyNoteIcon, SwatchIcon, ChevronLeftIcon, ChevronRightIcon, DocumentTextIcon, CheckIcon, PlusIcon, PencilIcon, HomeIcon, ImageIcon, CloseIcon, ClockIcon, MagnifyingGlassIcon, RocketIcon, BriefcaseIcon, StackIcon, LaptopIcon, ArrowPathIcon, ArrowsRightLeftIcon, ListBulletIcon, SparklesIcon, BookOpenIcon, TimerIcon } from './Icons';

interface DashboardProps {
    user: User;
    todos: ToDoItem[];
    pages: NotePage[];
    onOpenNote: (id: string) => void;
    onToggleTodo: (id: string) => void;
    onUpdateTodo?: (id: string, text: string, description?: string) => void;
    onAddTodo?: (text: string, description?: string, date?: string) => void;
    theme: Theme;
    setTheme: (t: Theme) => void;
    onContextMenu: (e: React.MouseEvent) => void;
    onUploadWallpaper?: () => void;
    onCloseDashboard?: () => void;
}

const THEME_PALETTES: Record<Theme, string[]> = {
    'light': ['#ffffff', '#f1f5f9', '#2563eb', '#020617'],
    'paper': ['#fcfaf2', '#f0ede1', '#2c3e50', '#1a1a1a'],
    'pitch-black': ['#000000', '#1a1a1a', '#00BFFF', '#f0f0f0'],
    'matrix': ['#000500', '#001a00', '#22c55e', '#4ade80'],
    'cyberpunk': ['#050505', '#0f0f13', '#ffee00', '#00f3ff'],
    'monokai': ['#272822', '#3E3D32', '#FF6188', '#F8F8F2'],
    'frosty': ['#f0f9ff', '#e0f2fe', '#38bdf8', '#0284c7'],
};

const MOCK_EMAILS = [
    { id: 1, sender: "Product Team", subject: "Q4 Roadmap Review", time: "10:30 AM" },
    { id: 2, sender: "Alex Chen", subject: "Design Assets", time: "09:15 AM" },
    { id: 3, sender: "System", subject: "Update complete", time: "Yesterday" },
];

interface Habit {
    id: string;
    name: string;
    completions: string[]; // ISO Dates
}

const HabitTracker: React.FC<{ user: User }> = ({ user }) => {
    const [habits, setHabits] = useState<Habit[]>(() => {
        const saved = localStorage.getItem(`habits-${user.id}`);
        return saved ? JSON.parse(saved) : [
            { id: '1', name: 'Deep Work', completions: [] },
            { id: '2', name: 'Exercise', completions: [] },
            { id: '3', name: 'Reading', completions: [] },
            { id: '4', name: 'Meditation', completions: [] }
        ];
    });

    useEffect(() => {
        localStorage.setItem(`habits-${user.id}`, JSON.stringify(habits));
    }, [habits, user.id]);

    const last7Days = useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d;
        });
    }, []);

    const toggleHabit = (habitId: string, date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        setHabits(prev => prev.map(h => {
            if (h.id === habitId) {
                const isDone = h.completions.includes(dateStr);
                return {
                    ...h,
                    completions: isDone 
                        ? h.completions.filter(c => c !== dateStr)
                        : [...h.completions, dateStr]
                };
            }
            return h;
        }));
    };

    return (
        <div className="flex flex-col gap-4 h-full">
            {habits.map((habit) => {
                const completedCount = habit.completions.length;
                const progress = Math.round((completedCount / 30) * 100); // 30 day goal context

                return (
                    <div key={habit.id} className="bg-[var(--bg-primary)] p-4 rounded-2xl border border-[var(--border-primary)] shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                <span className="text-xs font-black uppercase tracking-tight">{habit.name}</span>
                            </div>
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">{completedCount} pts</span>
                        </div>
                        <div className="flex justify-between items-center gap-1">
                            {last7Days.map((day, idx) => {
                                const dateStr = day.toISOString().split('T')[0];
                                const isCompleted = habit.completions.includes(dateStr);
                                const isToday = dateStr === new Date().toISOString().split('T')[0];
                                
                                return (
                                    <button 
                                        key={idx}
                                        onClick={() => toggleHabit(habit.id, day)}
                                        className={`flex-1 aspect-square rounded-lg flex flex-col items-center justify-center transition-all border
                                            ${isCompleted 
                                                ? 'bg-amber-500 border-amber-600 text-white shadow-lg scale-105' 
                                                : 'bg-[var(--bg-secondary)] border-[var(--border-primary)]/50 text-[var(--text-secondary)] opacity-40 hover:opacity-100'}
                                            ${isToday ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-[var(--bg-primary)]' : ''}
                                        `}
                                    >
                                        <span className="text-[8px] font-black uppercase mb-0.5">{day.toLocaleDateString('en-US', { weekday: 'narrow' })}</span>
                                        {isCompleted && <CheckIcon className="w-3 h-3" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
            <div className="mt-auto pt-4 border-t border-[var(--border-primary)]/50">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-amber-600/60 mb-2">
                    <span>Neural Consistency</span>
                    <span>72% Velocity</span>
                </div>
                <div className="h-2 w-full bg-[var(--bg-secondary)] rounded-full overflow-hidden border border-[var(--border-primary)]/30">
                    <div className="h-full bg-amber-500 w-[72%] shadow-[0_0_10px_rgba(245,158,11,0.4)] animate-pulse"></div>
                </div>
            </div>
        </div>
    );
};

const WeeklyCalendarView: React.FC<{ 
    viewDate: Date, 
    onDateClick: (date: Date) => void, 
    todos: ToDoItem[],
    onAddTask: () => void 
}> = ({ viewDate, onDateClick, todos, onAddTask }) => {
    const startOfWeek = new Date(viewDate);
    startOfWeek.setDate(viewDate.getDate() - viewDate.getDay() + (viewDate.getDay() === 0 ? -6 : 1));

    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        return d;
    });

    const isSameDay = (d1: Date, d2: Date) => 
        d1.getDate() === d2.getDate() && 
        d1.getMonth() === d2.getMonth() && 
        d1.getFullYear() === d2.getFullYear();

    const filteredTodos = todos.filter(t => t.date === viewDate.toISOString().split('T')[0]);

    return (
        <div className="flex flex-col gap-6 h-full">
            <div className="flex flex-col gap-1">
                <span className="text-sm font-black uppercase text-[var(--text-secondary)] opacity-60">
                    {viewDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="text-xl font-black text-violet-500 uppercase tracking-widest">Temporal Module</span>
            </div>
            
            <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar">
                {weekDays.map((date, idx) => {
                    const isSelected = isSameDay(date, viewDate);
                    const dateStr = date.toISOString().split('T')[0];
                    const hasTasks = todos.some(t => t.date === dateStr);
                    
                    return (
                        <div 
                            key={idx}
                            onClick={() => onDateClick(date)}
                            className={`flex-shrink-0 w-16 p-4 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 cursor-pointer shadow-sm
                                ${isSelected ? 'bg-violet-600 text-white scale-105 shadow-violet-500/30' : 'bg-[var(--bg-primary)] border border-[var(--border-primary)] hover:border-violet-300'}
                            `}
                        >
                            <span className={`text-[10px] font-black uppercase mb-1 ${isSelected ? 'text-white/80' : 'text-[var(--text-secondary)]'}`}>
                                {date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                            </span>
                            <span className="text-xl font-black">{date.getDate()}</span>
                            {hasTasks && (
                                <div className="flex gap-0.5 mt-2">
                                    <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-violet-500'}`} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="flex-grow space-y-3 overflow-y-auto custom-scrollbar pr-2 min-h-0">
                {filteredTodos.length > 0 ? (
                    filteredTodos.map((task) => (
                        <div key={task.id} className="group relative flex items-center gap-4 bg-[var(--bg-primary)] p-4 rounded-2xl border border-[var(--border-primary)] hover:border-violet-400 transition-all shadow-sm">
                            <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${task.completed ? 'bg-violet-500 border-violet-500' : 'border-gray-300'}`}>
                                {task.completed && <CheckIcon className="w-4 h-4 text-white" />}
                            </div>
                            <div className="flex-grow">
                                <h5 className="text-sm font-bold truncate">{task.text}</h5>
                                <p className="text-[10px] text-[var(--text-secondary)] opacity-60 leading-tight line-clamp-1">{task.description || 'No description'}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-[var(--bg-secondary)]/30 rounded-2xl border border-dashed border-[var(--border-primary)]/50 h-full">
                        <div className="p-3 bg-[var(--bg-primary)] rounded-full mb-3 shadow-sm text-violet-300">
                             <TimerIcon className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-40">Schedule Open</p>
                    </div>
                )}
            </div>

            <button 
                onClick={onAddTask}
                className="w-full py-3 rounded-xl border border-dashed border-violet-500 text-violet-600 hover:bg-violet-500/5 transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
            >
                <PlusIcon className="w-4 h-4" /> Add Logic to {viewDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
            </button>
        </div>
    );
};

const MonthlyCalendarView: React.FC<{ 
    viewDate: Date, 
    onDateClick: (date: Date) => void, 
    todos: ToDoItem[],
    onNavigate: (month: number) => void,
    onAddTask: () => void
}> = ({ viewDate, onDateClick, todos, onNavigate, onAddTask }) => {
    const now = new Date();
    const daysInMonth = (m: number, y: number) => new Date(y, m + 1, 0).getDate();
    const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
    
    const days = Array.from({ length: 42 }, (_, i) => {
        const d = i - firstDay + 1;
        return (d > 0 && d <= daysInMonth(viewDate.getMonth(), viewDate.getFullYear())) ? d : null;
    });

    return (
        <div className="flex flex-col h-full bg-[var(--bg-primary)] rounded-[2.5rem] overflow-hidden border border-violet-200/50 shadow-2xl">
            <div className="bg-indigo-950 p-6 text-white">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => onNavigate(-1)} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all"><ChevronLeftIcon className="w-4 h-4" /></button>
                    <h3 className="text-lg font-black uppercase tracking-widest">{viewDate.toLocaleDateString('en-US', { month: 'long' }).toUpperCase()}</h3>
                    <button onClick={() => onNavigate(1)} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all"><ChevronRightIcon className="w-4 h-4" /></button>
                </div>
                <div className="flex justify-between items-end">
                    <div className="space-y-1">
                        <p className="text-xs text-white/50 font-bold uppercase tracking-tighter">Timeline Index</p>
                        <h2 className="text-xl font-black uppercase tracking-tight">Sync Module</h2>
                    </div>
                    <button 
                        onClick={onAddTask}
                        className="p-2.5 rounded-full bg-violet-500 text-white shadow-lg hover:scale-110 active:scale-95 transition-all"
                    >
                        <PlusIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="p-6 flex-grow flex flex-col">
                <div className="grid grid-cols-7 gap-2 text-center mb-4">
                    {['S','M','T','W','T','F','S'].map(d => (
                        <span key={d} className="text-[10px] font-black uppercase text-indigo-900/30">{d}</span>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-y-3 flex-grow">
                    {days.map((day, idx) => {
                        const date = day ? new Date(viewDate.getFullYear(), viewDate.getMonth(), day) : null;
                        const dateStr = date?.toISOString().split('T')[0];
                        const hasTasks = dateStr ? todos.some(t => t.date === dateStr) : false;
                        const isToday = day === now.getDate() && viewDate.getMonth() === now.getMonth();
                        
                        return (
                            <div 
                                key={idx} 
                                onClick={() => date && onDateClick(date)}
                                className={`aspect-square flex items-center justify-center relative transition-all duration-300
                                    ${day ? 'cursor-pointer group' : 'opacity-0'}
                                `}
                            >
                                <div className={`w-10 h-10 flex items-center justify-center rounded-xl font-black text-sm relative z-10
                                    ${hasTasks ? 'bg-violet-400 text-white shadow-lg shadow-violet-400/20' : 'text-indigo-900/80'}
                                    ${isToday ? 'border-2 border-orange-500 text-orange-500 scale-110' : ''}
                                `}>
                                    {day}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ user, todos, pages, onOpenNote, onToggleTodo, onUpdateTodo, onAddTodo, theme, setTheme, onContextMenu, onUploadWallpaper, onCloseDashboard }) => {
    const [stickyNote, setStickyNote] = useState(() => localStorage.getItem('infi-sticky-note') || "Neural patterns stabilized. Ready for deep synchronization.");
    const [showThemeMenu, setShowThemeMenu] = useState(false);
    const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
    const [editingValue, setEditingValue] = useState('');
    const [editingDesc, setEditingDesc] = useState('');
    const [newTodoText, setNewTodoText] = useState('');
    const [newTodoDesc, setNewTodoDesc] = useState('');
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [showQuickAddExpanded, setShowQuickAddExpanded] = useState(false);
    const themeMenuRef = useRef<HTMLDivElement>(null);
    const quickAddInputRef = useRef<HTMLInputElement>(null);
    
    const [layoutOrientation, setLayoutOrientation] = useState<'grid' | 'panoramic'>('panoramic');
    const [calendarStyle, setCalendarStyle] = useState<'weekly' | 'monthly'>('weekly');
    const [viewDate, setViewDate] = useState(new Date());

    useEffect(() => {
        localStorage.setItem('infi-sticky-note', stickyNote);
    }, [stickyNote]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) setShowThemeMenu(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const recentNotes = [...pages].sort((a, b) => parseInt(b.id) - parseInt(a.id)).slice(0, 5);
    const dashboardTodos = [...todos].sort((a, b) => Number(a.completed) - Number(b.completed)).slice(0, 8);
    const completionRate = todos.length > 0 ? Math.round((todos.filter(t => t.completed).length / todos.length) * 100) : 0;
    const pendingCount = todos.filter(t => !t.completed).length;

    const handleStartEdit = (todo: ToDoItem) => {
        setEditingTodoId(todo.id);
        setEditingValue(todo.text);
        setEditingDesc(todo.description || "");
    };

    const handleSaveEdit = (id: string) => {
        if (onUpdateTodo && editingValue.trim()) {
            onUpdateTodo(id, editingValue.trim(), editingDesc.trim());
        }
        setEditingTodoId(null);
    };

    const handleQuickAddTodo = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTodoText.trim() && onAddTodo) {
            onAddTodo(newTodoText.trim(), newTodoDesc.trim(), selectedDate || undefined);
            setNewTodoText('');
            setNewTodoDesc('');
            setSelectedDate(null);
            setShowQuickAddExpanded(false);
        }
    };

    const handleDateClick = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        setSelectedDate(dateStr);
        setViewDate(date);
        setShowQuickAddExpanded(true);
    };

    const handleFocusQuickAdd = () => {
        if (quickAddInputRef.current) {
            quickAddInputRef.current.focus();
            setSelectedDate(viewDate.toISOString().split('T')[0]);
        }
    };

    const navigateMonth = (direction: number) => {
        const d = new Date(viewDate);
        d.setMonth(d.getMonth() + direction);
        setViewDate(d);
    };

    // Color mixing helper for section differentiation
    const sectionColors = {
        habits: 'bg-amber-500/5 dark:bg-amber-900/10 border-amber-500/20 shadow-amber-500/5',
        archives: 'bg-blue-500/5 dark:bg-blue-900/10 border-blue-500/20 shadow-blue-500/5',
        tasks: 'bg-emerald-500/5 dark:bg-emerald-900/10 border-emerald-500/20 shadow-emerald-500/5',
        sync: 'bg-violet-500/5 dark:bg-violet-900/10 border-violet-500/20 shadow-violet-500/5',
        feed: 'bg-rose-500/5 dark:bg-rose-900/10 border-rose-500/20 shadow-rose-500/5'
    };

    return (
        <div className="w-full h-full flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-500 overflow-hidden relative" onContextMenu={onContextMenu}>
            
            <header className="flex-none p-6 md:px-10 flex flex-col md:flex-row justify-between items-center z-20 gap-4 bg-[var(--bg-primary-glass)] backdrop-blur-md border-b border-[var(--border-primary)]/10 animate-[fadeIn_0.5s_ease-out]">
                <div className="flex flex-col gap-1 w-full md:w-auto">
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <div className="w-3 h-10 bg-[var(--accent)] rounded-full"></div>
                        CORE DASHBOARD
                    </h1>
                    <p className="text-[var(--text-secondary)] font-bold text-[10px] opacity-60 uppercase tracking-[0.3em] pl-6">Sector {user.name.split(' ')[0].toUpperCase()} // Unit active</p>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <button 
                        onClick={() => setLayoutOrientation(prev => prev === 'grid' ? 'panoramic' : 'grid')}
                        className="px-5 py-2.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] shadow-sm hover:scale-105 transition-all text-[var(--accent)] flex items-center gap-3 group"
                    >
                        {layoutOrientation === 'grid' ? <ArrowsRightLeftIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" /> : <ListBulletIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">{layoutOrientation === 'grid' ? 'Switch to Panoramic' : 'Switch to Grid'}</span>
                    </button>

                    <div className="relative" ref={themeMenuRef}>
                        <button onClick={() => setShowThemeMenu(!showThemeMenu)} className="p-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] shadow-sm hover:shadow-lg hover:scale-105 transition-all text-[var(--accent)] group">
                            <SwatchIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                        </button>
                        {showThemeMenu && (
                            <div className="absolute top-full right-0 mt-3 z-50 bg-[var(--bg-secondary)]/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-[var(--border-primary)] p-3 flex flex-row gap-3 min-w-max">
                                {Object.keys(THEME_PALETTES).map((t) => (
                                    <button 
                                        key={t} 
                                        onClick={() => { setTheme(t as Theme); setShowThemeMenu(false); }}
                                        className={`flex flex-col items-center gap-2 p-2.5 rounded-xl transition-all duration-300 min-w-[90px] border ${theme === t ? 'bg-[var(--bg-primary)] border-[var(--accent)] shadow-md' : 'bg-transparent border-transparent hover:bg-[var(--bg-primary)]'}`}
                                    >
                                        <div className="relative flex flex-col gap-0.5 w-full">
                                            {THEME_PALETTES[t as Theme].map((color, i) => <div key={i} className="w-full h-1.5 rounded-full" style={{ backgroundColor: color }} />)}
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest">{t}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="flex-grow overflow-hidden relative">
                {layoutOrientation === 'grid' ? (
                    <div className="h-full overflow-y-auto custom-scrollbar p-6 md:p-10">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-7xl mx-auto">
                            {/* Habits Grid Left */}
                            <div className={`lg:col-span-4 h-full flex flex-col p-8 rounded-[2.5rem] border backdrop-blur-xl animate-[popIn_0.6s_ease-out_0.1s_both] ${sectionColors.habits}`}>
                                <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
                                    <SparklesIcon className="w-6 h-6 text-amber-500" /> Habit Flow
                                </h2>
                                <HabitTracker user={user} />
                            </div>

                            {/* Analytics & Progress Center */}
                            <div className={`lg:col-span-4 h-full p-8 rounded-[2.5rem] border backdrop-blur-xl flex flex-col animate-[popIn_0.6s_ease-out_0.2s_both] ${sectionColors.tasks}`}>
                                <h2 className="text-xl font-bold mb-8">Neural Integrity</h2>
                                <div className="flex justify-center mb-10 relative flex-grow">
                                    <div className="relative w-48 h-48 flex items-center justify-center">
                                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                                            <circle cx="96" cy="96" r="86" stroke="currentColor" strokeWidth="8" fill="none" className="text-[var(--border-primary)] opacity-20" />
                                            <circle 
                                                cx="96" cy="96" r="86" stroke="currentColor" strokeWidth="12" fill="none" 
                                                className="text-emerald-500" 
                                                strokeDasharray={540} 
                                                strokeDashoffset={540 - (540 * completionRate) / 100}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div className="p-6 bg-[var(--bg-primary)] rounded-full shadow-2xl border border-[var(--border-primary)]/50 relative z-10 animate-bounce">
                                            <RocketIcon className="w-12 h-12 text-emerald-600" />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    {[
                                        { label: 'Active Protocols', value: `${pendingCount}`, pct: 40, color: 'bg-emerald-500' },
                                        { label: 'Synthesis Rate', value: `${completionRate}%`, pct: completionRate, color: 'bg-emerald-600' },
                                    ].map((stat, idx) => (
                                        <div key={idx} className="flex flex-col gap-2">
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-60">
                                                <span>{stat.label}</span>
                                                <span>{stat.value}</span>
                                            </div>
                                            <div className="h-2 w-full bg-[var(--border-primary)]/30 rounded-full overflow-hidden border border-[var(--border-primary)]/10">
                                                <div className={`h-full ${stat.color} transition-all duration-1000 shadow-[0_0_8px_rgba(16,185,129,0.4)]`} style={{ width: `${stat.pct}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recent Logic Right */}
                            <div className={`lg:col-span-4 p-8 rounded-[2.5rem] border backdrop-blur-xl flex flex-col animate-[popIn_0.6s_ease-out_0.3s_both] ${sectionColors.archives}`}>
                                <h2 className="text-xl font-bold mb-8 flex items-center gap-3"><DocumentTextIcon className="w-6 h-6 text-blue-500" /> Logic Archives</h2>
                                <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2 max-h-[350px]">
                                    {recentNotes.map((note) => (
                                        <div 
                                            key={note.id} 
                                            onClick={() => onOpenNote(note.id)}
                                            className="relative p-5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-primary)] hover:border-blue-500 transition-all cursor-pointer shadow-sm group hover:scale-[1.02] flex items-center gap-4"
                                        >
                                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl transition-colors">
                                                <span className="text-xl">{note.icon || '📄'}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black uppercase tracking-tight truncate max-w-[150px]">{note.title}</span>
                                                <span className="text-[10px] font-bold text-[var(--text-secondary)] opacity-50 uppercase tracking-widest">Protocol Stored</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={onCloseDashboard} className="mt-8 p-5 rounded-2xl border-2 border-dashed border-blue-200 dark:border-blue-800 text-blue-500 hover:bg-blue-500 hover:text-white transition-all font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                                    <BookOpenIcon className="w-5 h-5" /> View Matrix
                                </button>
                            </div>

                            {/* Calendar Row Full */}
                            <div className={`lg:col-span-8 h-full p-8 rounded-[3rem] border backdrop-blur-xl animate-[popIn_0.6s_ease-out_0.4s_both] ${sectionColors.sync}`}>
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-2xl font-black italic uppercase tracking-tighter">Sync Timeline</h2>
                                    <button 
                                        onClick={() => setCalendarStyle(s => s === 'weekly' ? 'monthly' : 'weekly')}
                                        className="px-6 py-2 rounded-full bg-violet-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-violet-500/20 hover:scale-105 transition-all flex items-center gap-3"
                                    >
                                        <ArrowPathIcon className="w-4 h-4" /> Switch Mapping
                                    </button>
                                </div>
                                <div className="h-[400px]">
                                    {calendarStyle === 'weekly' ? (
                                        <WeeklyCalendarView viewDate={viewDate} onDateClick={handleDateClick} todos={todos} onAddTask={handleFocusQuickAdd} />
                                    ) : (
                                        <MonthlyCalendarView viewDate={viewDate} onDateClick={handleDateClick} todos={todos} onNavigate={navigateMonth} onAddTask={handleFocusQuickAdd} />
                                    )}
                                </div>
                            </div>

                            {/* Feedback/Feed Column */}
                            <div className={`lg:col-span-4 flex flex-col gap-6 animate-[popIn_0.6s_ease-out_0.5s_both] ${sectionColors.feed} p-8 rounded-[3rem] border backdrop-blur-xl`}>
                                <h2 className="text-xl font-bold flex items-center gap-3"><MailIcon className="w-6 h-6 text-rose-500" /> Neural Feed</h2>
                                <div className="space-y-4 flex-grow overflow-y-auto custom-scrollbar pr-2 max-h-[300px]">
                                    {MOCK_EMAILS.map(email => (
                                        <div key={email.id} className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-primary)] hover:border-rose-400 transition-all group shadow-sm">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[8px] font-black uppercase text-rose-600">{email.sender}</span>
                                                <span className="text-[8px] font-bold text-[var(--text-secondary)] opacity-40">{email.time}</span>
                                            </div>
                                            <p className="text-[10px] font-black uppercase truncate group-hover:text-rose-600 transition-colors">{email.subject}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-amber-100/40 dark:bg-amber-900/20 border border-amber-200/50 rounded-[2rem] p-6 relative">
                                    <div className="absolute top-4 right-4 text-amber-500/30"><StickyNoteIcon className="w-6 h-6" /></div>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 mb-2">Cognitive Spark</h3>
                                    <textarea value={stickyNote} onChange={e => setStickyNote(e.target.value)} className="w-full bg-transparent resize-none outline-none text-xs font-bold text-amber-900 dark:text-amber-100 h-20 custom-scrollbar" />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-row overflow-x-auto overflow-y-hidden custom-scrollbar px-10 gap-10 items-stretch pb-12 pt-10">
                        {/* Section 1: Habits (Panoramic) */}
                        <section className={`flex-none w-[400px] flex flex-col p-8 rounded-[3rem] border backdrop-blur-xl shadow-2xl animate-[popIn_0.5s_cubic-bezier(0.16,1,0.3,1)_0.1s_both] ${sectionColors.habits}`}>
                             <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-8 flex items-center gap-4">
                                <div className="p-2.5 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-500/30"><SparklesIcon className="w-6 h-6" /></div>
                                Habit Flux
                             </h2>
                             <div className="flex-grow overflow-y-auto custom-scrollbar pr-3">
                                <HabitTracker user={user} />
                             </div>
                        </section>

                        {/* Section 2: Archives (Panoramic) */}
                        <section className={`flex-none w-[450px] flex flex-col p-8 rounded-[3rem] border backdrop-blur-xl shadow-2xl animate-[popIn_0.5s_cubic-bezier(0.16,1,0.3,1)_0.2s_both] ${sectionColors.archives}`}>
                            <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-8 flex items-center gap-4">
                                <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/30"><DocumentTextIcon className="w-6 h-6" /></div>
                                Logic Archives
                            </h2>
                            <div className="space-y-4 overflow-y-auto custom-scrollbar pr-3 flex-grow">
                                {pages.slice(0, 10).map(note => (
                                    <div 
                                        key={note.id} 
                                        onClick={() => onOpenNote(note.id)}
                                        className="p-5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-primary)] hover:border-blue-500 transition-all cursor-pointer group flex items-center gap-4 shadow-sm"
                                    >
                                        <span className="text-2xl group-hover:scale-125 group-hover:rotate-6 transition-transform">{note.icon || '📄'}</span>
                                        <div className="flex flex-col truncate">
                                            <span className="text-xs font-black uppercase truncate tracking-tight">{note.title}</span>
                                            <span className="text-[8px] font-bold text-[var(--text-secondary)] uppercase opacity-50">Protocol ID #{note.id.slice(-4)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Section 3: Tasks (Panoramic) */}
                        <section className={`flex-none w-[420px] flex flex-col p-8 rounded-[3rem] border backdrop-blur-xl shadow-2xl animate-[popIn_0.5s_cubic-bezier(0.16,1,0.3,1)_0.3s_both] ${sectionColors.tasks}`}>
                             <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-8 flex items-center gap-4">
                                <div className="p-2.5 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-500/30"><PlusIcon className="w-6 h-6" /></div>
                                Task Pulse
                             </h2>
                             <div className="space-y-3 overflow-y-auto custom-scrollbar pr-3 flex-grow mb-6">
                                {dashboardTodos.map((todo, i) => (
                                    <div key={todo.id} className="relative group/task-container">
                                        <div className={`p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-primary)] flex items-center gap-4 transition-all ${todo.completed ? 'opacity-40 grayscale' : 'hover:border-emerald-400 shadow-sm'}`}>
                                            <div onClick={() => onToggleTodo(todo.id)} className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center cursor-pointer transition-all ${todo.completed ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'border-[var(--border-primary)]'}`}>
                                                {todo.completed ? <CheckIcon className="w-5 h-5" /> : (i % 2 ? <BriefcaseIcon className="w-4 h-4 opacity-40" /> : <LaptopIcon className="w-4 h-4 opacity-40" />)}
                                            </div>
                                            <div className="flex-grow flex flex-col overflow-hidden">
                                                <span onClick={() => onToggleTodo(todo.id)} className={`text-xs font-black uppercase tracking-tight truncate ${todo.completed ? 'line-through' : ''}`}>{todo.text}</span>
                                                <span className="text-[8px] font-bold text-emerald-600 opacity-50 uppercase tracking-widest">Active Sequence</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                             </div>
                             <form onSubmit={handleQuickAddTodo} className="relative mt-auto">
                                <input ref={quickAddInputRef} value={newTodoText} onChange={e => setNewTodoText(e.target.value)} placeholder="Queue new logic..." className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[1.5rem] px-6 py-5 text-xs font-black uppercase tracking-widest outline-none focus:border-emerald-500 transition-all shadow-xl" />
                                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-emerald-600 text-white rounded-2xl shadow-lg hover:rotate-90 transition-all duration-500"><PlusIcon className="w-5 h-5" /></button>
                             </form>
                        </section>

                        {/* Section 4: Sync (Panoramic) */}
                        <section className={`flex-none w-[400px] flex flex-col p-8 rounded-[3rem] border backdrop-blur-xl shadow-2xl animate-[popIn_0.5s_cubic-bezier(0.16,1,0.3,1)_0.4s_both] ${sectionColors.sync}`}>
                             <div className="flex flex-col h-full gap-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-black italic uppercase tracking-tighter">Sync Module</h2>
                                    <button 
                                        onClick={() => setCalendarStyle(s => s === 'weekly' ? 'monthly' : 'weekly')}
                                        className="p-3 rounded-2xl bg-violet-600 text-white shadow-xl shadow-violet-500/20 hover:scale-110 active:scale-95 transition-all"
                                    ><ArrowPathIcon className="w-5 h-5" /></button>
                                </div>
                                <div className="flex-grow min-h-0">
                                    {calendarStyle === 'weekly' ? (
                                        <WeeklyCalendarView viewDate={viewDate} onDateClick={handleDateClick} todos={todos} onAddTask={handleFocusQuickAdd} />
                                    ) : (
                                        <MonthlyCalendarView viewDate={viewDate} onDateClick={handleDateClick} todos={todos} onNavigate={navigateMonth} onAddTask={handleFocusQuickAdd} />
                                    )}
                                </div>
                                <div className="bg-violet-900/5 border border-violet-500/20 rounded-[2rem] p-6 relative">
                                    <div className="absolute top-4 right-4 text-violet-500/20"><StickyNoteIcon className="w-6 h-6" /></div>
                                    <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-violet-600 mb-2">Timeline Reflection</h3>
                                    <textarea value={stickyNote} onChange={e => setStickyNote(e.target.value)} className="w-full bg-transparent resize-none outline-none text-xs font-bold text-violet-900 dark:text-violet-100 h-24 custom-scrollbar" />
                                </div>
                             </div>
                        </section>

                        {/* Section 5: Messages (Panoramic) */}
                        <section className={`flex-none w-[360px] flex flex-col p-8 rounded-[3rem] border backdrop-blur-xl shadow-2xl animate-[popIn_0.5s_cubic-bezier(0.16,1,0.3,1)_0.5s_both] ${sectionColors.feed}`}>
                            <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-8 flex items-center gap-4">
                                <div className="p-2.5 bg-rose-600 text-white rounded-2xl shadow-lg shadow-rose-500/30"><MailIcon className="w-6 h-6" /></div>
                                Neural Feed
                            </h2>
                            <div className="space-y-6 overflow-y-auto custom-scrollbar pr-3 flex-grow">
                                {MOCK_EMAILS.map(email => (
                                    <div key={email.id} className="p-5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-primary)] hover:border-rose-400 transition-all group shadow-sm hover:translate-x-1">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-[9px] font-black uppercase text-rose-600 tracking-tighter">{email.sender}</span>
                                            <span className="text-[8px] font-bold text-[var(--text-secondary)] opacity-40">{email.time}</span>
                                        </div>
                                        <p className="text-[11px] font-black uppercase truncate text-[var(--text-primary)] group-hover:text-rose-600 transition-colors">{email.subject}</p>
                                    </div>
                                ))}
                                <div className="mt-10 p-6 bg-rose-500 text-white rounded-[2rem] shadow-xl shadow-rose-500/20 relative overflow-hidden group">
                                     <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-700"></div>
                                     <SparklesIcon className="w-8 h-8 mb-4 opacity-80" />
                                     <h4 className="font-black uppercase tracking-tighter mb-1">Weekly Update</h4>
                                     <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Synthesis module optimization complete.</p>
                                </div>
                            </div>
                        </section>
                        
                        <div className="flex-none w-10" />
                    </div>
                )}
            </div>

            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-5 bg-[var(--bg-secondary-glass)] backdrop-blur-xl px-8 py-3.5 rounded-full border border-[var(--border-primary)] shadow-2xl z-[100] animate-[fadeIn_1s_ease-out] ring-1 ring-white/10">
                <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${layoutOrientation === 'grid' ? 'bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.6)]' : 'bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(79,70,229,0.6)]'}`} />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">{layoutOrientation === 'grid' ? 'Grid' : 'Panoramic'} Synchronization Active</span>
                </div>
                <div className="h-4 w-px bg-[var(--border-primary)]/40"></div>
                <span className="text-[9px] font-mono opacity-40 tracking-tighter">SYST_MESH v3.8.4 // ALL SECTORS OPTIMAL</span>
            </div>
        </div>
    );
};

export default Dashboard;
