import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
    PlusIcon, CloseIcon, FilmIcon, UploadIcon, MinimizeIcon, QueueListIcon, TrashIcon, NewspaperIcon, 
    LinkIcon, ImageIcon, NoSymbolIcon, PlayIcon, DocumentTextIcon, TimerIcon, CalculatorIcon, 
    ClipboardIcon, MusicalNoteIcon, PauseIcon, BackwardIcon, ForwardIcon, SpotifyIcon, 
    MinusIcon, TerminalIcon, ArrowsPointingInIcon, EyeIcon, EyeSlashIcon, GoogleIcon, 
    ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon, SpeakerWaveIcon, 
    SpeakerXMarkIcon, FolderIcon, SparklesIcon, ArrowPathIcon, LanguageIcon, 
    ClipboardDocumentCheckIcon, ArrowsPointingOutIcon, BoltIcon, ChatBubbleLeftRightIcon, 
    CubeIcon, ListBulletIcon, Squares2X2Icon, ArrowDownTrayIcon, GlobeIcon, 
    BookOpenIcon, CloudIcon, SignalSlashIcon, CheckIcon 
} from './Icons';
import { WidgetState, WidgetType } from '../types';
import { PomodoroWidget, ImageWidget, HyperlinkWidget, CalculatorWidget, StickyNoteWidget, MusicPlayerWidget, WidgetWrapper, WidgetSelectionView, SpotifyWidget, ToDoListWidget, TerminalWidget, GoogleSearchWidget, DictionaryWidget, TicTacToeWidget, SnakeGameWidget, ChatGPTWidget, Game2048Widget, NewsWidget, WikipediaWidget, WeatherWidget, DownloadPdfWidget } from './Widgets';
import { performGoogleSearch } from '../lib/ai';
import Spinner from './Spinner';

interface MediaPanelProps {
    videoUrl: string;
    onVideoUrlChange: (url: string) => void;
    onLoadVideo: () => void;
    videoId: string | null;
    widgets: WidgetState[];
    onWidgetPlaceholderClick: (index: number) => void;
    onSelectWidget: (index: number, type: WidgetType) => void;
    updateWidgetData: (index: number, data: any) => void;
    onRemoveWidget: (index: number) => void;
    activeWidgetIndex: number | null;
    onSetActiveWidget: (index: number) => void;
    onToggleWidgetBg: (index: number) => void;
    onTerminalCommand: (index: number, command: string, args: string[]) => void;
    onMoveWidget: (fromIndex: number, toIndex: number) => void;
    videoVisible: boolean;
    widgetsVisible: boolean;
    onContextMenu: (e: React.MouseEvent, type: 'video-section' | 'widget-section' | 'specific-widget', index?: number) => void;
    onUpdateWidgetPosition?: (index: number, position: { x: number, y: number }) => void;
    onDownloadNotes?: () => void;
    isOnline?: boolean;
    animStage?: number; 
    onWidgetHoverStateChange?: (isHovering: boolean) => void;
    layoutMode?: 'modern' | 'classic';
}

