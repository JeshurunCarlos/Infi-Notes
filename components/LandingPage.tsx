
import React, { useState, useEffect, useRef } from 'react';
import { InfinityIcon, SparklesIcon, LightBulbIcon, TimerIcon, SwatchIcon, PencilIcon, DocumentTextIcon, Squares2X2Icon, HomeIcon, ChevronRightIcon, GlobeIcon, ChatBubbleLeftRightIcon, CloudIcon, RocketIcon, CheckIcon, MagnifyingGlassIcon, LayoutDashboardIcon, WifiIcon, SignalSlashIcon, ClipboardIcon } from './Icons';
import InfinityParticlesAnimation from './InfinityParticlesAnimation';
import { User, Theme } from '../types';

interface LandingPageProps {
  onLogin: () => void;
  onOpenDashboard: () => void;
  onOpenJournal: () => void;
  onOpenWidgets: () => void;
  onOpenThemeSelection: () => void;
  user?: User | null;
  currentTheme: Theme;
  onSetTheme: (theme: Theme) => void;
}

const ScrollReveal: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } }, { threshold: 0.15 });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);
    return <div ref={ref} className={`transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'} ${className}`}>{children}</div>;
};

const FEATURES = [
    { title: "Smart Summary", description: "Gemini AI analyzes your notes, distilling complex information into clear, actionable bullet points instantly.", tag: "AI Insight", icon: <DocumentTextIcon className="w-8 h-8 text-white" /> },
    { title: "Active Recall", description: "Automatically turn your notes into interactive flashcards and quizzes. Stop reading, start mastering.", tag: "Learning", icon: <LightBulbIcon className="w-8 h-8 text-white" /> },
    { title: "Universal Widgets", description: "Embed Spotify, News, Weather, and terminal tools directly into your workspace. Zero distraction dashboard.", tag: "Productivity", icon: <Squares2X2Icon className="w-8 h-8 text-white" /> },
    { title: "Zen Journal", description: "Reflect on your day with an empathetic AI companion that helps guide your thoughts and emotional growth.", tag: "Mindfulness", icon: <PencilIcon className="w-8 h-8 text-white" /> }
];

const EXTENDED_FEATURES = [
    ...FEATURES,
    { title: "Visual Mind Map", description: "Generate interactive knowledge maps from your notes to visualize connections and hierarchies.", tag: "Planning", icon: <RocketIcon className="w-8 h-8 text-white" /> },
    { title: "Adaptive Themes", description: "Seamlessly switch between Matrix, Cyberpunk, and OLED themes designed for focus and aesthetic pleasure.", tag: "Design", icon: <SwatchIcon className="w-8 h-8 text-white" /> },
    { title: "PDF Engine", description: "Search and read millions of PDFs directly from your integrated bookshelf with AI-assisted definitions.", tag: "Research", icon: <GlobeIcon className="w-8 h-8 text-white" /> }
];

