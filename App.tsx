
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { InfinityIcon, ThemeIcon, FocusIcon, QuestionMarkCircleIcon, DocumentTextIcon, LogoutIcon, ChevronDownIcon, ArrowsRightLeftIcon, Squares2X2Icon, HomeIcon } from './components/Icons';
import Notebook from './components/Notebook';
import MediaPanel from './components/MediaPanel';
import { generateHighlightedSummary, generateQuizFromNotes, lookupDictionary } from './lib/ai';
import BrightnessSlider from './components/BrightnessSlider';
import Modal from './components/Modal';
import QuizView, { Question } from './components/QuizView';
import SummaryView from './components/SummaryView';
import Clock from './components/Clock';
import Sidebar from './components/Sidebar';
import { generateThemeFromImage, DynamicTheme } from './lib/colorExtractor';
import ShortcutHelp from './components/ShortcutHelp';
import PdfViewer, { PdfFile } from './components/PdfViewer';
import SettingsModal from './components/SettingsModal';
import { User, Theme, WidgetType, WidgetState, ToDoItem, NotePage } from './types';
import { GlobalBackgroundAnimation } from './components/GlobalBackgroundAnimation';

const PAGES_STORAGE_KEY_BASE = 'zen-notes-pages-v2';
const WALLPAPER_STORAGE_KEY_BASE = 'zen-notes-wallpaper';
const PDF_LIBRARY_STORAGE_KEY_BASE = 'zen-notes-pdf-library';

function stripHtml(html: string): string {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
}

interface AppProps {
  user: User;
  onLogout: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  onOpenWidgets: () => void;
  onGoHome: () => void;
  onUpdateUser: (user: User) => void;
}