const getStandardizedYoutubeUrl = (input: string): string | null => {
    if (!input) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)|shorts\//;
    const match = input.match(regExp);
    let id = '';
    if (match) {
        id = input.split(match[0])[1].split(/[?&]/)[0];
    } else if (input.length === 11) {
        id = input;
    }
    return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1` : null;
};

const MediaPanel: React.FC<MediaPanelProps> = ({ 
    videoUrl, 
    onVideoUrlChange, 
    onLoadVideo, 
    videoId,
    widgets,
    onWidgetPlaceholderClick,
    onSelectWidget,
    updateWidgetData,
    onRemoveWidget,
    activeWidgetIndex,
    onSetActiveWidget,
    onToggleWidgetBg,
    onTerminalCommand,
    onMoveWidget,
    videoVisible,
    widgetsVisible,
    onContextMenu,
    onUpdateWidgetPosition,
    onDownloadNotes,
    isOnline = true,
    animStage = 5,
    onWidgetHoverStateChange,
    layoutMode = 'modern'
}) => {
  const [mediaType, setMediaType] = useState<'selection' | 'document' | 'video'>('selection');
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [iframeLoading, setIframeLoading] = useState(false);
  const [inputType, setInputType] = useState<'video' | 'pdf'>('video');
  const [expandedWidget, setExpandedWidget] = useState<{ index: number, type: WidgetType } | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const standardizedEmbedUrl = videoId ? getStandardizedYoutubeUrl(videoId) : null;

  useEffect(() => { if (videoId) setIframeLoading(true); }, [videoId]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        const url = URL.createObjectURL(file);
        if (documentUrl) URL.revokeObjectURL(documentUrl);
        setDocumentUrl(url);
        setMediaType('document');
      } else alert('Please upload a valid PDF file.');
    }
  }, [documentUrl]);

  const handleBackToSelection = useCallback(() => {
    if (mediaType === 'document' && documentUrl) {
      URL.revokeObjectURL(documentUrl);
      setDocumentUrl(null);
    }
    setMediaType('selection');
  }, [mediaType, documentUrl]);

  const handleSearch = async (index: number, query: string) => {
      if (!isOnline) return;
      updateWidgetData(index, { ...widgets[index].data, loading: true, error: null });
      try {
        const result = await performGoogleSearch(query);
        updateWidgetData(index, { query, ...result, loading: false });
      } catch (e) {
        updateWidgetData(index, { ...widgets[index].data, loading: false, error: 'Search failed' });
      }
  };

  const handleWidgetMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingIndex !== null) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const width = rect.width;
    const height = rect.height;
    const xPct = (x / width - 0.5) * 20; 
    const yPct = (y / height - 0.5) * -20; 
    e.currentTarget.style.transform = `perspective(1000px) rotateX(${yPct}deg) rotateY(${xPct}deg) scale(1.1)`;
    e.currentTarget.style.zIndex = '50';
    if (onWidgetHoverStateChange) onWidgetHoverStateChange(true);
  };

  const handleWidgetMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)`;
    e.currentTarget.style.zIndex = 'auto';
    if (onWidgetHoverStateChange) onWidgetHoverStateChange(false);
  };

  const handleDragStart = (e: React.DragEvent, index: number, widget: WidgetState) => {
    if (widget.type === 'selecting') { e.preventDefault(); return; }
    const target = e.currentTarget as HTMLDivElement;
    target.style.transform = 'none';
    setDraggingIndex(index);
    const data = { type: widget.type, data: widget.data || {}, originalIndex: index };
    const jsonString = JSON.stringify(data);
    e.dataTransfer.setData('application/json', jsonString);
    e.dataTransfer.setData('text/plain', jsonString);
    e.dataTransfer.setData('media_panel_index', index.toString());
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (draggingIndex === null || draggingIndex === index) return;
      setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
      e.preventDefault(); e.stopPropagation();
      const fromIndexStr = e.dataTransfer.getData('media_panel_index');
      if (fromIndexStr) {
          const fromIndex = parseInt(fromIndexStr, 10);
          if (!isNaN(fromIndex) && fromIndex !== toIndex) onMoveWidget(fromIndex, toIndex);
      }
      setDraggingIndex(null); setDragOverIndex(null);
  };

  const handleDragEnd = () => { setDraggingIndex(null); setDragOverIndex(null); };

  const renderWidgetContent = (widget: WidgetState, index: number) => {
    switch (widget.type) {
      case 'pomodoro': return <PomodoroWidget />;
      case 'image': return <ImageWidget data={widget.data} onChange={(data) => updateWidgetData(index, data)} />;
      case 'hyperlink': return <HyperlinkWidget data={widget.data} onChange={(data) => updateWidgetData(index, data)} />;
      case 'calculator': return <CalculatorWidget onExpand={() => setExpandedWidget({ index, type: 'calculator' })} />;
      case 'stickynote': return <StickyNoteWidget data={widget.data} onChange={(data) => updateWidgetData(index, data)} />;
      case 'music': return <MusicPlayerWidget data={widget.data} />;
      case 'spotify': return <SpotifyWidget isOnline={isOnline} data={widget.data} onChange={(data) => updateWidgetData(index, data)} />;
      case 'todolist': return <ToDoListWidget data={widget.data} onChange={(data) => updateWidgetData(index, data)} />;
      case 'terminal': return <TerminalWidget data={widget.data} onCommand={(c: any, a: any) => onTerminalCommand(index, c, a)} />;
      case 'googlesearch': return <GoogleSearchWidget isOnline={isOnline} data={widget.data} onSearch={(q: any) => handleSearch(index, q)} onExpand={() => setExpandedWidget({ index, type: 'googlesearch' })} />;
      case 'chatgpt': return <ChatGPTWidget isOnline={isOnline} data={widget.data} onChange={(d: any) => updateWidgetData(index, d)} onExpand={() => setExpandedWidget({ index, type: 'chatgpt' })} />;
      case 'news': return <NewsWidget isOnline={isOnline} onChange={(d: any) => updateWidgetData(index, d)} isExpanded={false} />;
      case 'wikipedia': return <WikipediaWidget isOnline={isOnline} data={widget.data} onChange={(d: any) => updateWidgetData(index, d)} onExpand={() => setExpandedWidget({ index, type: 'wikipedia' })} />;
      case 'weather': return <WeatherWidget isOnline={isOnline} data={widget.data} onChange={(d: any) => updateWidgetData(index, d)} />;
      case 'downloadpdf': return <DownloadPdfWidget onDownload={onDownloadNotes} />;
      case 'tictactoe': return <TicTacToeWidget />;
      case 'game2048': return <Game2048Widget />;
      case 'snake': return <SnakeGameWidget />;
      default: return null;
    }
  };

  const isModern = layoutMode === 'modern';
  const dockBaseClasses = isModern ? 'rounded-3xl border border-[var(--border-primary)]/10 bg-[var(--bg-secondary)]/10 backdrop-blur-sm overflow-hidden relative shadow-lg' : ''; 
  const rootClasses = isModern ? 'flex flex-col h-full bg-transparent gap-3' : 'flex flex-col h-full overflow-hidden relative mediapanel-root bg-[var(--bg-primary)]';
  const videoClasses = isModern
    ? `flex-shrink-0 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${widgetsVisible ? 'h-[60%]' : 'h-full'} ${dockBaseClasses}`
    : `flex-shrink-0 relative section-animated-bg transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${widgetsVisible ? 'h-[65%] border-b border-[var(--border-primary)]' : 'h-full'}`;
  const widgetsClasses = isModern
    ? `flex-grow relative custom-scrollbar transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${dockBaseClasses} p-4 pt-14`
    : `flex-grow bg-[var(--bg-primary)] relative overflow-y-auto custom-scrollbar p-1.5 section-animated-bg transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] pt-4`;

  return (
    <div className={rootClasses}>
      {expandedWidget && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
            <div className={`relative bg-[var(--bg-secondary)] shadow-2xl rounded-xl overflow-hidden border border-[var(--border-primary)] animate-[spring-up_0.5s_cubic-bezier(0.16,1,0.3,1)] ${expandedWidget.type === 'calculator' ? 'w-[320px] h-[500px]' : 'w-full max-w-lg h-[70vh]'}`}>
                <button onClick={() => setExpandedWidget(null)} className="absolute top-2 right-2 z-50 p-2 rounded-full bg-black/20 hover:bg-red-500 hover:text-white text-[var(--text-primary)] shadow-md backdrop-blur-md border border-white/10 transition-all"><MinimizeIcon className="w-5 h-5" /></button>
                {expandedWidget.type === 'calculator' && <CalculatorWidget isScientific={true} onClose={() => setExpandedWidget(null)} />}
                {expandedWidget.type === 'googlesearch' && <GoogleSearchWidget isOnline={isOnline} data={widgets[expandedWidget.index].data} onSearch={(q: any) => handleSearch(expandedWidget.index, q)} />}
                {expandedWidget.type === 'chatgpt' && <ChatGPTWidget isOnline={isOnline} data={widgets[expandedWidget.index].data} onChange={(d: any) => updateWidgetData(expandedWidget.index, d)} />}
                {expandedWidget.type === 'news' && <NewsWidget isOnline={isOnline} onChange={(d: any) => updateWidgetData(expandedWidget.index, d)} isExpanded={true} />}
                {expandedWidget.type === 'wikipedia' && <WikipediaWidget isOnline={isOnline} data={widgets[expandedWidget.index].data} onChange={(d: any) => updateWidgetData(expandedWidget.index, d)} isExpanded={true} />}
                {expandedWidget.type === 'weather' && <WeatherWidget isOnline={isOnline} data={widgets[expandedWidget.index].data} onChange={(d: any) => updateWidgetData(expandedWidget.index, d)} />}
            </div>
        </div>
      )}
      {videoVisible && (
        <div className={`${videoClasses} ${animStage >= 2 ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`} onContextMenu={(e) => onContextMenu(e, 'video-section')}>
            {(animStage === 3 || animStage === 4) && (
                <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none bg-[var(--bg-secondary)]/60 backdrop-blur-xl border border-[var(--border-primary)]/20 shadow-2xl ${isModern ? 'rounded-3xl' : ''} ${animStage === 3 ? 'animate-[fadeIn_0.5s_ease-out]' : 'animate-brush-exit'}`}>
                    <span className="text-4xl font-black uppercase tracking-[0.5em] text-[var(--text-primary)]/40 drop-shadow-sm animate-pulse">Media</span>
                    <div className="h-0.5 w-64 bg-gradient-to-r from-transparent via-[var(--accent)]/50 to-transparent mt-4"></div>
                </div>
            )}
            {mediaType === 'selection' ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 gap-10 animate-[popIn_0.4s_ease-out] overflow-hidden bg-[var(--bg-primary)]/50">
                    <div className="relative z-10 flex flex-col md:flex-row gap-8 w-full max-w-4xl justify-center items-center">
                        <button onClick={() => setInputType('video')} className={`group relative w-full md:w-80 h-44 rounded-[2.5rem] border-2 transition-all duration-500 shadow-2xl flex flex-col items-center justify-center gap-4 overflow-hidden ${inputType === 'video' ? 'border-red-500 bg-[var(--bg-primary)] scale-105 ring-4 ring-red-500/10' : 'border-[var(--border-primary)]/50 bg-transparent opacity-60 hover:opacity-100 hover:border-red-500 hover:bg-[var(--bg-secondary)]/50'}`}>
                            <div className={`p-5 rounded-3xl transition-all duration-500 group-hover:scale-110 ${inputType === 'video' ? 'bg-red-500 text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}><PlayIcon className="w-10 h-10" /></div>
                            <div className="text-center"><span className={`text-lg font-black uppercase tracking-tighter block ${inputType === 'video' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>Video Studio</span><span className="text-[10px] font-bold uppercase tracking-widest opacity-40">YouTube / Vimeo</span></div>
                        </button>
                        <button onClick={() => setInputType('pdf')} className={`group relative w-full md:w-80 h-44 rounded-[2.5rem] border-2 transition-all duration-500 shadow-2xl flex flex-col items-center justify-center gap-4 overflow-hidden ${inputType === 'pdf' ? 'border-orange-500 bg-[var(--bg-primary)] scale-105 ring-4 ring-orange-500/10' : 'border-[var(--border-primary)]/50 bg-transparent opacity-60 hover:opacity-100 hover:border-orange-500 hover:bg-[var(--bg-secondary)]/50'}`}>
                            <div className={`p-5 rounded-3xl transition-all duration-500 group-hover:scale-110 ${inputType === 'pdf' ? 'bg-orange-500 text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}><DocumentTextIcon className="w-10 h-10" /></div>
                            <div className="text-center"><span className={`text-lg font-black uppercase tracking-tighter block ${inputType === 'pdf' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>Research Hub</span><span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Document Analysis</span></div>
                        </button>
                    </div>
                    <div className="relative z-10 w-full max-w-2xl animate-[smooth-rise_0.6s_ease-out_0.2s_both]">
                        <div className="bg-[var(--bg-primary)]/80 backdrop-blur-2xl p-2 rounded-[2rem] border border-[var(--border-primary)]/50 shadow-2xl flex flex-col md:flex-row gap-2 ring-1 ring-white/10">
                            {inputType === 'video' ? (
                                <>
                                    <div className="flex-grow flex items-center px-4 gap-3"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div><input value={videoUrl} onChange={e => onVideoUrlChange(e.target.value)} placeholder="Paste URL to stream..." className="w-full h-12 bg-transparent text-[var(--text-primary)] font-bold text-sm outline-none placeholder:text-[var(--text-secondary)]/30"/></div>
                                    <button onClick={() => { setMediaType('video'); onLoadVideo(); }} disabled={!isOnline || !videoUrl.trim()} className={`h-12 px-10 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 ${!isOnline || !videoUrl.trim() ? 'bg-slate-500/20 text-slate-500 cursor-not-allowed opacity-50' : 'bg-red-500 text-white hover:opacity-90 hover:shadow-red-500/30'}`}>Initialize Stream</button>
                                </>
                            ) : (
                                <div onClick={() => fileInputRef.current?.click()} className="w-full h-14 border-2 border-dashed border-orange-500/50 rounded-[1.5rem] flex items-center justify-center gap-4 cursor-pointer hover:bg-orange-500/5 hover:border-orange-500 transition-all group/upload">
                                    <div className="p-2 bg-[var(--bg-secondary)] rounded-lg group-hover/upload:bg-orange-500 group-hover/upload:text-white transition-colors"><UploadIcon className="w-5 h-5" /></div>
                                    <span className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] group-hover/upload:text-[var(--text-primary)] transition-colors">Mount Local Protocol (PDF)</span>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="application/pdf" onChange={handleFileChange}/>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : mediaType === 'video' ? (
                <div className="w-full h-full bg-black relative group animate-[fadeIn_0.4s_ease-out] overflow-hidden pt-1">
                    <div className="absolute top-1 left-0 right-0 h-14 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-30 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-between px-6 transform -translate-y-2 group-hover:translate-y-0">
                         <div className="flex items-center gap-4"><div className="px-3 py-1 rounded-full bg-red-500 text-white flex items-center gap-2 shadow-lg border border-white/10"><div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div><span className="text-[9px] font-black uppercase tracking-widest">Live Stream</span></div><span className="text-[10px] font-bold text-white/60 uppercase tracking-tighter truncate max-w-[280px] drop-shadow-md">{videoUrl}</span></div>
                         <div className="flex items-center gap-2"><button onClick={() => { setMediaType('selection'); onVideoUrlChange(''); }} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all backdrop-blur-md border border-white/5" title="Switch Source"><ArrowPathIcon className="w-4 h-4" /></button><button onClick={handleBackToSelection} className="p-2.5 bg-rose-500/20 hover:bg-rose-500/40 rounded-xl text-rose-300 transition-all backdrop-blur-md border border-rose-500/20" title="Disconnect"><CloseIcon className="w-4 h-4" /></button></div>
                    </div>
                    <div className="relative z-10 w-full h-full flex items-center justify-center p-0">
                        {!isOnline ? (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-6 bg-slate-950 text-slate-500"><div className="p-8 rounded-full bg-slate-900 border border-slate-800 animate-pulse shadow-2xl"><SignalSlashIcon className="w-16 h-16 opacity-30" /></div><span className="font-black text-sm tracking-[0.4em] uppercase opacity-40">System Link Broken</span></div>
                        ) : standardizedEmbedUrl ? (
                            <iframe className="w-full h-full shadow-2xl" src={standardizedEmbedUrl} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-forms" referrerPolicy="strict-origin-when-cross-origin" onLoad={() => setIframeLoading(false)}/>
                        ) : null}
                    </div>
                </div>
            ) : (
                <div className="w-full h-full relative animate-[fadeIn_0.3s_ease-out] bg-[var(--bg-secondary)] flex flex-col pt-1">
                    <div className="flex-none h-14 border-b border-[var(--border-primary)]/30 bg-[var(--bg-primary-glass)] backdrop-blur-xl flex items-center justify-between px-6 z-20">
                        <div className="flex items-center gap-3"><div className="p-2 bg-orange-500 rounded-lg text-white shadow-md"><DocumentTextIcon className="w-4 h-4" /></div><span className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">Research Hub</span></div>
                        <button onClick={handleBackToSelection} className="p-2 rounded-xl bg-[var(--bg-secondary)] hover:bg-rose-500/10 text-[var(--text-secondary)] hover:text-rose-500 transition-all border border-[var(--border-primary)]/50"><CloseIcon className="w-4 h-4" /></button>
                    </div>
                    <div className="flex-grow relative"><iframe src={documentUrl!} className="w-full h-full border-none" title="PDF Viewer" /></div>
                </div>
            )}
        </div>
      )}
      {widgetsVisible && (
        <div className={`${widgetsClasses} ${animStage >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'} ${isModern ? 'bg-[var(--bg-primary)]/50' : ''}`} onContextMenu={(e) => onContextMenu(e, 'widget-section')}>
            {(animStage === 3 || animStage === 4) && (
                <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none bg-[var(--bg-secondary)]/60 backdrop-blur-xl border border-[var(--border-primary)]/20 shadow-2xl ${isModern ? 'rounded-3xl' : ''} ${animStage === 3 ? 'animate-[fadeIn_0.5s_ease-out]' : 'animate-brush-exit'}`}>
                    <span className="text-4xl font-black uppercase tracking-[0.5em] text-[var(--text-primary)]/40 drop-shadow-sm animate-pulse">Widgets</span>
                    <div className="h-0.5 w-64 bg-gradient-to-r from-transparent via-[var(--accent)]/50 to-transparent mt-4"></div>
                </div>
            )}
            <div className={`grid grid-cols-2 md:grid-cols-3 ${isModern ? 'gap-2' : 'gap-1.5'} pb-20 w-full auto-rows-min`}>
                {widgets.map((widget, index) => (
                    <div key={index} draggable={widget.type !== 'selecting'} onDragStart={(e) => handleDragStart(e, index, widget)} onDragOver={(e) => handleDragOver(e, index)} onDrop={(e) => handleDrop(e, index)} onDragEnd={handleDragEnd} className={`relative aspect-square rounded-2xl overflow-hidden transition-all duration-200 ease-out group shadow-sm hover:shadow-xl ${activeWidgetIndex===index ? 'ring-2 ring-[var(--accent)] z-20' : ''} ${dragOverIndex === index ? 'scale-105 opacity-90 ring-2 ring-[var(--accent)] z-20' : ''} ${widget.type==='empty' ? 'border-2 border-dashed border-[var(--border-primary)] cursor-grab active:cursor-grabbing' : 'bg-[var(--bg-secondary)] border border-[var(--border-primary)] cursor-grab active:cursor-grabbing'}`} onMouseMove={handleWidgetMouseMove} onMouseLeave={handleWidgetMouseLeave} onClick={() => { if (widget.type === 'empty') onWidgetPlaceholderClick(index); else onSetActiveWidget(index); }}>
                        {widget.type !== 'empty' && widget.type !== 'selecting' && (
                            <div className="absolute -top-1 -right-1 z-50 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={(e) => { e.stopPropagation(); onRemoveWidget(index); }} className="p-1.5 bg-rose-500 text-white rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all border border-white/20"><CloseIcon className="w-3.5 h-3.5" /></button></div>
                        )}
                        {widget.type === 'empty' ? (
                            <div className="w-full h-full bg-[var(--bg-primary)] rounded-[14px] flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors">
                                <div className="p-3 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] group-hover:border-[var(--accent)]"><PlusIcon className="w-6 h-6 text-[var(--accent)]" /></div>
                                <span className="text-[10px] font-black uppercase tracking-tight text-[var(--text-secondary)]">Add Widget</span>
                            </div>
                        ) : widget.type === 'selecting' ? (
                            <WidgetSelectionView onSelect={(type) => onSelectWidget(index, type)} onCancel={() => onRemoveWidget(index)} iconSize="normal" />
                        ) : (
                            <div className="w-full h-full overflow-hidden pointer-events-none">{renderWidgetContent(widget, index)}</div>
                        )}
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};
export default MediaPanel;