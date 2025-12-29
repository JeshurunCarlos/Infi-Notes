
import React, { useState, useRef, useMemo } from 'react';
import { NotePage } from '../types';
import { PlusIcon, TrashIcon, ImageIcon, MagnifyingGlassIcon, PencilIcon, ArrowPathIcon, TagIcon, ChevronRightIcon, CloseIcon, BookOpenIcon } from './Icons';

interface NotebookShelfProps {
  notebooks: NotePage[];
  onOpenNotebook: (id: string) => void;
  onAddNotebook: () => void;
  onDeleteNotebook: (id: string) => void;
  onRenameNotebook: (id: string, title: string) => void;
  onUpdateCover: (id: string, cover: string) => void;
}

const NotebookShelf: React.FC<NotebookShelfProps> = ({
  notebooks,
  onOpenNotebook,
  onAddNotebook,
  onDeleteNotebook,
  onRenameNotebook,
  onUpdateCover,
}) => {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeCoverId, setActiveCoverId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'notebooks' | 'favorites' | 'shared'>('notebooks');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) onUpdateCover(id, ev.target.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const filteredNotebooks = useMemo(() => {
    let result = notebooks;
    
    // In this mock, "favorites" are notes with more than 1 tag
    if (filter === 'favorites') result = notebooks.filter(nb => (nb.tags?.length || 0) > 1);
    // "Shared" are notes with "shared" in title
    if (filter === 'shared') result = notebooks.filter(nb => nb.title.toLowerCase().includes('shared'));
    
    if (searchQuery.trim()) {
        result = result.filter(nb => nb.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    
    return result;
  }, [notebooks, filter, searchQuery]);

  const handleRefresh = () => {
      setIsRefreshing(true);
      setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-primary)] overflow-hidden animate-[fadeIn_0.4s_ease-out] relative">
      {/* Mock MacOS-style System Header - Themed - Removed Redundant Items */}
      <div className="flex-none bg-[var(--bg-secondary-glass)] backdrop-blur-md border-b border-[var(--border-primary)]/20 px-4 h-10 flex items-center justify-between z-20">
        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-primary)] opacity-70">
          <span className="text-sm"></span>
          <span className="cursor-default hover:text-[var(--accent)] transition-colors">Notebook</span>
          <span className="cursor-default hover:text-[var(--accent)] transition-colors">File</span>
          <span className="cursor-default hover:text-[var(--accent)] transition-colors">Edit</span>
          <span className="cursor-default hover:text-[var(--accent)] transition-colors">View</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex items-center bg-[var(--bg-primary-glass)] border border-[var(--border-primary)]/30 rounded-lg p-0.5 px-1 mr-4 shadow-sm">
             <button 
                onClick={() => setFilter('notebooks')}
                className={`px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all ${filter === 'notebooks' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'}`}
             >
                Notebooks
             </button>
             <button 
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-[9px] font-black uppercase transition-all rounded-md ${filter === 'all' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'}`}
             >
                All
             </button>
             <button 
                onClick={() => setFilter('favorites')}
                className={`px-3 py-1 text-[9px] font-black uppercase transition-all rounded-md ${filter === 'favorites' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'}`}
             >
                Favorites
             </button>
          </div>
        </div>
      </div>

      {/* Sub Header */}
      <div className="flex-none flex items-center justify-between px-10 py-8 bg-transparent">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tight uppercase italic flex items-center gap-3">
            <BookOpenIcon className="w-8 h-8 text-[var(--accent)] opacity-80" />
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </h1>
          <div className="h-1 w-20 bg-[var(--accent)] rounded-full mt-1"></div>
          <span className="text-[var(--text-secondary)] opacity-50 text-[10px] font-black uppercase tracking-[0.2em] mt-2 ml-1">{filteredNotebooks.length} Active Protocols</span>
        </div>
        
        <div className="flex items-center gap-6">
           {/* Search Input Toggle */}
           <div className={`flex items-center bg-[var(--bg-secondary-glass)] border border-[var(--border-primary)]/30 rounded-full transition-all duration-300 overflow-hidden shadow-sm ${isSearchActive ? 'w-56 px-3 py-2' : 'w-10 h-10 flex justify-center hover:bg-[var(--bg-secondary)]'}`}>
                {isSearchActive ? (
                    <>
                        <MagnifyingGlassIcon className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
                        <input 
                            autoFocus
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onBlur={() => !searchQuery && setIsSearchActive(false)}
                            placeholder="Search protocols..."
                            className="bg-transparent border-none outline-none text-xs ml-2 w-full font-bold text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50"
                        />
                        <button onClick={() => { setSearchQuery(''); setIsSearchActive(false); }} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><CloseIcon className="w-3 h-3" /></button>
                    </>
                ) : (
                    <button onClick={() => setIsSearchActive(true)} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" title="Search"><MagnifyingGlassIcon className="w-5 h-5" /></button>
                )}
           </div>

           <button 
                onClick={handleRefresh} 
                className={`p-2.5 rounded-full border border-[var(--border-primary)]/20 bg-[var(--bg-secondary-glass)] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all shadow-sm ${isRefreshing ? 'animate-spin' : ''}`} 
                title="Refresh Content"
           >
                <ArrowPathIcon className="w-5 h-5" />
           </button>
           
           <div className="w-px h-8 bg-[var(--border-primary)]/20 mx-2"></div>
           
           <button onClick={onAddNotebook} className="flex items-center gap-3 px-6 py-3 bg-[var(--accent)] text-white rounded-2xl hover:scale-105 active:scale-95 transition-all font-black text-xs uppercase tracking-widest shadow-xl shadow-[var(--accent)]/20 group border border-white/20">
              <PlusIcon className="w-4 h-4 transition-transform group-hover:rotate-90" />
              <span>Create Unit</span>
           </button>
        </div>
      </div>

      {/* Notebooks Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-10 pb-20 pt-4">
        {filteredNotebooks.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-6 text-[var(--text-secondary)] min-h-[300px]">
                <div className="relative">
                    <div className="absolute inset-0 bg-[var(--accent)]/20 blur-2xl rounded-full"></div>
                    <div className="relative p-10 bg-[var(--bg-secondary-glass)] rounded-full border border-[var(--border-primary)]/40 shadow-xl">
                        <MagnifyingGlassIcon className="w-16 h-16 opacity-30" />
                    </div>
                </div>
                <div className="text-center space-y-2">
                    <p className="font-black text-sm uppercase tracking-[0.2em] opacity-60">No documents found</p>
                    <button onClick={() => { setFilter('notebooks'); setSearchQuery(''); }} className="text-xs font-bold text-[var(--accent)] hover:underline decoration-2 underline-offset-4">Reset Search Filters</button>
                </div>
            </div>
        ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-8 gap-y-12 pb-20">
            {filteredNotebooks.map((nb, i) => (
                <div 
                    key={nb.id} 
                    className="group flex flex-col items-center gap-4 animate-[popIn_0.5s_ease-out]"
                    style={{ animationDelay: `${i * 50}ms` }}
                >
                    {/* Notebook Card Container with Perspective */}
                    <div 
                        className="relative w-full aspect-[3/4.2] perspective-container cursor-pointer z-10"
                        onClick={() => onOpenNotebook(nb.id)}
                        style={{ perspective: '1000px' }}
                    >
                        {/* The Notebook Itself - Rotates on hover */}
                        <div className="w-full h-full relative transition-all duration-500 ease-out transform-style-3d group-hover:rotate-y-[-15deg] group-hover:translate-x-2">
                            
                            {/* Front Cover */}
                            <div className="absolute inset-0 bg-[var(--bg-primary)] rounded-r-lg rounded-l-sm shadow-xl overflow-hidden border border-[var(--border-primary)] border-l-0 z-20 backface-hidden">
                                {nb.coverImage ? (
                                    <>
                                        <img src={nb.coverImage} className="w-full h-full object-cover opacity-95 transition-transform duration-700 group-hover:scale-110" alt="" />
                                        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent pointer-events-none mix-blend-multiply"></div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
                                    </>
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-primary)] flex flex-col items-center justify-center p-4 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-[var(--accent)]/10 rounded-full blur-xl transform translate-x-10 -translate-y-10"></div>
                                        <BookOpenIcon className="w-12 h-12 text-[var(--border-primary)] mb-2" />
                                        <span className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-widest opacity-40">Classified</span>
                                    </div>
                                )}
                                
                                {/* Metadata Overlay Bottom */}
                                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                                     <div className="flex flex-wrap gap-1">
                                         {nb.tags?.slice(0, 2).map(tag => (
                                             <span key={tag} className="text-[7px] font-black uppercase text-white bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-md border border-white/10">{tag}</span>
                                         ))}
                                     </div>
                                </div>
                            </div>

                            {/* Spine */}
                            <div className="absolute top-[2px] bottom-[2px] left-[-12px] w-[14px] bg-gradient-to-r from-[var(--text-primary)] via-[var(--text-secondary)] to-[var(--text-primary)] rounded-l-sm z-10 transform translate-z-[-1px] rotate-y-[-90deg] origin-right opacity-90"></div>
                            
                            {/* Pages / Thickness */}
                            <div className="absolute top-[4px] bottom-[4px] right-[2px] w-[10px] bg-[#fffcf5] z-0 transform translate-z-[-2px] translate-x-[8px] rotate-y-[90deg] origin-left border-l border-r border-gray-200" 
                                 style={{ backgroundImage: 'linear-gradient(to bottom, #e5e5e5 1px, transparent 1px)', backgroundSize: '100% 3px' }}>
                            </div>
                            
                            {/* Back Cover (Hint) */}
                            <div className="absolute top-[1px] bottom-[1px] left-[0] w-full bg-[var(--bg-secondary)] rounded-r-lg transform translate-z-[-12px] shadow-2xl border border-[var(--border-primary)]"></div>

                        </div>
                        
                        {/* Shadow underneath */}
                        <div className="absolute -bottom-4 left-4 right-4 h-4 bg-black/20 blur-xl rounded-[100%] transition-all duration-500 group-hover:scale-x-110 group-hover:bg-black/30 group-hover:translate-x-2"></div>
                    </div>

                    {/* Title & Actions */}
                    <div className="w-full px-1 text-center relative">
                        {renamingId === nb.id ? (
                        <input
                            autoFocus
                            value={nb.title}
                            onChange={(e) => onRenameNotebook(nb.id, e.target.value)}
                            onBlur={() => setRenamingId(null)}
                            onKeyDown={(e) => e.key === 'Enter' && setRenamingId(null)}
                            className="w-full bg-[var(--bg-secondary)] border border-[var(--accent)] rounded-lg px-2 py-1.5 text-center text-xs font-bold text-[var(--text-primary)] shadow-inner outline-none"
                        />
                        ) : (
                        <div className="group/title relative">
                            <h3 
                                className="text-xs font-black uppercase tracking-wide text-[var(--text-primary)] line-clamp-1 group-hover/title:text-[var(--accent)] transition-colors cursor-pointer"
                                onClick={() => onOpenNotebook(nb.id)}
                            >
                                {nb.title}
                            </h3>
                            <button 
                                onClick={() => setRenamingId(nb.id)}
                                className="absolute -right-5 top-1/2 -translate-y-1/2 opacity-0 group-hover/title:opacity-100 p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
                            >
                                <PencilIcon className="w-3 h-3" />
                            </button>
                        </div>
                        )}
                        
                        {/* Quick Actions Row */}
                        <div className="flex justify-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setActiveCoverId(nb.id); fileInputRef.current?.click(); }}
                                className="p-1.5 bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-full hover:bg-[var(--accent)] hover:text-white transition-all shadow-sm border border-[var(--border-primary)] hover:scale-110"
                                title="Update Cover"
                            >
                                <ImageIcon className="w-3 h-3" />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDeleteNotebook(nb.id); }}
                                className="p-1.5 bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-full hover:bg-[var(--danger)] hover:text-white transition-all shadow-sm border border-[var(--border-primary)] hover:scale-110"
                                title="Delete Notebook"
                            >
                                <TrashIcon className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
            </div>
        )}
      </div>

      {/* Hidden File Input for Covers */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={(e) => activeCoverId && handleFileChange(e, activeCoverId)} 
      />
      
      <style>{`
        .perspective-container {
            perspective: 1000px;
        }
        .transform-style-3d {
            transform-style: preserve-3d;
        }
        .backface-hidden {
            backface-visibility: hidden;
        }
        .rotate-y-15 {
            transform: rotateY(-15deg);
        }
      `}</style>
    </div>
  );
};

export default NotebookShelf;
