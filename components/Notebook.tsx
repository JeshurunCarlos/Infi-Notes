
import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { createPortal } from 'react-dom';
// Fixed: Removed non-existent Bars3Icon from imports
import { SparklesIcon, LightBulbIcon, MicrophoneIcon, ImageIcon, NoSymbolIcon, ClipboardIcon, TagIcon, CloseIcon, ChevronLeftIcon, ChevronRightIcon, SpeakerWaveIcon, PauseIcon, CogIcon, CheckIcon, SignalSlashIcon, CubeIcon, ArrowsPointingOutIcon, MinimizeIcon, PlusIcon, PencilIcon } from './Icons';
import Spinner from './Spinner';
import { ToDoItem, FloatingWidget, WidgetType } from '../types';
import ToDoList from './ToDoList';
import EditorToolbar from './EditorToolbar';
import SlashMenu from './SlashMenu';
import IconPicker from './IconPicker';
import { generateSpeechFromText, performGoogleSearch } from '../lib/ai';
import { WritingPen } from './WritingPen';
import MindMap from './MindMap';
import SummaryView from './SummaryView';
import { PomodoroWidget, ImageWidget, HyperlinkWidget, CalculatorWidget, StickyNoteWidget, MusicPlayerWidget, SpotifyWidget, ToDoListWidget, TerminalWidget, GoogleSearchWidget, DictionaryWidget, TicTacToeWidget, SnakeGameWidget, ChatGPTWidget, Game2048Widget, NewsWidget, WikipediaWidget, WeatherWidget, DownloadPdfWidget, WidgetSelectionView } from './Widgets';

interface NotebookProps {
  pageContent: string;
  pageTitle?: string;
  pageIcon?: string;
  pageCover?: string;
  pageTags: string[];
  allTags: string[];
  onNotesChange: (content: string) => void;
  onTitleChange: (title: string) => void;
  onIconChange: (icon: string) => void;
  onCoverChange: (cover: string) => void;
  onTagsChange: (tags: string[]) => void;
  onSummarize: () => void;
  isSummarizing: boolean;
  onStartRecall: () => void;
  isGeneratingQuiz: boolean;
  summaryContent: string | null;
  onCloseSummary: () => void;
  onAppendSummary: (text: string) => void;
  pageTodos?: ToDoItem[];
  onTodosChange: (todos: ToDoItem[]) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onOpenSettings?: () => void;
  onAutoEmbed?: (url: string) => void;
  isOnline?: boolean;
  onBackToShelf?: () => void;
  floatingWidgets?: FloatingWidget[];
  onAddFloatingWidget?: (widget: FloatingWidget) => void;
  onRemoveFloatingWidget?: (id: string) => void;
  onUpdateFloatingWidget?: (id: string, updates: Partial<FloatingWidget>) => void;
}