const SHOWCASE = [
    {
        title: "Intelligent Editor",
        description: "Experience a beautifully distractions-free writing environment. Our rich-text editor features AI-powered tools like auto-summarization and active-recall quiz generation to maximize your study efficiency.",
        image: "https://images.unsplash.com/photo-1544391439-1df5c3b197b8?auto=format&fit=crop&q=80&w=1200",
        badge: "Core Workspace"
    },
    {
        title: "Dynamic Media Integration",
        description: "Connect your research seamlessly. Side-by-side video embedding and PDF viewing allow you to transcribe and take notes in real-time without ever switching tabs.",
        image: "https://images.unsplash.com/photo-1614332287897-cdc485fa562d?auto=format&fit=crop&q=80&w=1200",
        badge: "Research Tools"
    },
    {
        title: "Personalized Dashboard",
        description: "Customize your environment with modular widgets. From focus timers and local music players to AI chat assistants and world news feeds, build the dashboard that fits your unique workflow.",
        image: "https://images.unsplash.com/photo-1551288049-bbbda5366391?auto=format&fit=crop&q=80&w=1200",
        badge: "Customization"
    }
];

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onOpenDashboard, onOpenJournal, onOpenWidgets, onOpenThemeSelection, user, currentTheme, onSetTheme }) => {
    const [scrollProgress, setScrollProgress] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const [showJapanese, setShowJapanese] = useState(false);
    const [hostAddress, setHostAddress] = useState("");
    const [showNetworkModal, setShowNetworkModal] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => setShowJapanese(prev => !prev), 4000); 
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Detect current hosting address
        const protocol = window.location.protocol;
        const host = window.location.host; // includes port
        setHostAddress(`${protocol}//${host}`);
    }, []);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setScrollProgress(Math.min(e.currentTarget.scrollTop / 800, 1));
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(hostAddress);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div 
            ref={containerRef}
            className="h-screen w-full text-[var(--text-primary)] relative bg-[var(--bg-primary)] overflow-y-auto custom-scrollbar scroll-smooth" 
            onScroll={handleScroll}
        >
            {/* Network Access Floating Instruction Modal */}
            {showNetworkModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-[fadeIn_0.3s_ease-out]">
                    <div className="w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[2rem] shadow-2xl p-8 animate-[popIn_0.4s_cubic-bezier(0.16,1,0.3,1)]">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[var(--accent)] text-white rounded-lg"><WifiIcon className="w-5 h-5" /></div>
                                <h3 className="font-black uppercase tracking-widest text-sm">Local Broadcast</h3>
                            </div>
                            <button onClick={() => setShowNetworkModal(false)} className="p-2 hover:bg-[var(--bg-primary)] rounded-full transition-colors"><CheckIcon className="w-5 h-5" /></button>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed font-medium">
                            To access this Infi-Notes session from another device on the same Wi-Fi, enter the following address in its browser:
                        </p>
                        <div className="bg-[var(--bg-primary)] p-4 rounded-xl border border-[var(--border-primary)] mb-6 flex items-center justify-between group">
                            <code className="text-[var(--accent)] font-mono font-bold">{hostAddress}</code>
                            <button onClick={copyToClipboard} className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-all">
                                {copied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <ClipboardIcon className="w-4 h-4 text-[var(--text-secondary)]" />}
                            </button>
                        </div>
                        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                                <SparklesIcon className="w-4 h-4 text-amber-500" />
                                <span className="text-[10px] font-black uppercase text-amber-600">Developer Note</span>
                            </div>
                            <p className="text-[10px] text-amber-700 font-medium leading-tight">
                                If you see "localhost", you need to find your machine's Private IP (e.g. 192.168.1.5) via your OS settings and use that followed by :5173.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Global Dynamic Background System */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                {/* Hero Background Image - ATTACHED GREEN LANDSCAPE */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <img 
                        src="https://storage.googleapis.com/download/storage/v1/b/hq-user-image-service-dev-0001/o/user-image-38435d08-2780-496e-b302-3c22409893d9.png?alt=media" 
                        alt="Background Landscape" 
                        className="w-full h-full object-cover animate-hero-bg-entrance origin-bottom scale-110"
                    />
                    {/* Atmospheric overlays */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-primary)]/30 via-transparent to-[var(--bg-primary)]/90" />
                    <div className="absolute inset-0 bg-[var(--bg-primary)]/5 backdrop-blur-[1px]" />
                </div>
                
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `linear-gradient(var(--text-secondary) 1px, transparent 1px), linear-gradient(90deg, var(--text-secondary) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--bg-primary)_100%)] opacity-40" />
            </div>

            {/* Header / Navigation */}
            <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 px-6 py-4 flex justify-between items-center ${scrollProgress > 0.05 ? 'bg-[var(--bg-primary-glass)] backdrop-blur-md shadow-sm border-b border-[var(--border-primary)]/30' : ''}`}>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[var(--accent)] rounded-xl shadow-lg shadow-[var(--accent)]/20">
                        <InfinityIcon className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-xl font-black tracking-tighter uppercase">Infi-Notes</span>
                </div>
                
                <div className="flex items-center gap-4">
                    {/* Live Network Badge */}
                    <button 
                        onClick={() => setShowNetworkModal(true)}
                        className="hidden md:flex items-center gap-3 px-4 py-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--accent)] transition-all group"
                    >
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Broadcast Active</span>
                        <div className="h-4 w-px bg-[var(--border-primary)]"></div>
                        <span className="text-[10px] font-mono text-[var(--accent)] font-bold">{window.location.hostname === 'localhost' ? 'LCL-HOST' : window.location.hostname}</span>
                    </button>

                    <button 
                        onClick={onOpenThemeSelection}
                        className={`p-2.5 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 hover:scale-105 transition-all shadow-sm flex items-center justify-center gap-2`}
                    >
                        <SwatchIcon className="w-5 h-5" />
                        <span className="hidden sm:inline text-xs font-bold uppercase tracking-wide">Themes</span>
                    </button>

                    {user ? (
                        <button onClick={onLogin} className="flex items-center gap-3 pl-2 pr-5 py-1.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--accent)] transition-all group">
                            <img src={user.avatar} className="w-8 h-8 rounded-full border border-white/50" alt="" />
                            <span className="text-sm font-bold truncate max-w-[100px]">{user.name.split(' ')[0]}</span>
                        </button>
                    ) : (
                        <button onClick={onLogin} className="px-6 py-2 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-full font-bold text-sm hover:opacity-90 transition-all shadow-md">Sign In</button>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <header className="relative min-h-[90vh] flex items-center pt-24 pb-12 px-6 overflow-hidden">
                {/* Content Hub */}
                <div className="relative z-10 max-w-7xl mx-auto w-full flex flex-col items-center text-center space-y-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] text-xs font-black uppercase tracking-widest animate-[popIn_0.6s_ease-out] backdrop-blur-md shadow-sm">
                        <SparklesIcon className="w-3.5 h-3.5" />
                        Next-Gen Productivity Platform
                    </div>
                    
                    <div className="text-4xl md:text-6xl font-bold tracking-tight leading-tight drop-shadow-md select-none h-[1.3em] relative w-full flex justify-center items-center overflow-hidden">
                        <div className={`absolute transition-all duration-[1200ms] ease-[cubic-bezier(0.19,1,0.22,1)] flex items-center justify-center bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-primary)] via-[var(--accent)] to-[var(--text-primary)] bg-[length:200%_auto] animate-[gradient-move_5s_linear_infinite] whitespace-nowrap ${!showJapanese ? 'opacity-100 translate-y-0 filter-none scale-100' : 'opacity-0 -translate-y-12 blur-sm scale-95'}`}>
                            Don't Limit Yourself
                        </div>
                        <div className={`absolute transition-all duration-[1200ms] ease-[cubic-bezier(0.19,1,0.22,1)] flex items-center justify-center bg-clip-text text-transparent bg-gradient-to-r from-[var(--accent)] via-[var(--success)] to-[var(--accent)] bg-[length:200%_auto] animate-[gradient-move_5s_linear_infinite] whitespace-nowrap ${showJapanese ? 'opacity-100 translate-y-0 filter-none scale-100' : 'opacity-0 translate-y-12 blur-sm scale-95'}`}>
                            自分を制限しない
                        </div>
                    </div>
                    
                    <p className="max-w-3xl text-xl md:text-2xl text-[var(--text-secondary)] font-bold leading-relaxed animate-[fadeIn_1s_ease-out_0.5s_both] px-6 py-2 bg-[var(--bg-primary-glass)]/60 backdrop-blur-md rounded-xl shadow-lg border border-white/20">
                        A unified AI workspace for deep work. Master any subject with integrated smart tools, transcription, and interactive active recall.
                    </p>

                    {/* Network Broadcast Terminal */}
                    <div className="relative group animate-[popIn_0.8s_ease-out_0.6s_both]">
                        <div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent)] to-[var(--success)] rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                        <div className="relative bg-[var(--bg-secondary)]/90 border border-[var(--border-primary)] rounded-2xl p-4 flex flex-col md:flex-row items-center gap-6 shadow-2xl backdrop-blur-xl">
                             <div className="flex items-center gap-3">
                                 <div className="relative flex items-center justify-center">
                                     <div className="absolute w-8 h-8 bg-emerald-500/20 rounded-full animate-ping"></div>
                                     <div className="relative p-2 bg-emerald-500 rounded-lg text-white shadow-lg shadow-emerald-500/20">
                                         <WifiIcon className="w-5 h-5" />
                                     </div>
                                 </div>
                                 <div className="text-left">
                                     <span className="text-[9px] font-black uppercase text-[var(--text-secondary)] tracking-widest block opacity-60 leading-none mb-1">Local Network Protocol</span>
                                     <code className="text-sm font-bold text-[var(--accent)] font-mono">{hostAddress}</code>
                                 </div>
                             </div>
                             <div className="h-8 w-px bg-[var(--border-primary)] hidden md:block"></div>
                             <button 
                                onClick={() => setShowNetworkModal(true)}
                                className="px-5 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-primary)] hover:border-[var(--accent)] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:shadow-xl btn-press"
                             >
                                 Share Workspace
                             </button>
                        </div>
                    </div>
                    
                    {/* Action Buttons Hub */}
                    <div className="flex flex-col items-center gap-4 animate-[popIn_0.8s_cubic-bezier(0.16,1,0.3,1)_0.8s_both] w-full max-w-2xl">
                        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 w-full">
                            <button onClick={onLogin} className="group w-full sm:w-auto px-10 py-4 bg-[var(--accent)] text-white rounded-2xl font-black text-xl shadow-2xl shadow-[var(--accent)]/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 border border-white/20 backdrop-blur-md">
                                <span>Launch Workspace</span>
                                <ChevronRightIcon className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                            </button>
                            <button onClick={onOpenDashboard} className="group w-full sm:w-auto px-6 py-4 bg-[var(--bg-secondary)]/90 backdrop-blur-md text-[var(--text-primary)] rounded-2xl font-bold text-lg border border-[var(--border-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] hover:shadow-xl transition-all flex items-center justify-center gap-3">
                                <LayoutDashboardIcon className="w-5 h-5" />
                                <span>Dashboard</span>
                            </button>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 w-full">
                            <button onClick={onOpenJournal} className="group w-full sm:w-auto px-6 py-4 bg-emerald-500/10 backdrop-blur-md text-emerald-600 rounded-2xl font-bold text-lg border border-emerald-500/20 hover:bg-emerald-500 hover:text-white hover:shadow-xl transition-all flex items-center justify-center gap-3">
                                <PencilIcon className="w-5 h-5" />
                                <span>Neural Journal</span>
                            </button>
                            <button onClick={onOpenThemeSelection} className="group w-full sm:w-auto px-6 py-4 bg-orange-500/10 backdrop-blur-md text-orange-600 rounded-2xl font-bold text-lg border border-orange-500/20 hover:bg-orange-500 hover:text-white hover:shadow-xl transition-all flex items-center justify-center gap-3">
                                <SwatchIcon className="w-5 h-5" />
                                <span>Theme Palette</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Decorative Elements Overlay */}
                <div className="absolute bottom-0 left-0 z-20 pointer-events-none animate-[corner-enter_1s_cubic-bezier(0.16,1,0.3,1)_1.2s_both] w-64 h-64 flex items-center justify-center text-rose-500/20">
                    <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Spiral%20Notepad.png" alt="" className="absolute w-48 h-48 object-contain drop-shadow-2xl transform -rotate-12 translate-y-4 translate-x-[-10px]" />
                    <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Pencil.png" alt="" className="absolute w-32 h-32 object-contain drop-shadow-xl transform rotate-45 translate-x-12 translate-y-[-20px]" />
                </div>
                <div className="absolute bottom-0 right-0 z-20 pointer-events-none animate-[corner-enter-right_1s_cubic-bezier(0.16,1,0.3,1)_1.2s_both] w-64 h-64 flex items-center justify-center text-indigo-500/20">
                    <img src="https://cdn3d.iconscout.com/3d/free/thumb/free-youtube-2993437-2492683.png" alt="" className="absolute w-48 h-48 object-contain drop-shadow-2xl transform rotate-[45deg]" />
                </div>
            </header>

            {/* Horizontal Feature Marquee */}
            <section className="relative w-full py-12 bg-[var(--bg-secondary)]/60 backdrop-blur-2xl border-y border-[var(--border-primary)]/30 overflow-hidden flex flex-col gap-6 z-10">
                <div className="flex items-center gap-3 px-12">
                    <div className="w-10 h-0.5 bg-[var(--accent)] rounded-full"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--text-secondary)] opacity-60">Master Capabilities</span>
                </div>
                <div className="flex w-full overflow-hidden">
                    <div className="flex gap-6 animate-marquee whitespace-nowrap py-4 pr-6">
                        {[...EXTENDED_FEATURES, ...EXTENDED_FEATURES].map((f, i) => (
                            <div key={i} className="inline-flex items-center gap-6 px-8 py-6 rounded-3xl bg-[var(--bg-primary-glass)] backdrop-blur-xl border border-[var(--border-primary)]/50 shadow-lg hover:border-[var(--accent)] transition-all hover:-translate-y-1 cursor-default group" style={{ minWidth: '380px' }}>
                                <div className="p-4 bg-[var(--accent)] rounded-2xl shadow-xl group-hover:scale-110 transition-transform duration-500">{f.icon}</div>
                                <div className="flex flex-col gap-1 overflow-hidden">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-black tracking-tight">{f.title}</span>
                                        <span className="text-[8px] font-black uppercase tracking-widest text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-0.5 rounded">{f.tag}</span>
                                    </div>
                                    <p className="text-[var(--text-secondary)] text-xs font-medium whitespace-normal leading-relaxed line-clamp-2">{f.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Showcase Section */}
            <section className="relative z-10 py-32 px-6 bg-[var(--bg-secondary)]/70 backdrop-blur-xl border-b border-[var(--border-primary)]/20">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-24">
                        <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 uppercase drop-shadow-sm">Experience Flow</h2>
                        <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto font-bold leading-relaxed">We've re-imagined the note-taking experience from the ground up, placing intelligence and focus at the heart of every interaction.</p>
                        <div className="w-32 h-2 bg-[var(--accent)] mx-auto rounded-full mt-10"></div>
                    </div>
                    <div className="space-y-40">
                        {SHOWCASE.map((item, i) => (
                            <ScrollReveal key={i} className={`flex flex-col ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-20`}>
                                <div className="flex-1 space-y-8">
                                    <span className="inline-block px-5 py-2 bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-black uppercase tracking-[0.2em] rounded-xl border border-[var(--accent)]/20 shadow-sm">{item.badge}</span>
                                    <h3 className="text-5xl font-black tracking-tighter leading-none uppercase">{item.title}</h3>
                                    <p className="text-xl text-[var(--text-secondary)] font-bold leading-relaxed">{item.description}</p>
                                    <div className="flex items-center gap-6 pt-4">
                                        <button onClick={onLogin} className="flex items-center gap-3 text-lg font-black text-[var(--accent)] group uppercase tracking-widest">
                                            <span>Initialize Unit</span>
                                            <ChevronRightIcon className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 w-full relative">
                                    <div className="relative group perspective-1000">
                                        <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[2.5rem] shadow-2xl overflow-hidden transform group-hover:rotate-y-[-5deg] transition-all duration-700 ease-[cubic-bezier(0.2,1,0.3,1)]">
                                            <div className="h-12 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] flex items-center px-6 gap-3">
                                                <div className="flex gap-2">
                                                    <div className="w-3.5 h-3.5 rounded-full bg-[#FF5F57]" />
                                                    <div className="w-3.5 h-3.5 rounded-full bg-[#FFBD2E]" />
                                                    <div className="w-3.5 h-3.5 rounded-full bg-[#28C840]" />
                                                </div>
                                                <div className="flex-grow flex justify-center"><div className="w-1/2 h-6 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-primary)]/50" /></div>
                                            </div>
                                            <img src={item.image} alt={item.title} className="w-full h-auto object-cover aspect-video grayscale-[30%] group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105" />
                                        </div>
                                        <div className="absolute -inset-10 bg-gradient-to-tr from-[var(--accent)]/20 via-transparent to-[var(--success)]/10 blur-[80px] -z-10 rounded-full group-hover:opacity-100 transition-opacity opacity-50" />
                                    </div>
                                </div>
                            </ScrollReveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 bg-[var(--bg-secondary)] border-t border-[var(--border-primary)]/30 pt-32 pb-16 px-10">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20 mb-24">
                        <div className="space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-[var(--accent)] rounded-xl shadow-xl shadow-[var(--accent)]/20">
                                    <InfinityIcon className="w-8 h-8 text-white" />
                                </div>
                                <span className="text-2xl font-black tracking-tighter uppercase">Infi-Notes</span>
                            </div>
                            <p className="text-base text-[var(--text-secondary)] font-bold leading-relaxed">Empowering high-performance minds through intelligent workspace architecture and generative AI synthesis.</p>
                            <div className="flex gap-6">
                                <a href="#" className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-all hover:scale-110"><GlobeIcon className="w-6 h-6" /></a>
                                <a href="#" className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-all hover:scale-110"><ChatBubbleLeftRightIcon className="w-6 h-6" /></a>
                                <a href="#" className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-all hover:scale-110"><CloudIcon className="w-6 h-6" /></a>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-black uppercase tracking-[0.3em] text-[10px] mb-10 opacity-40">Repositories</h4>
                            <ul className="space-y-5 text-sm font-bold text-[var(--text-secondary)]">
                                <li><button onClick={onOpenJournal} className="hover:text-[var(--accent)] transition-all hover:translate-x-1 flex items-center gap-2"><span>Neural Journal</span></button></li>
                                <li><button onClick={onOpenWidgets} className="hover:text-[var(--accent)] transition-all hover:translate-x-1 flex items-center gap-2"><span>Widget Hub</span></button></li>
                                <li><button className="hover:text-[var(--accent)] transition-all hover:translate-x-1 flex items-center gap-2"><span>Protocol Assets</span></button></li>
                                <li><button className="hover:text-[var(--accent)] transition-all hover:translate-x-1 flex items-center gap-2"><span>Integrations</span></button></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-black uppercase tracking-[0.3em] text-[10px] mb-10 opacity-40">Documentation</h4>
                            <ul className="space-y-5 text-sm font-bold text-[var(--text-secondary)]">
                                <li><a href="#" className="hover:text-[var(--accent)] transition-all hover:translate-x-1 flex items-center gap-2"><span>System Architecture</span></a></li>
                                <li><a href="#" className="hover:text-[var(--accent)] transition-all hover:translate-x-1 flex items-center gap-2"><span>Privacy Guard</span></a></li>
                                <li><a href="#" className="hover:text-[var(--accent)] transition-all hover:translate-x-1 flex items-center gap-2"><span>Legal Terms</span></a></li>
                                <li><a href="#" className="hover:text-[var(--accent)] transition-all hover:translate-x-1 flex items-center gap-2"><span>Cyber Security</span></a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-black uppercase tracking-[0.3em] text-[10px] mb-10 opacity-40">Terminal Status</h4>
                            <div className="bg-[var(--bg-primary)] p-6 rounded-3xl border border-[var(--border-primary)]/50 shadow-2xl backdrop-blur-md">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50"></div>
                                    <span className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">System Integrity</span>
                                </div>
                                <div className="text-[11px] font-bold text-[var(--text-secondary)] space-y-3 font-mono">
                                    <div className="flex justify-between"><span>NET MESH</span><span className="text-emerald-500">{window.location.hostname === 'localhost' ? 'LOCAL' : 'REMOTE'}</span></div>
                                    <div className="flex justify-between"><span>GEMINI CORE</span><span className="text-emerald-500">OPTIMAL</span></div>
                                    <div className="flex justify-between"><span>LATENCY</span><span className="text-emerald-500">14MS</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-[var(--border-primary)]/20 pt-16 flex flex-col md:flex-row justify-between items-center gap-10">
                        <div className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-[0.3em] opacity-40">&copy; {new Date().getFullYear()} INFI-NOTES PROTOCOL // ALL PERMISSIONS GRANTED</div>
                        <div className="flex items-center gap-3 text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.4em]">DESIGNED BY <SparklesIcon className="w-4 h-4 text-[var(--accent)] animate-pulse" /> INFI-LABS</div>
                    </div>
                </div>
            </footer>
        </div>
    );
};
export default LandingPage;
