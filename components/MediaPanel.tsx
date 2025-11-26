
import React, { useState, useRef, useCallback } from 'react';
import { PlusIcon, CloseIcon, DocumentTextIcon, FilmIcon, ArrowsPointingOutIcon, UploadIcon } from './Icons';
import { WidgetState, WidgetType } from '../App';
import { PomodoroWidget, ImageWidget, HyperlinkWidget, CalculatorWidget, StickyNoteWidget, MusicPlayerWidget, WidgetWrapper, WidgetSelectionView, SpotifyWidget, ToDoListWidget, TerminalWidget, GoogleSearchWidget, DictionaryWidget, ZipGameWidget, TicTacToeWidget, SnakeGameWidget } from './Widgets';
import { performGoogleSearch } from '../lib/ai';

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
}

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
}) => {
  const [mediaType, setMediaType] = useState<'selection' | 'document' | 'video'>('selection');
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dropHint, setDropHint] = useState('Drop Here');
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  
  // New state for drag and drop sorting
  const [draggingWidgetIndex, setDraggingWidgetIndex] = useState<number | null>(null);

  const [expandedCalculatorIndex, setExpandedCalculatorIndex] = useState<number | null>(null);
  
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        const url = URL.createObjectURL(file);
        if (documentUrl) {
          URL.revokeObjectURL(documentUrl);
        }
        setDocumentUrl(url);
        setMediaType('document');
      } else {
        alert('Please upload a valid PDF file.');
      }
    }
  }, [documentUrl]);

  const handleBackToSelection = useCallback((e: React.MouseEvent) => {
    if (mediaType === 'document' && documentUrl) {
      URL.revokeObjectURL(documentUrl);
      setDocumentUrl(null);
    }
    setMediaType('selection');
  }, [mediaType, documentUrl]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
      e.preventDefault();
      
      // If dragging a widget, just update drop target style
      if (draggingWidgetIndex !== null) {
          setDragOverIndex(index);
          e.dataTransfer.dropEffect = 'move';
          return;
      }

      // External file/url handling
      if (dragOverIndex !== index) {
          setDragOverIndex(index);
          const types = e.dataTransfer.types;
          if (types.includes('Files')) {
              setDropHint('Drop Image or Audio File');
          } else if (types.includes('text/uri-list') || types.includes('text/plain')) {
              setDropHint('Drop Link or Text');
          } else {
              setDropHint('Drop Here');
          }
      }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, index: number) => {
      e.preventDefault();
      setDragOverIndex(null);

      // Handle Widget Reordering
      const widgetIndexStr = e.dataTransfer.getData('widgetIndex');
      if (widgetIndexStr) {
          const fromIndex = parseInt(widgetIndexStr, 10);
          if (!isNaN(fromIndex) && fromIndex !== index) {
              onMoveWidget(fromIndex, index);
          }
          setDraggingWidgetIndex(null);
          return;
      }

      // 1. Check for files (images or audio)
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const file = e.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
              const reader = new FileReader();
              reader.onload = (loadEvent) => {
                  if (loadEvent.target && typeof loadEvent.target.result === 'string') {
                      onSelectWidget(index, 'image');
                      updateWidgetData(index, { url: loadEvent.target.result });
                  }
              };
              reader.readAsDataURL(file);
              return;
          }
          if (file.type.startsWith('audio/')) {
            // If the widget is already a music player, we want to append to the queue, handled by the widget logic itself if dropped on the widget.
            // But here we are dropping on the container.
            // If it's empty, initialize new. If it's already music, append.
            
            const currentWidget = widgets[index];
            const url = URL.createObjectURL(file);
            const newSong = {
                id: Date.now().toString(),
                url: url,
                title: file.name.replace(/\.[^/.]+$/, ""),
                artist: 'Loading metadata...',
                isLocal: true,
                albumArt: null,
            };

            if (currentWidget.type === 'music') {
                // Append to existing queue
                const existingData = currentWidget.data || {};
                const currentQueue = existingData.queue || [];
                const newQueue = [...currentQueue, newSong];
                
                updateWidgetData(index, {
                    ...existingData,
                    queue: newQueue
                });

                 // Trigger metadata read
                 if (window.jsmediatags) {
                    window.jsmediatags.read(file, {
                        onSuccess: (tag: any) => {
                            const { title, artist, picture } = tag.tags;
                            let imageUrl = null;
                            if (picture) {
                               let base64String = "";
                                for (let i = 0; i < picture.data.length; i++) {
                                    base64String += String.fromCharCode(picture.data[i]);
                                }
                                imageUrl = `data:${picture.format};base64,${window.btoa(base64String)}`;
                            }
                            // Update the song in the queue
                            const updatedQueue = newQueue.map(s => s.id === newSong.id ? { ...s, title: title || s.title, artist: artist || 'Unknown Artist', albumArt: imageUrl } : s);
                            updateWidgetData(index, { ...existingData, queue: updatedQueue });
                        },
                        onError: () => { /* ignore */ }
                    });
                }

            } else {
                // Initialize new music widget
                const initialData = {
                    queue: [newSong],
                    currentSongIndex: 0,
                    volume: 1,
                    playlists: [],
                    isPlaying: false
                };
                onSelectWidget(index, 'music');
                updateWidgetData(index, initialData);

                if (window.jsmediatags) {
                    window.jsmediatags.read(file, {
                        onSuccess: (tag: any) => {
                            const { title, artist, picture } = tag.tags;
                            let imageUrl = null;
                            if (picture) {
                               let base64String = "";
                                for (let i = 0; i < picture.data.length; i++) {
                                    base64String += String.fromCharCode(picture.data[i]);
                                }
                                imageUrl = `data:${picture.format};base64,${window.btoa(base64String)}`;
                            }
                            const updatedSong = { ...newSong, title: title || newSong.title, artist: artist || 'Unknown Artist', albumArt: imageUrl };
                            updateWidgetData(index, { ...initialData, queue: [updatedSong] });
                        },
                        onError: (error: any) => {
                            console.error('Error reading audio tags:', error);
                            const updatedSong = { ...newSong, artist: 'Unknown Artist' };
                            updateWidgetData(index, { ...initialData, queue: [updatedSong] });
                        },
                    });
                } else {
                    console.warn('jsmediatags library not found.');
                     const updatedSong = { ...newSong, artist: 'Unknown Artist' };
                     updateWidgetData(index, { ...initialData, queue: [updatedSong] });
                }
            }
            return;
        }
      }

      // 2. Check for URLs
      try {
          const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
          if (url) {
              const urlObj = new URL(url); // Simple URL validation, will throw if invalid
              if (urlObj.hostname === 'open.spotify.com') {
                  onSelectWidget(index, 'spotify');
                  updateWidgetData(index, { url });
                  return;
              }
              onSelectWidget(index, 'hyperlink');
              updateWidgetData(index, { url: url, text: url });
              return;
          }
      } catch (error) {
          // Not a valid URL, will fall through to be treated as plain text
      }

      // 3. Fallback for plain text to create a sticky note
      const text = e.dataTransfer.getData('text/plain');
      if (text) {
          onSelectWidget(index, 'stickynote');
          updateWidgetData(index, { notes: [text] });
      }
  };
  
  const handleWidgetContainerClick = (index: number) => {
    if (activeWidgetIndex === index) {
      onToggleWidgetBg(index);
    } else {
      onSetActiveWidget(index);
    }
  };

  const handleSearch = async (index: number, query: string) => {
      updateWidgetData(index, { ...widgets[index].data, loading: true, error: null });
      try {
        const result = await performGoogleSearch(query);
        updateWidgetData(index, { query, ...result, loading: false });
      } catch (e) {
        const error = e instanceof Error ? e.message : 'An unknown error occurred.';
        updateWidgetData(index, { ...widgets[index].data, loading: false, error });
      }
  };
  
  const handleDragStart = (e: React.DragEvent, index: number) => {
      e.dataTransfer.setData('widgetIndex', index.toString());
      setDraggingWidgetIndex(index);
  };


  const renderWidget = (widget: WidgetState, index: number) => {
    switch (widget.type) {
      case 'pomodoro':
        return <WidgetWrapper title="Pomodoro" noPadding={true}><PomodoroWidget /></WidgetWrapper>;
      case 'image':
        return <WidgetWrapper title="Image"><ImageWidget data={widget.data} onChange={(data) => updateWidgetData(index, data)} /></WidgetWrapper>;
      case 'hyperlink':
        return <WidgetWrapper title="Hyperlink"><HyperlinkWidget data={widget.data} onChange={(data) => updateWidgetData(index, data)} /></WidgetWrapper>;
      case 'calculator':
        return (
            <WidgetWrapper title="Calculator" noPadding={true}>
                <CalculatorWidget 
                    onExpand={() => setExpandedCalculatorIndex(index)} 
                />
            </WidgetWrapper>
        );
      case 'stickynote':
        return <WidgetWrapper title="Sticky Notes" noPadding={true}><StickyNoteWidget data={widget.data} onChange={(data) => updateWidgetData(index, data)} /></WidgetWrapper>;
      case 'music':
        return <WidgetWrapper title="Music Player" noPadding={true}><MusicPlayerWidget data={widget.data} onChange={(data) => updateWidgetData(index, data)} /></WidgetWrapper>;
      case 'spotify':
        return <WidgetWrapper title="Spotify" noPadding={true}><SpotifyWidget data={widget.data} onChange={(data) => updateWidgetData(index, data)} /></WidgetWrapper>;
      case 'todolist':
        return <WidgetWrapper title="To-Do List" noPadding={true}><ToDoListWidget data={widget.data} onChange={(data) => updateWidgetData(index, data)} /></WidgetWrapper>;
      case 'terminal':
        return (
          <WidgetWrapper title="Terminal" noPadding={true}>
            <TerminalWidget
              onClose={() => onRemoveWidget(index)}
              data={widget.data}
              onCommand={(command, args) => onTerminalCommand(index, command, args)}
            />
          </WidgetWrapper>
        );
      case 'googlesearch':
        return (
            <WidgetWrapper title="Google Search" noPadding={true}>
                <GoogleSearchWidget data={widget.data} onSearch={(query) => handleSearch(index, query)} />
            </WidgetWrapper>
        );
      case 'snake':
        return <WidgetWrapper title="Snake Game" noPadding={true}><SnakeGameWidget /></WidgetWrapper>;
      case 'dictionary':
        return <WidgetWrapper title="Dictionary" noPadding={true}><DictionaryWidget data={widget.data} onChange={(data) => updateWidgetData(index, data)} /></WidgetWrapper>;
      case 'zipgame':
        return <WidgetWrapper title="Zip Game" noPadding={true}><ZipGameWidget /></WidgetWrapper>;
      case 'tictactoe':
        return <WidgetWrapper title="Tic-Tac-Toe" noPadding={true}><TicTacToeWidget /></WidgetWrapper>;
      case 'selecting':
        return <WidgetSelectionView onSelect={(type) => onSelectWidget(index, type)} onCancel={() => onSelectWidget(index, 'empty')} />;
      case 'empty':
      default:
        return (
            <div 
                onClick={() => onWidgetPlaceholderClick(index)}
                className={`animated-gradient-placeholder rounded-xl w-full h-full cursor-pointer group shadow-sm hover:shadow-md transition-all ${dragOverIndex === index ? 'opacity-50' : ''}`}
            >
                <div className="w-full h-full bg-[var(--bg-primary)] rounded-[6px] flex flex-col items-center justify-center gap-2 relative overflow-hidden">
                    {/* Hover effect background */}
                    <div className="absolute inset-0 bg-[var(--accent)] opacity-0 group-hover:opacity-5 transition-opacity"></div>
                    
                    <div className="p-3 rounded-full bg-[var(--bg-secondary)] group-hover:scale-110 transition-transform duration-300">
                        <PlusIcon className="w-6 h-6 text-[var(--accent)]" />
                    </div>
                    <span className="text-xs font-bold text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors">Add Widget</span>
                </div>
            </div>
        );
    }
  };


  return (
    <div className="mediapanel-root h-full bg-[var(--bg-primary)] p-4 transition-all overflow-y-auto custom-scrollbar relative">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="application/pdf" />
      
      {/* Expanded Calculator Overlay - Reduced Size */}
      {expandedCalculatorIndex !== null && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
            <div className="w-[320px] h-[500px] shadow-2xl rounded-xl overflow-hidden border border-[var(--border-primary)] animate-[popIn_0.3s_cubic-bezier(0.16,1,0.3,1)]">
                 <CalculatorWidget 
                    isScientific={true} 
                    onClose={() => setExpandedCalculatorIndex(null)} 
                />
            </div>
        </div>
      )}

      {/* Change direction to column and stack items */}
      <div className="flex flex-col h-full gap-4">
        
        {/* Main Media Area (Video/Upload) - Takes available space but shrinks if needed */}
        <div className="flex-grow flex flex-col min-h-[300px] justify-center">
            {mediaType === 'selection' && (
                <div className="flex-grow flex flex-col items-center justify-center gap-6">
                    {/* Enhanced Upload Section */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                        onDragLeave={() => setIsDraggingFile(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setIsDraggingFile(false);
                            if (e.dataTransfer.files && e.dataTransfer.files[0]?.type === 'application/pdf') {
                                const file = e.dataTransfer.files[0];
                                const url = URL.createObjectURL(file);
                                setDocumentUrl(url);
                                setMediaType('document');
                            }
                        }}
                        className={`w-full max-w-md aspect-video rounded-xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300 group relative overflow-hidden
                            ${isDraggingFile 
                                ? 'bg-[var(--highlight-kp-bg)] border-2 border-dashed border-[var(--accent)] scale-105 shadow-lg' 
                                : 'bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--accent)] hover:shadow-xl'
                            }
                        `}
                    >
                        {/* Background decoration */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-[var(--accent)] pointer-events-none"></div>
                        
                        <div className={`p-5 rounded-full transition-all duration-300 ${isDraggingFile ? 'bg-[var(--accent)] text-white scale-110' : 'bg-[var(--bg-primary)] text-[var(--accent)] shadow-sm group-hover:scale-110'}`}>
                            <UploadIcon className="w-12 h-12" />
                        </div>
                        <div className="text-center z-10">
                            <p className="font-bold text-xl mb-1 group-hover:text-[var(--accent)] transition-colors">Upload Document</p>
                            <p className="text-sm text-[var(--text-secondary)]">Drag & Drop PDF or Click to Browse</p>
                        </div>
                    </div>

                    <div className="flex items-center w-full max-w-md gap-4 opacity-60">
                        <div className="h-px bg-[var(--border-primary)] flex-grow"></div>
                        <span className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider">or</span>
                        <div className="h-px bg-[var(--border-primary)] flex-grow"></div>
                    </div>

                    <button
                        onClick={() => setMediaType('video')}
                        className="w-full max-w-md flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] hover:border-[var(--accent)] hover:shadow-lg transition-all btn-press group"
                    >
                        <div className="p-2 rounded-full bg-[var(--bg-secondary)] group-hover:bg-[var(--accent)] group-hover:text-white transition-colors">
                            <FilmIcon className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">Load Video from URL</span>
                    </button>
                </div>
            )}

            {mediaType === 'video' && (
            <div className="h-full flex flex-col">
                <div className="flex gap-2 mb-4">
                <button onClick={handleBackToSelection} className="px-3 py-1 font-semibold text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-md hover:bg-[var(--border-primary)] transition-all btn-press">
                    Back
                </button>
                <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => onVideoUrlChange(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="flex-grow px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
                />
                <button
                    onClick={onLoadVideo}
                    className="px-4 py-2 font-semibold text-white bg-[var(--accent)] rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] focus:ring-[var(--accent)] transition-all btn-press"
                >
                    Load
                </button>
                </div>
                <div className="flex-grow bg-[var(--bg-secondary)] rounded-lg flex items-center justify-center">
                {videoId ? (
                    <iframe
                    className="w-full h-full rounded-lg"
                    src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    ></iframe>
                ) : (
                    <div className="text-[var(--text-secondary)]">
                    Video will be displayed here
                    </div>
                )}
                </div>
            </div>
            )}

            {mediaType === 'document' && (
            <div className="h-full flex flex-col">
                <div className="flex justify-end mb-2">
                <button onClick={handleBackToSelection} className="px-3 py-1 font-semibold text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-md hover:bg-[var(--border-primary)] transition-all btn-press">
                    Back
                </button>
                </div>
                <div className="flex-grow bg-[var(--bg-secondary)] rounded-lg">
                    {documentUrl && <embed src={documentUrl} type="application/pdf" className="w-full h-full rounded-lg border-0" />}
                </div>
            </div>
            )}
        </div>

        {/* Widgets Area - Stacked Below */}
        <div className="flex-shrink-0 w-full flex flex-col gap-2 pb-4">
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-semibold uppercase">
                <div className="h-px flex-grow bg-[var(--border-primary)]"></div>
                <span>Widgets</span>
                <div className="h-px flex-grow bg-[var(--border-primary)]"></div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
                    {widgets.map((widget, i) => (
                    <div 
                        key={i} 
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, i)}
                        onDragOver={(e) => handleDragOver(e, i)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, i)}
                        className={`widget-container relative aspect-square rounded-lg flex items-center justify-center transition-all 
                            ${activeWidgetIndex === i ? 'active' : ''} 
                            ${widget.type === 'empty' ? '' : 'border border-[var(--border-primary)]'}
                            ${widget.type === 'empty' || widget.isBgToggled ? 'bg-transparent' : 'bg-[var(--bg-secondary)]'}
                        `}
                        onClick={(e) => {
                            if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input') || (e.target as HTMLElement).closest('textarea') || (e.target as HTMLElement).closest('a')) return;
                            handleWidgetContainerClick(i);
                        }}
                    >
                        {activeWidgetIndex === i && widget.type !== 'empty' && widget.type !== 'selecting' && (
                        <div className="absolute -top-2 -right-2 z-20 flex gap-1">
                            <button
                                onClick={(e) => { e.stopPropagation(); onRemoveWidget(i); }}
                                className="p-1 rounded-full bg-[var(--danger)] text-white shadow-md hover:opacity-90 btn-press"
                                title="Remove Widget"
                            >
                            <CloseIcon className="w-3 h-3" />
                            </button>
                        </div>
                        )}
                        {renderWidget(widget, i)}
                    </div>
                    ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default MediaPanel;
