
import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { SparklesIcon, LightBulbIcon, MicrophoneIcon, ImageIcon, NoSymbolIcon, ClipboardIcon, TagIcon, CloseIcon } from './Icons';
import Spinner from './Spinner';
import { ToDoItem } from '../App';
import ToDoList from './ToDoList';
import EditorToolbar from './EditorToolbar';
import SlashMenu from './SlashMenu';
import IconPicker from './IconPicker';

// Define types for SpeechRecognition to support browser prefixes
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}
interface SpeechRecognitionErrorEvent extends Event {
    error: string;
}
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

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
  pageTodos?: ToDoItem[];
  onTodosChange: (todos: ToDoItem[]) => void;
}

// Better color generator with consistent pastel palette
const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    // Use HSL for nice pastel colors, ensuring good readability
    return `hsl(${hue}, 75%, 85%)`; 
};

// Darker text color for contrast
const stringToTextColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 80%, 25%)`;
};

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
  pageTodos,
  onTodosChange
}, ref) => {
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const [slashMenuPosition, setSlashMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [iconPickerPos, setIconPickerPos] = useState<{ top: number; left: number } | null>(null);
  const [isSpeechListening, setIsSpeechListening] = useState(false);
  const [isTodoListOpen, setIsTodoListOpen] = useState(false);
  const [showAiActions, setShowAiActions] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Tagging State
  const [tagInput, setTagInput] = useState('');
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync content from props to editable div
  useEffect(() => {
    if (contentEditableRef.current && contentEditableRef.current.innerHTML !== pageContent) {
        // Avoid cursor jumps if we are focused
        if (document.activeElement !== contentEditableRef.current) {
             contentEditableRef.current.innerHTML = pageContent;
        }
    }
  }, [pageContent]);

  // Click outside listener for dropdown
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
              setShowTagDropdown(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const content = e.currentTarget.innerHTML;
    onNotesChange(content);
    
    // Check for slash command
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        // Simple slash detection
        if ((e.nativeEvent as InputEvent).data === '/') {
            const rect = range.getBoundingClientRect();
            setSlashMenuPosition({ top: rect.bottom + 5, left: rect.left });
        }
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (slashMenuPosition && e.key === 'Escape') {
          setSlashMenuPosition(null);
      }
  };

  const executeCommand = (command: string, arg?: string) => {
      contentEditableRef.current?.focus();
      
      // Delete the slash
      document.execCommand('delete', false); 
      
      if (command === 'insertImage') {
          const url = prompt('Enter image URL:');
          if (url) document.execCommand(command, false, url);
      } else {
          document.execCommand(command, false, arg);
      }
      setSlashMenuPosition(null);
  };

  const toggleSpeech = () => {
      if (!('webkitSpeechRecognition' in window)) {
          alert("Speech recognition not supported.");
          return;
      }
      
      if (isSpeechListening) {
          setIsSpeechListening(false);
          return;
      }

      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => setIsSpeechListening(true);
      recognition.onend = () => setIsSpeechListening(false);
      recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          document.execCommand('insertText', false, transcript);
      };
      
      recognition.start();
  };

  const handleIconClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      setIconPickerPos({ top: rect.bottom + 10, left: rect.left });
  };

  // Tag Management
  const handleAddTag = (tag: string) => {
      const trimmedTag = tag.trim();
      if (trimmedTag && !pageTags.includes(trimmedTag)) {
          onTagsChange([...pageTags, trimmedTag]);
      }
      setTagInput('');
      setShowTagDropdown(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
      onTagsChange(pageTags.filter(t => t !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          if (tagInput.trim()) {
            handleAddTag(tagInput);
          }
      } else if (e.key === 'Escape') {
          setShowTagDropdown(false);
      }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (ev) => {
            if (ev.target?.result && typeof ev.target.result === 'string') {
                onCoverChange(ev.target.result);
            }
        };
        reader.readAsDataURL(file);
        // Reset input so the same file can be selected again if needed
        e.target.value = '';
    }
  };

  const filteredTags = allTags.filter(t => t.toLowerCase().includes(tagInput.toLowerCase()) && !pageTags.includes(t));

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)] relative overflow-hidden group/notebook notebook-root" ref={ref as any}>
      {/* Hidden file input for cover upload */}
      <input 
        type="file" 
        ref={coverInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleCoverUpload} 
      />

      {/* Cover Image Area */}
      <div className={`relative w-full flex-shrink-0 bg-[var(--bg-secondary)] z-0 transition-all duration-300 ease-in-out overflow-hidden ${
          pageCover 
          ? 'h-40 border-b border-[var(--border-primary)]' 
          : 'h-0 group-hover/notebook:h-40 border-b-0 group-hover/notebook:border-b border-[var(--border-primary)]'
      }`}>
          {pageCover ? (
              <>
                <img src={pageCover} alt="Cover" className="w-full h-full object-cover opacity-90" />
                {/* Enhanced gradient fade to prevent text overlap issues */}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/30 to-transparent opacity-100"></div>
                
                {/* Controls for existing cover */}
                <div className="absolute bottom-2 right-2 opacity-0 group-hover/notebook:opacity-100 transition-opacity z-20 flex gap-2">
                    <button 
                        className="bg-black/50 text-white p-1.5 rounded hover:bg-black/70 transition-colors btn-press text-xs flex items-center gap-1"
                        onClick={() => coverInputRef.current?.click()}
                    >
                        <ImageIcon className="w-3 h-3" /> Change Cover
                    </button>
                    <button 
                        className="bg-black/50 text-white p-1.5 rounded hover:bg-black/70 transition-colors btn-press"
                        onClick={() => onCoverChange("")}
                    >
                        <NoSymbolIcon className="w-3 h-3" />
                    </button>
                </div>
              </>
          ) : (
              /* Empty State - Clickable Area to Add Cover */
              <button 
                  className="w-full h-full flex flex-col items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors group/placeholder outline-none"
                  onClick={() => coverInputRef.current?.click()}
              >
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-primary)] shadow-sm border border-[var(--border-primary)] group-hover/placeholder:scale-105 transition-transform">
                      <ImageIcon className="w-4 h-4" />
                      <span className="text-xs font-semibold">Add Cover</span>
                  </div>
              </button>
          )}
      </div>

      {/* Header Info - Added relative and z-10 to sit on top of cover art if needed */}
      <div className="px-8 pt-8 pb-4 flex-shrink-0 relative z-10">
          <div 
            className={`group relative w-16 h-16 mb-4 bg-[var(--bg-primary)] rounded-full border-4 border-[var(--bg-primary)] flex items-center justify-center text-3xl shadow-sm cursor-pointer hover:bg-[var(--bg-secondary)] transition-all z-20 duration-300
                ${pageCover ? '-mt-16' : 'mt-4 group-hover/notebook:-mt-16'}
            `} 
            onClick={handleIconClick}
          >
              {pageIcon || "📄"}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs">Edit</div>
          </div>
          <input 
            type="text" 
            value={pageTitle || ""} 
            onChange={(e) => onTitleChange(e.target.value)}
            className="text-4xl font-bold bg-transparent outline-none placeholder-[var(--text-secondary)] w-full relative z-10 mb-2"
            placeholder="Untitled Page"
          />

          {/* Tag Bar */}
          <div className="flex flex-wrap items-center gap-2 mb-4 relative z-20 min-h-[28px]">
              <TagIcon className="w-4 h-4 text-[var(--text-secondary)] mr-1" />
              {pageTags.map(tag => (
                  <span 
                      key={tag} 
                      className="group arrow-tag inline-flex items-center gap-1.5 text-xs font-semibold shadow-sm transition-all hover:shadow-md cursor-default select-none border-l border-t border-b border-white/20"
                      style={{ 
                          backgroundColor: stringToColor(tag),
                          color: stringToTextColor(tag)
                      }}
                  >
                      {tag}
                      <button 
                          onClick={() => handleRemoveTag(tag)} 
                          className="w-3.5 h-3.5 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 text-current transition-colors opacity-60 group-hover:opacity-100"
                      >
                          <CloseIcon className="w-2.5 h-2.5" />
                      </button>
                  </span>
              ))}
              
              <div className="relative" ref={dropdownRef}>
                  <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => {
                          setTagInput(e.target.value);
                          setShowTagDropdown(true);
                      }}
                      onFocus={() => setShowTagDropdown(true)}
                      onKeyDown={handleTagInputKeyDown}
                      placeholder="Add tag..."
                      className="bg-transparent border-none outline-none text-xs min-w-[80px] text-[var(--text-secondary)] focus:text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 py-1"
                  />
                  {showTagDropdown && filteredTags.length > 0 && (
                      <div className="absolute top-full left-0 mt-2 w-56 bg-[var(--bg-secondary)]/95 backdrop-blur-md border border-[var(--border-primary)] rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto animated-popover">
                          {filteredTags.map(tag => (
                              <button
                                  key={tag}
                                  onClick={() => handleAddTag(tag)}
                                  className="w-full text-left px-4 py-2 text-xs hover:bg-[var(--accent)] hover:text-white text-[var(--text-primary)] transition-colors flex items-center justify-between group"
                              >
                                  <span>{tag}</span>
                                  <span className="opacity-0 group-hover:opacity-100 text-[10px]">+</span>
                              </button>
                          ))}
                      </div>
                  )}
              </div>
          </div>
          
          {/* Editor Toolbar */}
          <div className="flex items-center gap-2 mt-2 pb-2 border-b border-[var(--border-primary)] overflow-x-auto custom-scrollbar">
              <EditorToolbar />
              <div className="w-px h-6 bg-[var(--border-primary)] mx-2" />
              
               <button onClick={toggleSpeech} className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded hover:bg-[var(--bg-secondary)] transition-colors btn-press ml-2 ${isSpeechListening ? 'text-[var(--danger)] animate-pulse' : ''}`} title="Dictate">
                  <MicrophoneIcon className="w-3 h-3" />
              </button>
          </div>
      </div>

      {/* Content Area */}
      <div className="flex-grow flex flex-col overflow-hidden relative z-0">
          <div 
            className="flex-grow overflow-y-auto outline-none text-lg leading-relaxed custom-scrollbar markdown-body notebook-textarea pb-24"
            ref={contentEditableRef}
            contentEditable
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            suppressContentEditableWarning
            data-placeholder="Type '/' for commands..."
          />
          
          {/* Floating Tasks Icon */}
          <button 
            onClick={() => setIsTodoListOpen(!isTodoListOpen)}
            className={`absolute top-4 right-8 p-2 rounded-full shadow-lg z-30 transition-all btn-press ${isTodoListOpen ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--border-primary)] hover:text-[var(--text-primary)]'}`}
            title="Tasks"
          >
            <ClipboardIcon className="w-5 h-5" />
          </button>

          {/* Floating Task List */}
          {pageTodos && isTodoListOpen && (
              <div className="absolute top-16 right-8 w-72 h-96 bg-[var(--bg-secondary)] border border-[var(--border-primary)] shadow-xl rounded-lg z-30 overflow-hidden flex flex-col animated-popover">
                  <ToDoList 
                    todos={pageTodos} 
                    onChange={onTodosChange} 
                    isWidget={true} 
                    onCollapse={() => setIsTodoListOpen(false)}
                  />
              </div>
          )}
          
          {/* Floating AI Actions Menu (Bottom Center) */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col-reverse items-center gap-4 pointer-events-none">
              {/* Main Trigger Button - Pointer events enabled */}
              <button 
                  onClick={() => setShowAiActions(!showAiActions)}
                  className={`pointer-events-auto w-12 h-12 rounded-full bg-[var(--accent)] text-white shadow-lg flex items-center justify-center hover:scale-110 transition-all duration-300 hover:shadow-xl btn-press z-50 ${showAiActions ? 'rotate-45' : ''}`}
                  title="AI Actions"
              >
                  <SparklesIcon className="w-6 h-6" />
              </button>

              {/* Pop-up Options Container - Pointer events enabled when open */}
              <div className={`flex gap-3 pointer-events-auto transition-all duration-300 ease-out origin-bottom ${showAiActions ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-90 pointer-events-none'}`}>
                  <button 
                      onClick={() => { onSummarize(); setShowAiActions(false); }} 
                      disabled={isSummarizing}
                      className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full transition-all btn-press btn-gold-gradient shadow-lg"
                  >
                      <span className="relative z-10 flex items-center gap-1">
                        {isSummarizing ? <Spinner className="w-3 h-3 text-white" /> : <SparklesIcon className="w-3 h-3 text-white" />}
                        <span>AI Summary</span>
                      </span>
                  </button>
                  
                  <button 
                      onClick={() => { onStartRecall(); setShowAiActions(false); }}
                      disabled={isGeneratingQuiz}
                      className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full transition-all btn-press btn-emerald-gradient shadow-lg"
                  >
                      <span className="relative z-10 flex items-center gap-1">
                        {isGeneratingQuiz ? <Spinner className="w-3 h-3 text-white" /> : <LightBulbIcon className="w-3 h-3 text-white" />}
                        <span>Active Recall</span>
                      </span>
                  </button>
              </div>
          </div>
      </div>

      {slashMenuPosition && (
          <SlashMenu 
            position={slashMenuPosition} 
            onSelect={executeCommand} 
            onClose={() => setSlashMenuPosition(null)} 
          />
      )}

      {iconPickerPos && (
          <IconPicker 
              position={iconPickerPos}
              onClose={() => setIconPickerPos(null)}
              onSelect={(icon) => onIconChange(icon)}
          />
      )}
    </div>
  );
});

export default Notebook;