const Notebook = forwardRef<HTMLDivElement, NotebookProps>(({
  pageContent,
  pageTitle,
  pageIcon,
  pageCover,
  pageTags,
  allTags,
  onNotesChange,
  onTitleChange,
  onIconChange,
  onCoverChange,
  onTagsChange,
  onSummarize,
  isSummarizing,
  onStartRecall,
  isGeneratingQuiz,
  summaryContent,
  onCloseSummary,
  onAppendSummary,
  pageTodos,
  onTodosChange,
  onContextMenu,
  onOpenSettings,
  onAutoEmbed,
  isOnline = true,
  onBackToShelf,
  floatingWidgets = [],
  onAddFloatingWidget,
  onRemoveFloatingWidget,
  onUpdateFloatingWidget
}, ref) => {
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragOverNotebook, setDragOverNotebook] = useState(false);
  const [penState, setPenState] = useState({ x: 0, y: 0, opacity: 0, isWriting: false });
  const [showPenAnimation, setPenAnimation] = useState(() => {
      const saved = localStorage.getItem('infi-show-pen');
      return saved === null ? true : saved === 'true';
  });
  const [showAiActions, setShowAiActions] = useState(false);
  const [showMindMap, setShowMindMap] = useState(false);
  const [showMargin, setShowMargin] = useState(true);
  const [spellCheck, setSpellCheck] = useState(true);
  const [showEditorSettings, setShowEditorSettings] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  const recognitionRef = useRef<any>(null);
  const settingsBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (contentEditableRef.current && contentEditableRef.current.innerHTML !== pageContent) {
        if (document.activeElement !== contentEditableRef.current) {
             contentEditableRef.current.innerHTML = pageContent;
        }
    }
  }, [pageContent]);

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setDragOverNotebook(false);
      const jsonData = e.dataTransfer.getData('application/json');
      if (!jsonData) return;
      
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      try {
          const { type, data } = JSON.parse(jsonData);
          const x = e.clientX - rect.left - 125;
          const y = e.clientY - rect.top - 125;
          
          if (onAddFloatingWidget) {
              onAddFloatingWidget({
                  id: Date.now().toString(),
                  type,
                  data: data || {},
                  x,
                  y
              });
          }
      } catch (err) {
          console.error("Drop failed", err);
      }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    onNotesChange(e.currentTarget.innerHTML);
  };

  const startDictation = () => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
          alert("Your browser does not support Speech Recognition.");
          return;
      }

      if (!recognitionRef.current) {
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.continuous = true;
          recognitionRef.current.interimResults = true;
          recognitionRef.current.lang = 'en-US';

          recognitionRef.current.onresult = (event: any) => {
              let finalTranscript = '';
              for (let i = event.resultIndex; i < event.results.length; ++i) {
                  if (event.results[i].isFinal) {
                      finalTranscript += event.results[i][0].transcript;
                  }
              }
              
              if (finalTranscript) {
                  const editor = contentEditableRef.current;
                  if (editor) {
                      const text = finalTranscript.trim();
                      const selection = window.getSelection();
                      if (selection && selection.rangeCount > 0) {
                          const range = selection.getRangeAt(0);
                          const textNode = document.createTextNode(" " + text + " ");
                          range.insertNode(textNode);
                          range.setStartAfter(textNode);
                          range.setEndAfter(textNode);
                          selection.removeAllRanges();
                          selection.addRange(range);
                      } else {
                          editor.innerHTML += " " + text + " ";
                      }
                      onNotesChange(editor.innerHTML);
                  }
              }
          };

          recognitionRef.current.onerror = (event: any) => {
              console.error('Speech recognition error', event.error);
              setIsDictating(false);
          };

          recognitionRef.current.onend = () => {
              setIsDictating(false);
          };
      }

      if (isDictating) {
          recognitionRef.current.stop();
          setIsDictating(false);
      } else {
          recognitionRef.current.start();
          setIsDictating(true);
          setShowAiActions(false);
      }
  };

  const handleFloatingWidgetMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const width = rect.width;
    const height = rect.height;
    const xPct = (x / width - 0.5) * 20; 
    const yPct = (y / height - 0.5) * -20; 
    e.currentTarget.style.transform = `perspective(1000px) rotateX(${yPct}deg) rotateY(${xPct}deg) scale(1.05)`;
    e.currentTarget.style.zIndex = '150';
  };

  const handleFloatingWidgetMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)`;
    e.currentTarget.style.zIndex = '100';
  };

  const renderFloatingWidget = (w: FloatingWidget) => {
    const handleWidgetDrag = (e: React.MouseEvent) => {
        if (!w.isDragging) return;
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        onUpdateFloatingWidget?.(w.id, {
            x: e.clientX - rect.left - 125,
            y: e.clientY - rect.top - 15
        });
    };

    const renderInnerContent = () => {
        if (w.type === 'empty') {
            return (
                <div onClick={() => onUpdateFloatingWidget?.(w.id, { type: 'selecting' })} className="w-full h-full bg-[var(--bg-primary)] flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors group/inner">
                    <div className="p-4 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] group-hover/inner:border-[var(--accent)] transition-all"><PlusIcon className="w-8 h-8 text-[var(--accent)]" /></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Add Widget</span>
                </div>
            );
        }
        if (w.type === 'selecting') {
            return <WidgetSelectionView onSelect={(type) => onUpdateFloatingWidget?.(w.id, { type, data: {} })} onCancel={() => onRemoveFloatingWidget?.(w.id)} iconSize="normal" />;
        }
        switch (w.type) {
            case 'pomodoro': return <PomodoroWidget />;
            case 'chatgpt': return <ChatGPTWidget data={w.data} isOnline={isOnline} onChange={(d: any) => onUpdateFloatingWidget?.(w.id, { data: d })} />;
            case 'todolist': return <ToDoListWidget data={w.data} onChange={(d: any) => onUpdateFloatingWidget?.(w.id, { data: d })} />;
            case 'calculator': return <CalculatorWidget />;
            case 'googlesearch': return <GoogleSearchWidget data={w.data} isOnline={isOnline} onSearch={async (q: string) => { const res = await performGoogleSearch(q); onUpdateFloatingWidget?.(w.id, { data: { ...res, query: q } }); }} />;
            case 'stickynote': return <StickyNoteWidget data={w.data} onChange={(d: any) => onUpdateFloatingWidget?.(w.id, { data: d })} />;
            case 'news': return <NewsWidget isOnline={isOnline} data={w.data} onChange={(d: any) => onUpdateFloatingWidget?.(w.id, { data: d })} />;
            case 'wikipedia': return <WikipediaWidget data={w.data} isOnline={isOnline} onChange={(d: any) => onUpdateFloatingWidget?.(w.id, { data: d })} />;
            case 'weather': return <WeatherWidget data={w.data} isOnline={isOnline} onChange={(d: any) => onUpdateFloatingWidget?.(w.id, { data: d })} />;
            case 'spotify': return <SpotifyWidget data={w.data} isOnline={isOnline} onChange={(d: any) => onUpdateFloatingWidget?.(w.id, { data: d })} />;
            case 'music': return <MusicPlayerWidget data={w.data} />;
            case 'image': return <ImageWidget data={w.data} onChange={(d: any) => onUpdateFloatingWidget?.(w.id, { data: d })} />;
            case 'hyperlink': return <HyperlinkWidget data={w.data} onChange={(d: any) => onUpdateFloatingWidget?.(w.id, { data: d })} />;
            case 'terminal': return <TerminalWidget data={w.data} onCommand={(c: any, a: any) => { const history = w.data?.history || []; onUpdateFloatingWidget?.(w.id, { data: { ...w.data, history: [...history, `> ${c} ${a.join(' ')}`, `Command executed.`] } }); }} />;
            case 'tictactoe': return <TicTacToeWidget />;
            case 'snake': return <SnakeGameWidget />;
            case 'game2048': return <Game2048Widget />;
            default: return <div className="p-4 text-xs italic">Unsupported Detached Type</div>;
        }
    };

    return (
        <div 
            key={w.id} 
            className={`w-[250px] h-[250px] bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto transition-transform duration-200 ease-out group/float ${w.type === 'empty' ? 'rgb-gradient-border' : ''}`}
            style={{ position: 'absolute' as const, left: w.x, top: w.y, zIndex: 100 }}
            onMouseMove={(e) => { handleFloatingWidgetMouseMove(e); handleWidgetDrag(e); }}
            onMouseLeave={handleFloatingWidgetMouseLeave}
            onMouseUp={() => onUpdateFloatingWidget?.(w.id, { isDragging: false })}
        >
            <div className="h-8 bg-[var(--bg-primary)]/50 backdrop-blur-sm border-b border-[var(--border-primary)] flex items-center justify-between px-2 cursor-grab active:cursor-grabbing shrink-0 z-20" onMouseDown={() => onUpdateFloatingWidget?.(w.id, { isDragging: true })}>
                <div className="flex items-center gap-2"><span className="text-[9px] font-black uppercase text-[var(--accent)] tracking-widest">{w.type}</span></div>
                <button onClick={() => onRemoveFloatingWidget?.(w.id)} className="p-1 hover:bg-rose-500/20 rounded-full text-rose-500 transition-colors"><CloseIcon className="w-3.5 h-3.5" /></button>
            </div>
            <div className={`flex-grow overflow-hidden relative ${w.isDragging ? 'pointer-events-none' : ''}`}>{renderInnerContent()}</div>
        </div>
    );
  };

  const handleTogglePen = () => {
    const newState = !showPenAnimation;
    setPenAnimation(newState);
    localStorage.setItem('infi-show-pen', String(newState));
  };

  return (
    <div 
        className={`flex flex-col h-full bg-transparent relative overflow-hidden notebook-root transition-all ${dragOverNotebook ? 'ring-4 ring-inset ring-[var(--accent)]/30 bg-[var(--accent)]/5' : ''}`} 
        ref={(node) => { containerRef.current = node; if (typeof ref === 'function') ref(node); else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node; }}
        onDragOver={(e) => { e.preventDefault(); setDragOverNotebook(true); }}
        onDragLeave={() => setDragOverNotebook(false)}
        onDrop={handleDrop}
        onContextMenu={onContextMenu}
    >
      {showPenAnimation && <WritingPen x={penState.x} y={penState.y} opacity={penState.opacity} isWriting={penState.isWriting} />}

      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">{floatingWidgets.map(renderFloatingWidget)}</div>

      {(isSummarizing || isGeneratingQuiz) && (
          <div className="absolute bottom-6 right-6 z-[60] animate-[popIn_0.4s_cubic-bezier(0.16,1,0.3,1)]">
              <div className="bg-[var(--bg-secondary-glass)] backdrop-blur-2xl border border-[var(--border-primary)] rounded-2xl p-4 shadow-2xl flex items-center gap-4 min-w-[240px] ring-1 ring-white/10">
                  <div className="relative">
                      <div className="absolute inset-0 bg-[var(--accent)]/20 blur-xl rounded-full animate-pulse"></div>
                      <div className="relative p-2.5 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-primary)] text-[var(--accent)]">
                          {isSummarizing ? <SparklesIcon className="w-6 h-6 animate-[spin_3s_linear_infinite]" /> : <LightBulbIcon className="w-6 h-6 animate-pulse" />}
                      </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] opacity-80">Gemini Neural Link</span>
                      <span className="text-xs font-bold text-[var(--text-primary)]">{isSummarizing ? "Synthesizing Protocol..." : "Generating Assessment..."}</span>
                  </div>
                  <div className="ml-auto"><Spinner className="w-4 h-4 text-[var(--text-secondary)] opacity-40" /></div>
              </div>
          </div>
      )}

      <div className="flex-shrink-0 relative z-10 bg-transparent">
          <div className={`relative w-full bg-[var(--bg-secondary)]/10 z-0 transition-all duration-300 ease-in-out overflow-hidden group/cover ${pageCover ? 'h-40 border-b border-[var(--border-primary)]/10' : 'h-1 hover:h-40 hover:border-b border-[var(--border-primary)]/10'}`}>
              {pageCover ? (
                  <>
                    <img src={pageCover} alt="Cover" className="w-full h-full object-cover opacity-90" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/10 to-transparent opacity-100"></div>
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover/cover:opacity-100 transition-opacity z-20 flex gap-2">
                        <button className="bg-black/40 text-white p-1.5 rounded hover:bg-black/60 transition-colors btn-press text-[10px] font-black uppercase flex items-center gap-1 border border-white/10 backdrop-blur-sm"><ImageIcon className="w-3 h-3" /> Update</button>
                        <button className="bg-rose-50/50 text-white p-1.5 rounded hover:bg-rose-600 transition-colors btn-press border border-white/10 backdrop-blur-sm" onClick={() => onCoverChange("")}><NoSymbolIcon className="w-3 h-3" /></button>
                    </div>
                  </>
              ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-primary-glass)] shadow-2xl border border-[var(--border-primary)] hover:scale-105 transition-transform"><ImageIcon className="w-4 h-4" /><span className="text-[10px] font-black uppercase tracking-widest">Set Cover</span></button>
                  </div>
              )}
          </div>

          <div className="px-8 pt-4 pb-2 relative z-10 group/header bg-[var(--bg-primary-glass)] backdrop-blur-xl border-b border-[var(--border-primary)]/10">
              <div className="flex items-center gap-4 mb-2">
                  {onBackToShelf && (
                      <button onClick={onBackToShelf} className="p-2 rounded-xl bg-[var(--bg-secondary)]/50 text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--bg-primary)] transition-all flex-shrink-0 shadow-sm border border-[var(--border-primary)]/20" title="Back to Shelf"><ChevronLeftIcon className="w-6 h-6" /></button>
                  )}
                  <div className={`group relative w-14 h-14 bg-[var(--bg-primary)] rounded-xl border-2 border-[var(--border-primary)]/30 flex items-center justify-center text-2xl shadow-xl cursor-pointer hover:bg-[var(--bg-secondary)] transition-all z-20 duration-300 ${pageCover ? '-mt-12' : 'mt-0'}`}>{pageIcon || "📄"}</div>
              </div>
              <div className="flex items-center gap-4 relative z-10 w-full mb-1">
                  <input type="text" value={pageTitle || ""} onChange={(e) => onTitleChange(e.target.value)} className="text-4xl font-black bg-transparent outline-none placeholder-[var(--text-secondary)]/20 flex-grow text-[var(--text-primary)] tracking-tighter italic uppercase drop-shadow-sm" placeholder="PROTOCOL INDEX"/>
                  <button onClick={() => setShowMindMap(true)} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-500/10 text-indigo-600 border border-indigo-200 hover:bg-indigo-600 hover:text-white transition-all duration-300 btn-press group shadow-sm"><CubeIcon className="w-4 h-4 group-hover:rotate-12 transition-transform" /><span className="text-[10px] font-black uppercase tracking-widest">Mind Map</span></button>
              </div>
              <div className="flex items-center gap-1.5 pb-2 relative z-10">
                  <EditorToolbar />
                  <div className="w-px h-5 bg-[var(--border-primary)]/20 mx-1"></div>
                  <div className="relative">
                      <button ref={settingsBtnRef} onClick={() => setShowEditorSettings(!showEditorSettings)} className={`p-1.5 rounded-full transition-all ${showEditorSettings ? 'bg-[var(--accent)] text-white shadow-lg rotate-90' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'}`}><CogIcon className="w-4 h-4" /></button>
                      {showEditorSettings && createPortal(
                          <div 
                            className="fixed z-[100] bg-[var(--bg-secondary)]/95 backdrop-blur-xl border border-[var(--border-primary)] rounded-2xl shadow-2xl p-2 w-56 flex flex-col gap-1 animate-[popIn_0.2s_ease-out]"
                            style={{ 
                                top: settingsBtnRef.current ? settingsBtnRef.current.getBoundingClientRect().bottom + 8 : 0, 
                                left: settingsBtnRef.current ? settingsBtnRef.current.getBoundingClientRect().left : 0 
                            }}
                          >
                               <button onClick={handleTogglePen} className="flex items-center justify-between px-3 py-2 text-xs font-bold rounded-xl hover:bg-[var(--bg-primary)] transition-colors group">
                                   <div className="flex items-center gap-3">
                                       <div className={`p-1.5 rounded-lg border transition-colors ${showPenAnimation ? 'bg-amber-100 border-amber-300 text-amber-600' : 'bg-slate-100 border-slate-300 text-slate-500'}`}><PencilIcon className="w-3.5 h-3.5" /></div>
                                       <span>Pen Animation</span>
                                   </div>
                                   <div className={`w-3.5 h-3.5 rounded-full border-2 ${showPenAnimation ? 'bg-emerald-500 border-emerald-600' : 'bg-transparent border-slate-300'}`} />
                               </button>
                               <button onClick={() => setShowMargin(!showMargin)} className="flex items-center justify-between px-3 py-2 text-xs font-bold rounded-xl hover:bg-[var(--bg-primary)] transition-colors group">
                                   <div className="flex items-center gap-3">
                                       <div className={`p-1.5 rounded-lg border transition-colors ${showMargin ? 'bg-indigo-100 border-indigo-300 text-indigo-600' : 'bg-slate-100 border-slate-300 text-slate-500'}`}><ArrowsPointingOutIcon className="w-3.5 h-3.5" /></div>
                                       <span>Show Margin</span>
                                   </div>
                                   <div className={`w-3.5 h-3.5 rounded-full border-2 ${showMargin ? 'bg-emerald-500 border-emerald-600' : 'bg-transparent border-slate-300'}`} />
                               </button>
                               <button onClick={() => setSpellCheck(!spellCheck)} className="flex items-center justify-between px-3 py-2 text-xs font-bold rounded-xl hover:bg-[var(--bg-primary)] transition-colors group">
                                   <div className="flex items-center gap-3">
                                       <div className={`p-1.5 rounded-lg border transition-colors ${spellCheck ? 'bg-emerald-100 border-emerald-300 text-emerald-600' : 'bg-slate-100 border-slate-300 text-slate-500'}`}><CheckIcon className="w-3.5 h-3.5" /></div>
                                       <span>Spell Check</span>
                                   </div>
                                   <div className={`w-3.5 h-3.5 rounded-full border-2 ${spellCheck ? 'bg-emerald-500 border-emerald-600' : 'bg-transparent border-slate-300'}`} />
                               </button>
                               <div className="h-px bg-[var(--border-primary)]/50 my-1" />
                               <div className="px-3 py-2">
                                   <p className="text-[9px] font-black uppercase text-[var(--text-secondary)] opacity-50 tracking-widest">Protocol Version v2.1</p>
                               </div>
                          </div>,
                          document.body
                      )}
                  </div>
                  {isDictating && (
                      <div className="flex items-center gap-2 ml-auto animate-pulse text-rose-500 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                          <MicrophoneIcon className="w-4 h-4" /><span className="text-[10px] font-black uppercase tracking-widest">Recording Speech...</span>
                          <button onClick={() => { recognitionRef.current?.stop(); setIsDictating(false); }} className="ml-1 p-0.5 hover:bg-rose-500/20 rounded-full"><CloseIcon className="w-3 h-3" /></button>
                      </div>
                  )}
              </div>
          </div>
      </div>

      <div className="flex-grow flex flex-col overflow-hidden relative z-0 bg-transparent">
          {summaryContent && (
              <div className="absolute inset-0 z-50 flex items-center justify-center p-8 bg-[var(--bg-primary)]/10 pointer-events-none">
                  <div className="pointer-events-auto w-full max-w-2xl h-fit">
                    <SummaryView summaryContent={summaryContent} onClose={onCloseSummary} onAppend={onAppendSummary} />
                  </div>
              </div>
          )}
          <div 
            className={`flex-grow overflow-y-auto outline-none custom-scrollbar notebook-textarea pb-32 ${showMargin ? '' : 'no-margin'}`}
            ref={contentEditableRef}
            contentEditable
            onInput={handleInput}
            onBlur={() => onNotesChange(contentEditableRef.current?.innerHTML || "")}
            suppressContentEditableWarning
            data-placeholder="Type '/' for component index..."
            spellCheck={spellCheck}
          />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col-reverse items-center gap-4 pointer-events-none">
              <button onClick={() => setShowAiActions(!showAiActions)} className={`pointer-events-auto w-12 h-12 rounded-full bg-[var(--accent)] text-white shadow-2xl flex items-center justify-center hover:scale-110 transition-all duration-300 hover:shadow-[var(--accent)]/30 btn-press z-50 ${showAiActions ? 'rotate-45' : ''}`}><SparklesIcon className="w-6 h-6" /></button>
              <div className={`flex flex-col gap-2 pointer-events-auto transition-all duration-300 ease-out origin-bottom items-center ${showAiActions ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-90 pointer-events-none'}`}>
                  <button onClick={startDictation} className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-xl transition-all btn-press bg-rose-50 text-rose-500 border border-rose-200 hover:bg-rose-500 hover:text-white shadow-xl">
                      <MicrophoneIcon className="w-4 h-4" /><span>{isDictating ? 'Stop Dictation' : 'Start Dictation'}</span>
                  </button>
                  <button onClick={() => { onSummarize(); setShowAiActions(false); }} className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-xl transition-all btn-press bg-[var(--bg-primary-glass)] text-[var(--text-primary)] border border-[var(--border-primary)]/50 hover:bg-[var(--bg-primary)] shadow-xl backdrop-blur-xl"><span>Summarize</span></button>
                  <button onClick={() => { onStartRecall(); setShowAiActions(false); }} className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-xl transition-all btn-press bg-[var(--accent)] text-white border border-white/10 hover:opacity-90 shadow-xl shadow-[var(--accent)]/20"><span>Active Recall</span></button>
              </div>
          </div>
      </div>
      {showMindMap && <MindMap onClose={() => setShowMindMap(false)} />}
    </div>
  );
});

export default Notebook;
