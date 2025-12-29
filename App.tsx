
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ThemeIcon, FocusIcon, DocumentTextIcon, LogoutIcon, ChevronDownIcon, ArrowsRightLeftIcon, Squares2X2Icon, HomeIcon, LibraryIcon, EyeSlashIcon, EyeIcon, LightBulbIcon, SparklesIcon, HotDogMenuIcon, PlusIcon, CheckIcon, PencilIcon, WifiIcon, SignalSlashIcon, ChevronLeftIcon, SwatchIcon, ImageIcon, NoSymbolIcon, TrashIcon, LayoutDashboardIcon, CogIcon } from './components/Icons';
import Notebook from './components/Notebook';
import MediaPanel from './components/MediaPanel';
import NotebookShelf from './components/NotebookShelf';
import { generateHighlightedSummary, generateQuizFromNotes } from './lib/ai';
import SummaryView from './components/SummaryView';
import Clock from './components/Clock';
import Sidebar from './components/Sidebar';
import PdfViewer, { PdfFile } from './components/PdfViewer';
import SettingsModal from './components/SettingsModal';
import { User, Theme, WidgetType, WidgetState, ToDoItem, NotePage, FloatingWidget } from './types';
import { GlobalBackgroundAnimation } from './components/GlobalBackgroundAnimation';
import QuizView, { Question } from './components/QuizView';
import ContextMenu, { ContextMenuItem } from './components/ContextMenu';
import Dashboard from './components/Dashboard';

const PAGES_STORAGE_KEY_BASE = 'zen-notes-pages-v2';
const WALLPAPER_STORAGE_KEY = 'infi-notes-global-wallpaper';

const THEME_PALETTES: Record<Theme, string[]> = {
    'light': ['#ffffff', '#f1f5f9', '#2563eb', '#020617'],
    'paper': ['#fcfaf2', '#f0ede1', '#2c3e50', '#1a1a1a'],
    'pitch-black': ['#000000', '#1a1a1a', '#00BFFF', '#f0f0f0'],
    'matrix': ['#000500', '#001a00', '#22c55e', '#4ade80'],
    'cyberpunk': ['#050505', '#0f0f13', '#ffee00', '#00f3ff'],
    'monokai': ['#272822', '#3E3D32', '#FF6188', '#F8F8F2'],
    'frosty': ['#f0f9ff', '#e0f2fe', '#38bdf8', '#0284c7'],
};

function stripHtml(html: string): string {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
}

interface AppProps {
  // Added key property to satisfy stricter type checks in some environments
  key?: React.Key;
  user: User;
  onLogout: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  onOpenWidgets: () => void;
  onOpenJournal: () => void;
  onGoHome: () => void;
  onUpdateUser: (user: User) => void;
  initialShowDashboard?: boolean;
  layoutMode: 'modern' | 'classic';
  onLayoutChange: (mode: 'modern' | 'classic') => void;
}