function App({ user, onLogout, theme, setTheme, onOpenWidgets, onGoHome, onUpdateUser }: AppProps) {
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryContent, setSummaryContent] = useState<string | null>(null);

  const [videoUrl, setVideoUrl] = useState('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const [videoId, setVideoId] = useState<string | null>('dQw4w9WgXcQ');

  const [brightness, setBrightness] = useState(100);
  const [showBrightnessSlider, setShowBrightnessSlider] = useState(false);
  
  const [widgets, setWidgets] = useState<WidgetState[]>([
    { type: 'empty', isBgToggled: false },
    { type: 'empty', isBgToggled: false },
    { type: 'empty', isBgToggled: false },
  ]);

  const [activeWidgetIndex, setActiveWidgetIndex] = useState<number | null>(null);

  // Active Recall State
  const [showRecallPrompt, setShowRecallPrompt] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<Question[] | null>(null);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Notebook/Sidebar State
  const [pages, setPages] = useState<NotePage[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [backgroundAnimation, setBackgroundAnimation] = useState<string>('none');
  const notebookEditorRef = useRef<HTMLDivElement>(null);
  
  // Tagging System State
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Wallpaper state
  const [wallpaperUrl, setWallpaperUrl] = useState<string | null>(null);
  const [dynamicTheme, setDynamicTheme] = useState<DynamicTheme | null>(null);
  const wallpaperInputRef = useRef<HTMLInputElement>(null);

  // UI Animation State
  const [themeNameToast, setThemeNameToast] = useState<string | null>(null);
  const [isThemeChanging, setIsThemeChanging] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Theme Menu State
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  // Zen Mode
  const [isZenMode, setIsZenMode] = useState(false);
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Global state
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [isLayoutSwapped, setIsLayoutSwapped] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);

  // PDF Library State (Lifted)
  const [pdfLibrary, setPdfLibrary] = useState<PdfFile[]>([]);

  const activePage = pages.find(p => p.id === activePageId);
  const notes = activePage ? activePage.content : '';

  // User-specific storage keys
  const PAGES_STORAGE_KEY = `${PAGES_STORAGE_KEY_BASE}-${user.id}`;
  const WALLPAPER_STORAGE_KEY = `${WALLPAPER_STORAGE_KEY_BASE}-${user.id}`;
  const PDF_LIBRARY_STORAGE_KEY = `${PDF_LIBRARY_STORAGE_KEY_BASE}-${user.id}`;
  
  // Derived state for tags (Tag -> Count)
  const allTagsMap = useMemo(() => {
    const map = new Map<string, number>();
    pages.forEach(p => {
        if (p.tags && Array.isArray(p.tags)) {
            p.tags.forEach(t => {
                map.set(t, (map.get(t) || 0) + 1);
            });
        }
    });
    return map;
  }, [pages]);
  
  const filteredPages = useMemo(() => {
      if (!selectedTag) return pages;
      return pages.filter(p => p.tags && p.tags.includes(selectedTag));
  }, [pages, selectedTag]);


  // Click Sound Effect
  useEffect(() => {
    // Using a cleaner, standard UI click sound (Pop)
    const CLICK_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3';
    const audio = new Audio(CLICK_SOUND_URL);
    audio.volume = 0.3; 

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Only play sound if clicking an interactive element
      const interactiveElement = target.closest('button, a, input[type="button"], input[type="submit"], input[type="checkbox"], input[type="radio"], select, [role="button"], .btn-press, .cursor-pointer');
      
      if (interactiveElement) {
          const clickSound = audio.cloneNode() as HTMLAudioElement;
          clickSound.volume = 0.3;
          clickSound.play().catch(() => {
              // Ignore auto-play restrictions that might occur before first interaction
          });
      }
    };

    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);
  
  // Wallpaper effect
  useEffect(() => {
    const savedWallpaper = localStorage.getItem(WALLPAPER_STORAGE_KEY);
    if (savedWallpaper) {
        setWallpaperUrl(savedWallpaper);
        generateThemeFromImage(savedWallpaper).then(theme => {
            setDynamicTheme(theme);
        });
    }
  }, [WALLPAPER_STORAGE_KEY]);

  useEffect(() => {
    if (wallpaperUrl) {
      document.documentElement.classList.add('has-wallpaper');
      localStorage.setItem(WALLPAPER_STORAGE_KEY, wallpaperUrl);
    } else {
      document.documentElement.classList.remove('has-wallpaper');
      localStorage.removeItem(WALLPAPER_STORAGE_KEY);
    }
  }, [wallpaperUrl, WALLPAPER_STORAGE_KEY]);

  // Dynamic theme injection effect
  useEffect(() => {
    const styleElement = document.getElementById('dynamic-theme-style');
    if (dynamicTheme) {
        let cssText = ':root.has-wallpaper {';
        for (const [key, value] of Object.entries(dynamicTheme)) {
            cssText += `${key}: ${value};`;
        }
        cssText += '}';
        
        const bgPrimary = dynamicTheme['--bg-primary'].replace('rgb(', '').replace(')', '');
        const bgSecondary = dynamicTheme['--bg-secondary'].replace('rgba(', '').replace(')', '').split(',').slice(0, 3).join(',');

        cssText += `
            html.has-wallpaper.dynamic-theme {
                --bg-primary-glass: rgba(${bgPrimary}, 0.5);
                --bg-secondary-glass: rgba(${bgSecondary}, 0.5);
            }
        `;

        if (styleElement) {
            styleElement.innerHTML = cssText;
        } else {
            const newStyleElement = document.createElement('style');
            newStyleElement.id = 'dynamic-theme-style';
            newStyleElement.innerHTML = cssText;
            document.head.appendChild(newStyleElement);
        }
        document.documentElement.classList.add('dynamic-theme');
    } else {
        if (styleElement) {
            styleElement.innerHTML = '';
        }
        document.documentElement.classList.remove('dynamic-theme');
    }
  }, [dynamicTheme]);


  // Load pages from local storage on initial render
  useEffect(() => {
    try {
      const savedPages = localStorage.getItem(PAGES_STORAGE_KEY);
      if (savedPages) {
        let parsedPages: NotePage[] = JSON.parse(savedPages);
        if (parsedPages.length > 0) {
            setPages(parsedPages);
            const firstTopLevelPage = parsedPages.find((p: NotePage) => p.parentId === null) || parsedPages[0];
            if (!activePageId) setActivePageId(firstTopLevelPage.id);
        } else {
            handleAddNewPage();
        }
      } else {
        handleAddNewPage();
      }
    } catch (error) {
      console.error("Failed to load notes from local storage:", error);
      handleAddNewPage();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [PAGES_STORAGE_KEY]);

  // Save pages to local storage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(PAGES_STORAGE_KEY, JSON.stringify(pages));
    } catch (error) {
      console.error("Failed to save notes to local storage:", error);
    }
  }, [pages, PAGES_STORAGE_KEY]);

  // Load PDF Library
  useEffect(() => {
      try {
          const savedLibrary = localStorage.getItem(PDF_LIBRARY_STORAGE_KEY);
          if (savedLibrary) {
              setPdfLibrary(JSON.parse(savedLibrary));
          }
      } catch (error) {
          console.error("Failed to load PDF library:", error);
      }
  }, [PDF_LIBRARY_STORAGE_KEY]);

  // Save PDF Library
  useEffect(() => {
      try {
          localStorage.setItem(PDF_LIBRARY_STORAGE_KEY, JSON.stringify(pdfLibrary));
      } catch (error) {
          console.error("Failed to save PDF library:", error);
      }
  }, [pdfLibrary, PDF_LIBRARY_STORAGE_KEY]);

  const selectTheme = (newTheme: Theme) => {
    setIsThemeChanging(true);
    setTheme(newTheme);
    setShowThemeMenu(false);
    
    if (newTheme === 'matrix') {
        setBackgroundAnimation('matrixRain');
    } else if (newTheme === 'frosty') {
        setBackgroundAnimation('fallingLeaves');
    } else if (newTheme === 'cyberpunk') {
        setBackgroundAnimation('gridStrobe');
    } else {
        setBackgroundAnimation('none'); 
    }
    
    const displayName = newTheme.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
    setThemeNameToast(displayName);

    setTimeout(() => {
        setThemeNameToast(null);
        setIsThemeChanging(false);
    }, 1500);
  };
  
  const handleSummarize = async () => {
    const plainTextNotes = stripHtml(notes);
    if (!plainTextNotes.trim()) {
        setErrorMessage("Your notebook is empty. Please write some notes before generating a summary.");
        return;
    }
    setIsSummarizing(true);
    setSummaryContent(null);
    try {
        const summary = await generateHighlightedSummary(plainTextNotes);
        setSummaryContent(summary);
    } catch (error) {
        console.error("Summarization failed:", error);
        setErrorMessage("Failed to generate summary. Please try again later.");
    } finally {
        setIsSummarizing(false);
    }
  };

  const handleAppendSummary = (plainTextSummary: string) => {
    const summaryHtml = `<hr><p><b>Summary</b></p><p>${plainTextSummary.replace(/\n/g, '<br>')}</p>`;
    handleNotesChange(notes + summaryHtml);
    setSummaryContent(null);
  };
  
  const handleStartRecall = async () => {
    setShowRecallPrompt(false);
    const plainTextNotes = stripHtml(notes);
    if (!plainTextNotes.trim()) {
        setQuizError("There are no notes to generate a quiz from.");
        return;
    }
    setIsGeneratingQuiz(true);
    setQuizError(null);
    try {
      const questions = await generateQuizFromNotes(plainTextNotes);
      if (questions.length === 0) {
        throw new Error("Could not generate any questions from the notes.");
      }
      setQuizQuestions(questions);
    } catch(error) {
      console.error("Quiz generation failed:", error);
      setQuizError(error instanceof Error ? error.message : "An unknown error occurred.");
    } finally {
      setIsGeneratingQuiz(false);
    }
  };
  
  const handleNotesChange = (newContent: string) => {
    if (!activePageId) return;
    setPages(currentPages =>
        currentPages.map(p =>
            p.id === activePageId ? { ...p, content: newContent } : p
        )
    );
  };

  const handleTodosChange = (newTodos: ToDoItem[]) => {
    if (!activePageId) return;
    setPages(currentPages =>
        currentPages.map(p =>
            p.id === activePageId ? { ...p, todos: newTodos } : p
        )
    );
  };

  const handlePageMetaChange = (meta: { title?: string, icon?: string, coverImage?: string, tags?: string[] }) => {
    if (!activePageId) return;
    setPages(currentPages =>
        currentPages.map(p =>
            p.id === activePageId ? { ...p, ...meta } : p
        )
    );
  };

  const handleAddNewPage = (parentId: string | null = null, isFolder: boolean = false, title?: string) => {
    const newPage: NotePage = {
        id: Date.now().toString(),
        title: title || (isFolder ? 'New Folder' : 'Untitled Page'),
        content: '<p><br></p>',
        parentId: parentId,
        order: pages.filter(p => p.parentId === parentId).length,
        todos: [],
        isFolder: isFolder,
        icon: isFolder ? '📁' : '📄',
        tags: []
    };
    setPages(currentPages => [...currentPages, newPage]);
    setActivePageId(newPage.id);
    if (isSidebarOpen && window.innerWidth < 1024) setIsSidebarOpen(false); 
  };

  const handleDeletePage = (pageIdToDelete: string) => {
    setPages(currentPages => {
        const pagesToDelete = new Set<string>();
        const queue = [pageIdToDelete];
        pagesToDelete.add(pageIdToDelete);

        while (queue.length > 0) {
            const currentId = queue.shift()!;
            const children = currentPages.filter(p => p.parentId === currentId);
            for (const child of children) {
                pagesToDelete.add(child.id);
                queue.push(child.id);
            }
        }

        const newPages = currentPages.filter(p => !pagesToDelete.has(p.id));

        if (pagesToDelete.has(activePageId!)) {
            const deletedPage = currentPages.find(p => p.id === pageIdToDelete);
            const parentId = deletedPage?.parentId;
            const sibling = newPages.find(p => p.parentId === parentId);
            const parent = newPages.find(p => p.id === parentId);
            const fallback = newPages.length > 0 ? newPages[0].id : null;
            setActivePageId(sibling?.id || parent?.id || fallback);
        }

        return newPages;
    });
  };

  const handleRenamePage = (id: string, newTitle: string) => {
      setPages(currentPages => currentPages.map(p => p.id === id ? { ...p, title: newTitle } : p));
  };

  const handleMovePage = (draggedId: string, targetId: string, position: 'before' | 'after' | 'inside') => {
    setPages(currentPages => {
        const draggedPage = currentPages.find(p => p.id === draggedId);
        const targetPage = currentPages.find(p => p.id === targetId);
        if (!draggedPage || !targetPage || draggedId === targetId) return currentPages;

        let ancestor = targetPage;
        while (ancestor.parentId) {
            if (ancestor.parentId === draggedId) return currentPages;
            const nextAncestor = currentPages.find(p => p.id === ancestor.parentId);
            if (!nextAncestor) break;
            ancestor = nextAncestor;
        }

        let newPages = currentPages.filter(p => p.id !== draggedId).map(p => ({ ...p }));
        const targetInNew = newPages.find(p => p.id === targetId);
        if (!targetInNew) return currentPages;

        const updatedDragged = { ...draggedPage };

        if (position === 'inside') {
            updatedDragged.parentId = targetInNew.id;
            const siblings = newPages.filter(p => p.parentId === targetInNew.id);
            updatedDragged.order = siblings.length;
        } else {
            updatedDragged.parentId = targetInNew.parentId;
            const siblings = newPages.filter(p => p.parentId === targetInNew.parentId);
            siblings.sort((a, b) => a.order - b.order);
            const targetIndex = siblings.findIndex(p => p.id === targetId);
            const insertIndex = position === 'after' ? targetIndex + 1 : targetIndex;
            siblings.forEach((p, idx) => {
                if (idx >= insertIndex) p.order += 1;
            });
            updatedDragged.order = insertIndex;
        }
        newPages.push(updatedDragged);
        const grouped = new Map<string | null, NotePage[]>();
        newPages.forEach(p => {
             const pid = p.parentId || null;
             if (!grouped.has(pid)) grouped.set(pid, []);
             grouped.get(pid)!.push(p);
        });
        grouped.forEach(group => {
            group.sort((a, b) => a.order - b.order);
            group.forEach((p, i) => p.order = i);
        });
        return newPages;
    });
  };

  const handleCloseQuiz = () => { setQuizQuestions(null); setQuizError(null); }
  
  const extractVideoID = (url: string) => {
      // Improved Regex for YouTube ID extraction (covers youtu.be, embed, v=, etc.)
      const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = url.match(regExp);
      return match ? match[1] : null; 
  };
  
  const handleLoadVideo = () => { setVideoId(extractVideoID(videoUrl)); };
  const handleWidgetPlaceholderClick = (index: number) => { const newWidgets = [...widgets]; newWidgets[index] = { type: 'selecting', isBgToggled: false }; setWidgets(newWidgets); setActiveWidgetIndex(index); };
  const selectWidget = (index: number, type: WidgetType) => { if (index !== null) { let initialData: any = {}; if (type === 'terminal') { initialData = { history: ['Welcome to Zen-Terminal.'], cwdId: null, cwdPath: '/', }; } const newWidgets = [...widgets]; newWidgets[index] = { type, data: initialData, isBgToggled: false }; setWidgets(newWidgets); } };
  const updateWidgetData = (index: number, data: any) => { const newWidgets = [...widgets]; newWidgets[index] = { ...newWidgets[index], data }; setWidgets(newWidgets); };
  const removeWidget = useCallback((index: number) => { setWidgets(currentWidgets => { const newWidgets = [...currentWidgets]; newWidgets[index] = { type: 'empty', isBgToggled: false }; return newWidgets; }); setActiveWidgetIndex(currentIndex => (currentIndex === index ? null : currentIndex)); }, []);
  const handleToggleWidgetBg = (index: number) => { setWidgets(currentWidgets => { const newWidgets = [...currentWidgets]; const widget = newWidgets[index]; newWidgets[index] = { ...widget, isBgToggled: !widget.isBgToggled }; return newWidgets; }); };
  const handleMoveWidget = (fromIndex: number, toIndex: number) => { if (fromIndex === toIndex) return; setWidgets(currentWidgets => { const newWidgets = [...currentWidgets]; const item = newWidgets[fromIndex]; newWidgets.splice(fromIndex, 1); newWidgets.splice(toIndex, 0, item); return newWidgets; }); if (activeWidgetIndex === fromIndex) setActiveWidgetIndex(toIndex); else if (activeWidgetIndex !== null) { if (fromIndex < activeWidgetIndex && toIndex >= activeWidgetIndex) setActiveWidgetIndex(activeWidgetIndex - 1); else if (fromIndex > activeWidgetIndex && toIndex <= activeWidgetIndex) setActiveWidgetIndex(activeWidgetIndex + 1); } };
  const handleWallpaperChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) { const file = e.target.files[0]; const reader = new FileReader(); reader.onload = async (event) => { const imageUrl = event.target?.result as string; setWallpaperUrl(imageUrl); const theme = await generateThemeFromImage(imageUrl); setDynamicTheme(theme); }; reader.readAsDataURL(file); } };
  const handleRemoveWallpaper = () => { setWallpaperUrl(null); setDynamicTheme(null); };
  const handleDefineWord = async (word: string) => { let dictIndex = widgets.findIndex(w => w.type === 'dictionary'); if (dictIndex === -1) { dictIndex = widgets.findIndex(w => w.type === 'empty'); if (dictIndex === -1) dictIndex = 1; selectWidget(dictIndex, 'dictionary'); } setActiveWidgetIndex(dictIndex); updateWidgetData(dictIndex, { word, loading: true, error: null }); try { const result = await lookupDictionary(word); updateWidgetData(dictIndex, { word, result, loading: false }); } catch (error) { updateWidgetData(dictIndex, { word, loading: false, error: "Definition not found." }); } };
  const handleTerminalCommand = (index: number, command: string, args: string[]) => { /* ... */ };

  const handleSwapLayout = () => {
    setIsSwapping(true);
    setTimeout(() => setIsSwapping(false), 500);

    if ('startViewTransition' in document) {
      (document as any).startViewTransition(() => {
        flushSync(() => {
            setIsLayoutSwapped(prev => !prev);
        });
      });
    } else {
      setIsLayoutSwapped(prev => !prev);
    }
  };

  return (
    <div 
      className={`h-screen w-full transition-all overflow-hidden flex flex-col text-[var(--text-primary)]`} 
      style={{ 
          filter: `brightness(${brightness}%)`,
          backgroundColor: wallpaperUrl ? 'var(--bg-primary-glass)' : 'var(--bg-primary)' 
      }}
    >
       <GlobalBackgroundAnimation animationType={backgroundAnimation} />
       {wallpaperUrl && <div className="wallpaper-background" style={{ backgroundImage: `url(${wallpaperUrl})` }}></div>}
       <input type="file" accept="image/*" ref={wallpaperInputRef} onChange={handleWallpaperChange} className="hidden" />

      <header className="flex-none flex items-center justify-between p-4 border-b border-[var(--border-primary)] h-[80px] bg-[var(--bg-primary)] z-50 transition-all duration-300 ml-16">
        <div className="flex-1 flex justify-start">
            <div className="flex items-center gap-4 md:gap-6">
                <button 
                    onClick={onGoHome}
                    className="p-2 rounded-full hover:bg-[var(--bg-secondary)] transition-all btn-press w-10 h-10 flex items-center justify-center"
                    title="Go to Landing Page"
                >
                    <HomeIcon className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-4 hidden md:flex">
                    <div className="relative group">
                        {/* Modern Glassmorphic Logo Container */}
                        <div className="relative p-2 rounded-xl bg-[var(--bg-secondary)]/50 backdrop-blur-md border border-[var(--border-primary)] shadow-sm group-hover:border-[var(--accent)] group-hover:shadow-lg transition-all duration-300 flex items-center justify-center">
                            <InfinityIcon className="w-8 h-8" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)]">Infi-Notes</h1>
                        <p className="text-xs text-[var(--text-secondary)] font-medium hidden md:block tracking-wide">Focus. Watch. Write.</p>
                    </div>
                </div>
            </div>
        </div>
        <div className="flex-none hidden lg:flex items-center gap-2">
             <Clock timezone={timezone} isThemeChanging={isThemeChanging} onChange={setTimezone} />
        </div>
        <div className="flex-1 flex justify-end">
            <div className="flex items-center gap-2 sm:gap-4">
                <div className="hidden sm:flex items-center gap-2 sm:gap-4">
                  <button onClick={onOpenWidgets} className="p-2 rounded-full hover:bg-[var(--bg-secondary)] transition-all btn-press" title="Open Widgets Board">
                      <Squares2X2Icon className="w-5 h-5" />
                  </button>
                  <button onClick={() => setShowPdfViewer(true)} className="p-2 rounded-full hover:bg-[var(--bg-secondary)] transition-all btn-press" title="PDF Library">
                      <DocumentTextIcon className="w-5 h-5" />
                  </button>
                  
                  <button 
                      onClick={handleSwapLayout} 
                      className={`p-2 rounded-full hover:bg-[var(--bg-secondary)] transition-all duration-500 btn-press ${isSwapping ? 'rotate-180' : ''}`}
                      title="Swap Layout"
                  >
                      <ArrowsRightLeftIcon className="w-5 h-5" />
                  </button>

                  <button onClick={() => setIsZenMode(!isZenMode)} className="p-2 rounded-full hover:bg-[var(--bg-secondary)] transition-all btn-press" title={isZenMode ? "Exit Zen Mode" : "Enter Zen Mode"}>
                      <FocusIcon className="w-5 h-5" />
                  </button>
                  
                  <div className="relative" ref={themeMenuRef}>
                      <button onClick={() => setShowThemeMenu(prev => !prev)} className="p-2 rounded-full hover:bg-[var(--bg-secondary)] transition-all btn-press">
                          <ThemeIcon className="w-5 h-5" />
                      </button>
                      {showThemeMenu && (
                          <div className="absolute top-full right-0 mt-2 z-50 bg-[var(--bg-secondary)] rounded-xl shadow-2xl border border-[var(--border-primary)] animated-popover p-2 flex gap-3">
                              {[
                                  { id: 'light', label: 'Light', style: 'bg-white border-gray-200 text-gray-800' },
                                  { id: 'monokai', label: 'Monokai', style: 'bg-[#272822] border-[#75715E] text-[#F92672]' },
                                  { id: 'pitch-black', label: 'Dark', style: 'bg-black border-gray-800 text-white' },
                                  { id: 'cyberpunk', label: 'Cyber', style: 'bg-zinc-950 border-cyan-500 text-cyan-400' },
                                  { id: 'frosty', label: 'Frosty', style: 'bg-blue-100 border-blue-200 text-blue-600' },
                                  { id: 'matrix', label: 'Matrix', style: 'bg-black border-green-500 text-green-500 font-mono' },
                              ].map((t) => (
                                  <button
                                      key={t.id}
                                      onClick={() => selectTheme(t.id as Theme)}
                                      className={`flex flex-col items-center gap-1 group`}
                                  >
                                      <div className={`w-12 h-8 rounded border-2 shadow-sm transition-transform group-hover:scale-105 ${t.style} ${theme === t.id ? 'ring-2 ring-[var(--accent)] ring-offset-1 ring-offset-[var(--bg-secondary)]' : ''}`}></div>
                                      <span className="text-[10px] font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">{t.label}</span>
                                  </button>
                              ))}
                          </div>
                      )}
                  </div>
                </div>
                {/* User Profile Dropdown */}
                <div className="relative" ref={userMenuRef}>
                    <button onClick={() => setShowUserMenu(prev => !prev)} className="flex items-center gap-2 p-1.5 rounded-full hover:bg-[var(--bg-secondary)] transition-all btn-press">
                        <img src={user.avatar} alt="User Avatar" className="w-8 h-8 rounded-full border border-[var(--border-primary)]" />
                        <ChevronDownIcon className={`w-4 h-4 text-[var(--text-secondary)] transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                    </button>
                    {showUserMenu && (
                        <div className="absolute top-full right-0 mt-2 z-50 w-64 bg-[var(--bg-secondary)] rounded-xl shadow-2xl border border-[var(--border-primary)] animated-popover overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-[var(--border-primary)] flex items-center gap-3">
                                 <img src={user.avatar} alt="User" className="w-10 h-10 rounded-full border border-[var(--border-primary)]" />
                                 <div className="overflow-hidden">
                                     <p className="font-bold text-sm truncate">{user.name}</p>
                                     <p className="text-xs text-[var(--text-secondary)] truncate">{user.email}</p>
                                 </div>
                            </div>
                            <div className="p-1">
                                <button onClick={() => { setShowSettings(true); setShowUserMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left text-[var(--text-primary)] hover:bg-[var(--bg-primary)] rounded-md transition-all">
                                     <QuestionMarkCircleIcon className="w-4 h-4 text-[var(--text-secondary)]" />
                                     <span>Settings</span>
                                </button>
                                <button onClick={() => setShowShortcutHelp(true)} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left text-[var(--text-primary)] hover:bg-[var(--bg-primary)] rounded-md transition-all">
                                     <QuestionMarkCircleIcon className="w-4 h-4 text-[var(--text-secondary)]" />
                                     <span>Keyboard Shortcuts</span>
                                </button>
                                 <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-md transition-all">
                                    <LogoutIcon className="w-4 h-4" />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </header>
      
      {/* Main Body Container */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar ... */}
        <div className={`
            absolute lg:relative inset-y-0 left-0 z-40 h-full sidebar-root
            transition-all duration-300 ease-in-out bg-[var(--bg-primary)] overflow-hidden
            ${isSidebarOpen && !isZenMode 
                ? 'translate-x-0 w-72 border-r border-[var(--border-primary)]' 
                : '-translate-x-full w-0 lg:w-0 lg:translate-x-0 border-none'}
        `}>
            <Sidebar 
                isOpen={true}
                pages={filteredPages}
                activePageId={activePageId}
                onSelectPage={(id) => { setActivePageId(id); if(window.innerWidth < 1024) setIsSidebarOpen(false); }}
                onAddPage={handleAddNewPage}
                onDeletePage={handleDeletePage}
                onRenamePage={handleRenamePage}
                onMovePage={handleMovePage}
                backgroundAnimation={backgroundAnimation as any}
                onAnimationChange={(t) => setBackgroundAnimation(t)}
                tagsMap={allTagsMap}
                selectedTag={selectedTag}
                onSelectTag={setSelectedTag}
                onOpenSettings={() => setShowSettings(true)}
            />
        </div>

        {/* Mobile Sidebar Backdrop */}
        {isSidebarOpen && !isZenMode && (
            <div 
                className="lg:hidden absolute inset-0 bg-black/50 z-30 backdrop-blur-sm"
                onClick={() => setIsSidebarOpen(false)}
            />
        )}

        <main className={`flex-1 flex flex-col ${isLayoutSwapped ? 'lg:flex-row-reverse' : 'lg:flex-row'} w-full overflow-y-auto lg:overflow-hidden bg-transparent`}>
            {/* Notebook Section */}
            <div 
                className={`
                    flex-shrink-0 relative
                    ${isZenMode ? 'w-full h-full' : 'w-full lg:w-1/2'}
                    ${!isZenMode ? (isLayoutSwapped ? 'lg:border-l' : 'lg:border-r') + ' lg:border-[var(--border-primary)]' : ''}
                    h-[45vh] lg:h-full
                `}
                style={{ viewTransitionName: 'notebook-section' }}
            >
                <Notebook 
                  ref={notebookEditorRef}
                  pageContent={notes}
                  pageTitle={activePage?.title}
                  pageIcon={activePage?.icon}
                  pageCover={activePage?.coverImage}
                  pageTags={activePage?.tags || []}
                  allTags={Array.from(allTagsMap.keys())}
                  onNotesChange={handleNotesChange}
                  onTitleChange={(newTitle) => activePageId && handleRenamePage(activePageId, newTitle)}
                  onIconChange={(newIcon) => handlePageMetaChange({ icon: newIcon })}
                  onCoverChange={(newCover) => handlePageMetaChange({ coverImage: newCover })}
                  onTagsChange={(newTags) => handlePageMetaChange({ tags: newTags })}
                  onSummarize={handleSummarize}
                  isSummarizing={isSummarizing}
                  onStartRecall={() => setShowRecallPrompt(true)}
                  isGeneratingQuiz={isGeneratingQuiz}
                  pageTodos={activePage?.todos}
                  onTodosChange={handleTodosChange}
                  onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                />
                {summaryContent && (
                    <SummaryView 
                        summaryContent={summaryContent}
                        onClose={() => setSummaryContent(null)}
                        onAppend={handleAppendSummary}
                    />
                )}
            </div>
            
             {/* MediaPanel Section */}
            {!isZenMode && (
              <div 
                className="w-full lg:w-1/2 flex-shrink-0 h-auto min-h-[55vh] lg:h-full lg:min-h-0 border-t lg:border-t-0 border-[var(--border-primary)] relative"
                style={{ viewTransitionName: 'media-section' }}
              >
                  <MediaPanel 
                      videoUrl={videoUrl}
                      onVideoUrlChange={setVideoUrl}
                      onLoadVideo={handleLoadVideo}
                      videoId={videoId}
                      widgets={widgets}
                      onWidgetPlaceholderClick={handleWidgetPlaceholderClick}
                      onSelectWidget={selectWidget}
                      updateWidgetData={updateWidgetData}
                      onRemoveWidget={removeWidget}
                      activeWidgetIndex={activeWidgetIndex}
                      onSetActiveWidget={setActiveWidgetIndex}
                      onToggleWidgetBg={handleToggleWidgetBg}
                      onTerminalCommand={handleTerminalCommand}
                      onMoveWidget={handleMoveWidget}
                  />
              </div>
            )}
        </main>
      </div>
      
      <Modal
        isOpen={showRecallPrompt}
        onClose={() => setShowRecallPrompt(false)}
        title="Active Recall Session"
      >
        <div>
            <p className="text-[var(--text-secondary)] mb-6">Ready to test your knowledge? We'll generate a short quiz based on your notes.</p>
            <div className="flex justify-end gap-3">
                <button onClick={() => setShowRecallPrompt(false)} className="px-4 py-2 font-semibold bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-md hover:bg-[var(--border-primary)] transition-all btn-press">Maybe Next Time</button>
                <button onClick={handleStartRecall} className="px-4 py-2 font-semibold text-white bg-[var(--accent)] rounded-md hover:opacity-90 transition-all btn-press">Yeah, Continue</button>
            </div>
        </div>
      </Modal>

      {quizQuestions && (
        <QuizView questions={quizQuestions} onClose={handleCloseQuiz} />
      )}

      {quizError && (
        <Modal isOpen={!!quizError} onClose={() => setQuizError(null)} title="Error">
             <div>
                <p className="text-[var(--text-secondary)] mb-6">{quizError}</p>
                <div className="flex justify-end">
                    <button onClick={() => setQuizError(null)} className="px-4 py-2 font-semibold text-white bg-[var(--accent)] rounded-md hover:opacity-90 transition-all btn-press">OK</button>
                </div>
            </div>
        </Modal>
      )}

      {errorMessage && (
        <Modal isOpen={!!errorMessage} onClose={() => setErrorMessage(null)} title="Notice">
            <div>
                <p className="text-[var(--text-secondary)] mb-6">{errorMessage}</p>
                <div className="flex justify-end">
                    <button onClick={() => setErrorMessage(null)} className="px-4 py-2 font-semibold text-white bg-[var(--accent)] rounded-md hover:opacity-90 transition-all btn-press">OK</button>
                </div>
            </div>
        </Modal>
      )}

      <ShortcutHelp isOpen={showShortcutHelp} onClose={() => setShowShortcutHelp(false)} />
      
      {showSettings && (
          <SettingsModal 
            isOpen={showSettings} 
            onClose={() => setShowSettings(false)} 
            user={user} 
            onUpdateUser={onUpdateUser}
            onLogout={onLogout}
          />
      )}

      {/* PDF Library Modal */}
      {showPdfViewer && (
        <PdfViewer 
            isOpen={showPdfViewer} 
            onClose={() => setShowPdfViewer(false)} 
            library={pdfLibrary}
            onAddToLibrary={(files) => setPdfLibrary(prev => [...prev, ...files])}
            onDefineWord={handleDefineWord}
        />
      )}
    </div>
  );
}

export default App;