function App({ user, onLogout, theme, setTheme, onOpenWidgets, onOpenJournal, onGoHome, onUpdateUser, initialShowDashboard = true, layoutMode, onLayoutChange }: AppProps) {
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryContent, setSummaryContent] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const [videoId, setVideoId] = useState<string | null>('dQw4w9WgXcQ');
  const [brightness, setBrightness] = useState(100);
  const [widgets, setWidgets] = useState<WidgetState[]>([
    { type: 'empty' }, { type: 'empty' }, { type: 'empty' },
  ]);
  const [floatingWidgets, setFloatingWidgets] = useState<FloatingWidget[]>([]);
  const [activeWidgetIndex, setActiveWidgetIndex] = useState<number | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<Question[] | null>(null);
  const [pages, setPages] = useState<NotePage[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [backgroundAnimation, setBackgroundAnimation] = useState<string>('none');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isZenMode, setIsZenMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  
  // Section Visibility States
  const [notebookVisible, setNotebookVisible] = useState(true);
  const [videoVisible, setVideoVisible] = useState(true);
  const [widgetsVisible, setWidgetsVisible] = useState(true);
  
  // Added missing isHoveringWidget state required by MediaPanel and section styling
  const [isHoveringWidget, setIsHoveringWidget] = useState(false);
  
  const [pdfLibrary, setPdfLibrary] = useState<PdfFile[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [wallpaperUrl, setWallpaperUrl] = useState<string | null>(() => localStorage.getItem(WALLPAPER_STORAGE_KEY));
  const [hideHeader, setHideHeader] = useState(() => localStorage.getItem('infi-hide-header') === 'true');
  
  const [animStage, setAnimStage] = useState(0);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);
  
  // Sync dashboard state with prop to handle landing page navigation correctly
  const [showDashboard, setShowDashboard] = useState(initialShowDashboard);

  useEffect(() => {
    setShowDashboard(initialShowDashboard);
  }, [initialShowDashboard]);

  const wallpaperInputRef = useRef<HTMLInputElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const activePage = pages.find(p => p.id === activePageId);
  const notes = activePage ? activePage.content : '';
  const PAGES_STORAGE_KEY = `${PAGES_STORAGE_KEY_BASE}-${user.id}`;
  const [isShelfVisible, setIsShelfVisible] = useState(true);

  const tagsMap = useMemo(() => {
    const map = new Map<string, number>();
    pages.forEach(p => p.tags?.forEach(t => map.set(t, (map.get(t) || 0) + 1)));
    return map;
  }, [pages]);

  const allTodos = useMemo(() => {
      return pages.flatMap(p => p.todos || []);
  }, [pages]);

  // Restore Background Animations based on Theme
  useEffect(() => {
    if (theme === 'matrix') setBackgroundAnimation('matrixRain');
    else if (theme === 'cyberpunk') setBackgroundAnimation('gridStrobe');
    else if (theme === 'monokai') setBackgroundAnimation('floatingTiles');
    else if (theme === 'frosty') setBackgroundAnimation('fallingLeaves');
    else if (theme === 'pitch-black') setBackgroundAnimation('pulsingDots');
    else setBackgroundAnimation('none');
  }, [theme]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
      const t1 = setTimeout(() => setAnimStage(1), 100);
      const t2 = setTimeout(() => setAnimStage(2), 600);
      const t3 = setTimeout(() => setAnimStage(3), 1200);
      const t4 = setTimeout(() => setAnimStage(4), 2200);
      const t5 = setTimeout(() => setAnimStage(5), 3000); 
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
  }, []);

  useEffect(() => {
    if (wallpaperUrl) {
        localStorage.setItem(WALLPAPER_STORAGE_KEY, wallpaperUrl);
        document.documentElement.classList.add('has-wallpaper');
    } else {
        localStorage.removeItem(WALLPAPER_STORAGE_KEY);
        document.documentElement.classList.remove('has-wallpaper');
    }
  }, [wallpaperUrl]);

  useEffect(() => {
      localStorage.setItem('infi-hide-header', String(hideHeader));
  }, [hideHeader]);

  useEffect(() => {
    const savedPages = localStorage.getItem(PAGES_STORAGE_KEY);
    if (savedPages) {
        const parsed = JSON.parse(savedPages);
        setPages(parsed);
        if (parsed.length > 0 && !activePageId) {
            setActivePageId(parsed[0].id);
        }
    } else {
        handleAddNewPage();
    }
  }, [PAGES_STORAGE_KEY]);

  useEffect(() => { localStorage.setItem(PAGES_STORAGE_KEY, JSON.stringify(pages)); }, [pages, PAGES_STORAGE_KEY]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
            setShowThemeMenu(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddNewPage = (parentId: string | null = null, isFolder = false) => {
    const newPage: NotePage = {
        id: Date.now().toString(),
        title: isFolder ? 'New Folder' : 'Untitled Note',
        content: '<p><br></p>',
        parentId, order: pages.length, todos: [], isFolder, icon: isFolder ? '📁' : '📄', tags: []
    };
    setPages(prev => [...prev, newPage]);
    if (!parentId) {
        setActivePageId(newPage.id);
        setIsShelfVisible(false);
        setShowDashboard(false);
    }
  };

  const handleOpenNotebook = (id: string) => {
    setActivePageId(id);
    setIsShelfVisible(false);
    setShowDashboard(false);
  };

  const handleSummarize = async () => {
    if (!isOnline) return;
    const text = stripHtml(notes);
    if (!text.trim()) return;
    setIsSummarizing(true);
    try {
        const res = await generateHighlightedSummary(text);
        setSummaryContent(res);
    } catch (e) { console.error(e); } finally { setIsSummarizing(false); }
  };

  const handleStartRecall = async () => {
    if (!isOnline) return;
    const text = stripHtml(notes);
    if (!text || text.trim().length < 10) return;
    setIsGeneratingQuiz(true);
    try {
        const res = await generateQuizFromNotes(text);
        if (res && res.length > 0) setQuizQuestions(res);
    } finally { setIsGeneratingQuiz(false); }
  };

  const handleToggleTodo = (id: string) => {
      setPages(prev => prev.map(page => {
          const todoIndex = page.todos?.findIndex(t => t.id === id);
          if (todoIndex !== undefined && todoIndex > -1) {
              const newTodos = [...(page.todos || [])];
              newTodos[todoIndex] = { ...newTodos[todoIndex], completed: !newTodos[todoIndex].completed };
              return { ...page, todos: newTodos };
          }
          return page;
      }));
  };

  const handleUpdateTodo = (id: string, text: string, description?: string) => {
      setPages(prev => prev.map(page => {
          const todoIndex = page.todos?.findIndex(t => t.id === id);
          if (todoIndex !== undefined && todoIndex > -1) {
              const newTodos = [...(page.todos || [])];
              newTodos[todoIndex] = { ...newTodos[todoIndex], text, description: description !== undefined ? description : newTodos[todoIndex].description };
              return { ...page, todos: newTodos };
          }
          return page;
      }));
  };

  const handleAddTodo = (text: string, description?: string, date?: string) => {
      const targetPageId = activePageId || (pages.length > 0 ? pages[0].id : null);
      if (!targetPageId) return;

      const newTodo: ToDoItem = {
          id: Date.now().toString(),
          text,
          description: description || "",
          completed: false,
          status: 'todo',
          date: date
      };

      setPages(prev => prev.map(page => {
          if (page.id === targetPageId) {
              return { ...page, todos: [...(page.todos || []), newTodo] };
          }
          return page;
      }));
  };

  const handleContextMenu = useCallback((e: React.MouseEvent, type: 'video-section' | 'widget-section' | 'specific-widget' | 'notebook' | 'default', index?: number) => {
      e.preventDefault();
      e.stopPropagation();
      const items: ContextMenuItem[] = [];
      if (type === 'notebook') {
          items.push({ label: 'Smart Summary', icon: <SparklesIcon />, action: handleSummarize });
          items.push({ label: 'Active Recall', icon: <LightBulbIcon />, action: handleStartRecall });
          items.push({ separator: true });
          items.push({ label: 'Focus Mode', icon: <FocusIcon />, action: () => setIsZenMode(!isZenMode) });
      }
      
      // Hide Toggle Sidebar menu item if in dashboard
      if (!showDashboard) {
        items.push({ label: 'Toggle Sidebar', icon: <HotDogMenuIcon />, action: () => setIsSidebarOpen(!isSidebarOpen) });
      }
      
      items.push({ label: 'Dashboard', icon: <LayoutDashboardIcon />, action: () => setShowDashboard(true) });
      items.push({ label: 'Home', icon: <HomeIcon />, action: onGoHome });
      setContextMenu({ x: e.clientX, y: e.clientY, items });
  }, [activePageId, widgets, isZenMode, isSidebarOpen, onGoHome, showDashboard]);

  const isModern = layoutMode === 'modern';

  const containerClasses = isModern ? 'p-3 gap-3' : 'p-0 gap-0';
  const sidebarContainerClasses = isModern 
    ? 'rounded-3xl border border-[var(--border-primary)]/10 bg-[var(--bg-secondary)]/30 backdrop-blur-sm'
    : 'rounded-none border-r border-[var(--border-primary)]/20 bg-[var(--bg-secondary)]/30 backdrop-blur-sm';
  
  const notebookContainerClasses = isModern
    ? 'rounded-3xl border border-[var(--border-primary)]/10 bg-[var(--bg-primary)]/50 backdrop-blur-sm'
    : 'rounded-none border-r border-[var(--border-primary)]/10 bg-[var(--bg-primary)]/50 backdrop-blur-sm';

  const mediaPanelContainerClasses = isModern
    ? `rounded-3xl bg-transparent` // Modern mode delegates rounded corners to inner MediaPanel components
    : `rounded-none border-none bg-[var(--bg-secondary)]/10 border-l border-[var(--border-primary)]/10`;

  return (
    <div className={`h-screen w-full flex flex-col transition-all overflow-hidden relative ${wallpaperUrl ? 'text-white' : 'bg-[var(--bg-primary)] text-[var(--text-primary)]'}`} onContextMenu={(e) => { if (!contextMenu) handleContextMenu(e, 'default'); }}>
       <GlobalBackgroundAnimation animationType={backgroundAnimation} />
       {wallpaperUrl && (
           <>
               <div className="fixed inset-0 z-[-2] bg-cover bg-center" style={{ backgroundImage: `url(${wallpaperUrl})` }} />
               <div className="fixed inset-0 z-[-2] bg-black/40 backdrop-blur-[2px]" />
           </>
       )}
       <input type="file" ref={wallpaperInputRef} className="hidden" accept="image/*" onChange={(e) => {
          if (e.target.files?.[0]) {
              const reader = new FileReader();
              reader.onload = (event) => setWallpaperUrl(event.target?.result as string);
              reader.readAsDataURL(e.target.files[0]);
          }
       }} />

       <div className={`${hideHeader ? 'fixed top-0 left-0 right-0 z-50 group' : 'flex-none relative z-50'}`}>
           {hideHeader && <div className="h-4 w-full absolute top-0 left-0 bg-transparent z-50 cursor-default" />}
           <header className={`grid grid-cols-3 items-center p-4 h-[80px] transition-all duration-300 ${wallpaperUrl ? 'bg-black/30 border-white/10 backdrop-blur-md shadow-lg' : 'bg-[var(--bg-primary)]/50 backdrop-blur-md border-[var(--border-primary)]/10'} ${hideHeader ? 'transform -translate-y-full group-hover:translate-y-0 border-b opacity-0 group-hover:opacity-100' : 'border-b opacity-100 translate-y-0'}`}>
               <div className="flex items-center gap-4">
                   {/* Conditionally hide sidebar toggle in dashboard */}
                   {!showDashboard && (
                       <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-full hover:bg-[var(--bg-secondary)] transition-colors"><HotDogMenuIcon className="w-5 h-5" /></button>
                   )}
                   <button onClick={() => setShowDashboard(true)} className="p-2 rounded-full hover:bg-[var(--bg-secondary)] transition-colors" title="Dashboard"><LayoutDashboardIcon className="w-5 h-5"/></button>
                   <button onClick={onGoHome} className="p-2 rounded-full hover:bg-[var(--bg-secondary)] transition-colors text-[var(--accent)]" title="Return to Landing Page"><HomeIcon className="w-5 h-5"/></button>
               </div>
               <div className="flex justify-center"><Clock timezone={timezone} isThemeChanging={false} onChange={setTimezone} /></div>
               <div className="flex items-center justify-end gap-2">
                   <div className="relative" ref={themeMenuRef}>
                        <button onClick={() => setShowThemeMenu(!showThemeMenu)} className="p-2 rounded-full hover:bg-[var(--bg-secondary)] transition-colors text-[var(--accent)]">
                            <SwatchIcon className="w-5 h-5"/>
                        </button>
                        {showThemeMenu && (
                            <div className="absolute top-full right-0 mt-2 z-50 bg-[var(--bg-secondary)]/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-[var(--border-primary)] animated-popover p-3 flex flex-row gap-3 min-w-max max-w-[90vw] overflow-x-auto custom-scrollbar">
                                {Object.keys(THEME_PALETTES).map((t) => (
                                    <button 
                                        key={t} 
                                        onClick={() => { setTheme(t as Theme); setShowThemeMenu(false); }}
                                        className={`flex flex-col items-center gap-2 p-2.5 rounded-xl transition-all duration-300 min-w-[90px] group/item border ${theme === t ? 'bg-[var(--bg-primary)] border-[var(--accent)] shadow-md' : 'bg-transparent border-transparent hover:bg-[var(--bg-primary)]'}`}
                                    >
                                        <div className="relative flex flex-col gap-0.5 w-full">
                                            {THEME_PALETTES[t as Theme].map((color, i) => (
                                                <div key={i} className="w-full h-1.5 rounded-full border border-black/5 shadow-sm" style={{ backgroundColor: color }} />
                                            ))}
                                            {theme === t && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-primary)]/40 rounded-lg">
                                                    <CheckIcon className="w-4 h-4 text-[var(--accent)]" />
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest truncate w-full text-center">{t}</span>
                                    </button>
                                ))}
                                <div className="w-px bg-[var(--border-primary)]/50 self-stretch my-2" />
                                <button 
                                    onClick={() => { wallpaperInputRef.current?.click(); setShowThemeMenu(false); }}
                                    className="flex flex-col items-center justify-center gap-2 p-2.5 rounded-xl border-2 border-dashed border-[var(--border-primary)] text-[var(--accent)] hover:bg-[var(--bg-primary)] hover:border-[var(--accent)] transition-all min-w-[90px]"
                                >
                                    <ImageIcon className="w-5 h-5" />
                                    <span className="text-[9px] font-black uppercase tracking-tighter text-center leading-tight">Add Wall</span>
                                </button>
                            </div>
                        )}
                   </div>
                   <button onClick={() => setShowSettings(true)} className="p-2 rounded-full hover:bg-[var(--bg-secondary)] transition-colors"><CogIcon className="w-5 h-5"/></button>
                   <button onClick={onOpenWidgets} className="p-2 rounded-full hover:bg-[var(--bg-secondary)] transition-colors"><Squares2X2Icon className="w-5 h-5"/></button>
                   <button onClick={onLogout} className="p-2 rounded-full hover:bg-rose-500/10 text-rose-500 transition-colors"><LogoutIcon className="w-5 h-5"/></button>
               </div>
           </header>
       </div>

       <main className={`flex-1 flex overflow-hidden relative z-10 bg-transparent ${containerClasses}`}>
           {showDashboard ? (
               <div className={`flex-1 overflow-hidden relative bg-[var(--bg-secondary)]/10 backdrop-blur-sm border border-[var(--border-primary)]/10 ${isModern ? 'rounded-3xl' : 'rounded-none'}`}>
                   <Dashboard 
                       user={user} 
                       todos={allTodos} 
                       pages={pages} 
                       onOpenNote={handleOpenNotebook} 
                       onToggleTodo={handleToggleTodo} 
                       onUpdateTodo={handleUpdateTodo} 
                       onAddTodo={handleAddTodo}
                       theme={theme} 
                       setTheme={setTheme} 
                       onContextMenu={(e) => handleContextMenu(e, 'default')} 
                       onUploadWallpaper={() => wallpaperInputRef.current?.click()} 
                       onCloseDashboard={() => setShowDashboard(false)}
                   />
               </div>
           ) : (
               <>
                   {/* Sidebar restricted ONLY to non-dashboard view */}
                   <div className={`transition-all duration-500 overflow-hidden ${sidebarContainerClasses} ${isSidebarOpen ? 'w-72' : 'w-0'}`}>
                      <div className="w-72 h-full">
                           <Sidebar isOpen={isSidebarOpen} pages={pages} activePageId={activePageId} onSelectPage={handleOpenNotebook} onAddPage={handleAddNewPage} onDeletePage={(id) => setPages(p => p.filter(pg => pg.id !== id))} onRenamePage={(id, t) => setPages(p => p.map(pg => pg.id === id ? {...pg, title: t} : pg))} onMovePage={() => {}} backgroundAnimation={backgroundAnimation as any} onAnimationChange={setBackgroundAnimation} tagsMap={tagsMap} selectedTag={selectedTag} onSelectTag={setSelectedTag} onOpenSettings={() => setShowSettings(true)} />
                      </div>
                   </div>

                   <div className={`flex-1 h-full overflow-hidden flex flex-col relative transition-all duration-700 ease-out transform ${notebookContainerClasses} ${!notebookVisible ? 'hidden' : ''} ${animStage >= 1 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
                       {/* Label Overlay for Notebook Section - Stylized NOTES with Glassy Card covering entire section */}
                       {(animStage === 3 || animStage === 4) && (
                            <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none 
                                bg-[var(--bg-secondary)]/60 backdrop-blur-xl border border-[var(--border-primary)]/20 shadow-2xl rounded-3xl
                                ${animStage === 3 ? 'animate-[fadeIn_0.5s_ease-out]' : 'animate-brush-exit'}
                            `}>
                                <span className="text-4xl font-black uppercase tracking-[0.5em] text-[var(--text-primary)]/40 drop-shadow-sm animate-pulse">Notes</span>
                                <div className="h-0.5 w-64 bg-gradient-to-r from-transparent via-[var(--accent)]/50 to-transparent mt-4"></div>
                            </div>
                        )}

                       {isShelfVisible ? (
                           <NotebookShelf notebooks={pages.filter(p => !p.parentId)} onOpenNotebook={handleOpenNotebook} onAddNotebook={() => handleAddNewPage(null, false)} onDeleteNotebook={(id) => setPages(p => p.filter(pg => pg.id !== id))} onRenameNotebook={(id, t) => setPages(p => p.map(pg => pg.id === id ? {...pg, title: t} : pg))} onUpdateCover={(id, cover) => setPages(p => p.map(pg => pg.id === id ? {...pg, coverImage: cover} : pg))} />
                       ) : (
                           <div className="flex-1 flex flex-col animate-[fadeIn_0.3s_ease-out]">
                                <Notebook 
                                    pageContent={notes} pageTitle={activePage?.title} pageTags={activePage?.tags || []} allTags={Array.from(tagsMap.keys())} onNotesChange={(c) => setPages(p => p.map(pg => pg.id === activePageId ? {...pg, content: c} : pg))} onTitleChange={(t) => setPages(p => p.map(pg => pg.id === activePageId ? {...pg, title: t} : pg))} onTagsChange={(t) => setPages(p => p.map(pg => pg.id === activePageId ? {...pg, tags: t} : pg))} onIconChange={(i) => setPages(p => p.map(pg => pg.id === activePageId ? {...pg, icon: i} : pg))} onCoverChange={(c) => setPages(p => p.map(pg => pg.id === activePageId ? {...pg, coverImage: c} : pg))} onSummarize={handleSummarize} isSummarizing={isSummarizing} onStartRecall={handleStartRecall} isGeneratingQuiz={isGeneratingQuiz} onTodosChange={(t) => setPages(p => p.map(pg => pg.id === activePageId ? {...pg, todos: t} : pg))} isOnline={isOnline} onBackToShelf={() => setIsShelfVisible(true)} onContextMenu={(e) => handleContextMenu(e, 'notebook')} 
                                    summaryContent={summaryContent}
                                    onCloseSummary={() => setSummaryContent(null)}
                                    onAppendSummary={(text) => { const newContent = notes + `\n\n${text}`; setPages(p => p.map(pg => pg.id === activePageId ? {...pg, content: newContent} : pg)); setSummaryContent(null); }}
                                    floatingWidgets={floatingWidgets}
                                    onAddFloatingWidget={(w) => setFloatingWidgets(prev => [...prev, w])}
                                    onRemoveFloatingWidget={(id) => setFloatingWidgets(prev => prev.filter(w => w.id !== id))}
                                    onUpdateFloatingWidget={(id, updates) => setFloatingWidgets(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w))}
                                />
                           </div>
                       )}
                   </div>
                   {(videoVisible || widgetsVisible) && (
                       <div className={`flex-1 h-full overflow-hidden transition-all duration-300 relative ${mediaPanelContainerClasses} ${isHoveringWidget ? 'z-50' : 'z-20'}`}>
                           <MediaPanel 
                            videoUrl={videoUrl} 
                            onVideoUrlChange={setVideoUrl} 
                            onLoadVideo={() => {}} 
                            videoId={videoId} 
                            widgets={widgets} 
                            onWidgetPlaceholderClick={(i) => {const w = [...widgets]; w[i] = {type: 'selecting'}; setWidgets(w);}} 
                            onSelectWidget={(i, t) => { const newWidgets = [...widgets]; newWidgets[i] = { type: t, data: {} }; setWidgets(newWidgets); }} 
                            updateWidgetData={(i, d) => { const w = [...widgets]; w[i].data = d; setWidgets(w); }} 
                            onRemoveWidget={(i) => { const w = [...widgets]; w[i] = {type: 'empty'}; setWidgets(w); }} 
                            activeWidgetIndex={activeWidgetIndex} 
                            onSetActiveWidget={setActiveWidgetIndex} 
                            onToggleWidgetBg={(i) => {
                                 const w = [...widgets];
                                 w[i] = { ...w[i], isBgToggled: !w[i].isBgToggled };
                                 setWidgets(w);
                            }} 
                            onTerminalCommand={(i, command, args) => {
                                 const w = [...widgets];
                                 const history = w[i].data?.history || [];
                                 w[i].data = { ...w[i].data, history: [...history, `> ${command} ${args.join(' ')}`, `Command executed.`] };
                                 setWidgets(w);
                            }} 
                            onMoveWidget={(from, to) => {
                                 const w = [...widgets];
                                 const [removed] = w.splice(from, 1);
                                 w.splice(to, 0, removed);
                                 setWidgets(w);
                            }} 
                            videoVisible={videoVisible} 
                            widgetsVisible={widgetsVisible} 
                            onContextMenu={handleContextMenu} 
                            isOnline={isOnline} 
                            animStage={animStage} 
                            onWidgetHoverStateChange={setIsHoveringWidget}
                            layoutMode={layoutMode}
                           />
                       </div>
                   )}
               </>
           )}
           <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} user={user} onUpdateUser={onUpdateUser} onLogout={onLogout} hideHeader={hideHeader} onToggleHideHeader={() => setHideHeader(!hideHeader)} layoutMode={layoutMode} onLayoutChange={onLayoutChange} />
           {quizQuestions && <QuizView questions={quizQuestions} onClose={() => setQuizQuestions(null)} />}
           {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} items={contextMenu.items} onClose={() => setContextMenu(null)} />}
       </main>
    </div>
  );
}

export default App;
