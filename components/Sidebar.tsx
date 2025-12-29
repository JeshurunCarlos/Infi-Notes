
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { NotePage, BackgroundAnimationType } from '../types';
import { PlusIcon, PencilIcon, TrashIcon, ChevronRightIcon, ChevronDownIcon, MagnifyingGlassIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, FilmIcon, FolderIcon, DocumentTextIcon, FolderPlusIcon, DocumentPlusIcon, HashtagIcon, TagIcon, CogIcon } from './Icons';

type DropPosition = 'before' | 'after' | 'inside';

interface DragOverInfo {
    pageId: string;
    position: DropPosition;
}

interface PageItemProps {
    page: NotePage;
    allPages: NotePage[];
    level: number;
    activePageId: string | null;
    onSelectPage: (id: string) => void;
    onAddPage: (parentId: string | null, isFolder: boolean) => void;
    onDeletePage: (id: string) => void;
    onRenamePage: (id: string, newTitle: string) => void;
    onMovePage: (draggedId: string, targetId: string, position: DropPosition) => void;
    expandedPages: Record<string, boolean>;
    toggleExpand: (id: string) => void;
    dragOverInfo: DragOverInfo | null;
    setDragOverInfo: React.Dispatch<React.SetStateAction<DragOverInfo | null>>;
    draggingId: string | null;
    setDraggingId: React.Dispatch<React.SetStateAction<string | null>>;
    isSearching: boolean;
}

const PageItem: React.FC<PageItemProps> = ({ 
    page, allPages, level, activePageId, 
    onSelectPage, onAddPage, onDeletePage, onRenamePage, onMovePage,
    expandedPages, toggleExpand, 
    dragOverInfo, setDragOverInfo, draggingId, setDraggingId,
    isSearching
}) => {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);
  const expandTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const children = useMemo(() => allPages.filter(p => p.parentId === page.id).sort((a,b) => a.order - b.order), [allPages, page.id]);
  const isExpanded = expandedPages[page.id] ?? false;

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
        renameInputRef.current.focus();
    }
  }, [renamingId]);

  const handleStartRename = (pageToRename: NotePage) => {
    setRenamingId(pageToRename.id);
    setRenameValue(pageToRename.title);
  };

  const handleFinishRename = () => {
    if (renamingId && renameValue.trim()) {
        onRenamePage(renamingId, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue('');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
        handleFinishRename();
    } else if (event.key === 'Escape') {
        setRenamingId(null);
        setRenameValue('');
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (isSearching) return;
    e.dataTransfer.setData('pageId', page.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(page.id);
  };

  const handleDragEnd = () => {
    if (isSearching) return;
    setDraggingId(null);
    setDragOverInfo(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (isSearching) return;
    e.preventDefault();
    if (draggingId === page.id) return;
    
    const targetElement = (e.target as HTMLElement).closest('li > div');
    if (!targetElement) return;

    const rect = targetElement.getBoundingClientRect();
    const dragY = e.clientY;
    
    let position: DropPosition;
    
    if (page.isFolder) {
        // Folders allow dropping inside
        const zoneHeight = rect.height * 0.25;
        
        if (dragY < rect.top + zoneHeight) {
            position = 'before';
        } else if (dragY > rect.bottom - zoneHeight) {
            position = 'after';
        } else {
            position = 'inside';
        }
    } else {
        // Non-folders: 50/50 split
        const midPoint = rect.top + rect.height / 2;
        if (dragY < midPoint) {
            position = 'before';
        } else {
            position = 'after';
        }
    }
    
    setDragOverInfo({ pageId: page.id, position });

    if (position === 'inside' && !isExpanded && page.isFolder) {
        if (!expandTimeoutRef.current) {
            expandTimeoutRef.current = setTimeout(() => {
                toggleExpand(page.id);
                expandTimeoutRef.current = null;
            }, 600);
        }
    } else {
        if (expandTimeoutRef.current) {
            clearTimeout(expandTimeoutRef.current);
            expandTimeoutRef.current = null;
        }
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
      if (isSearching) return;
      e.preventDefault();
      e.stopPropagation();
      const draggedId = e.dataTransfer.getData('pageId');
      if (draggedId && dragOverInfo) {
          onMovePage(draggedId, dragOverInfo.pageId, dragOverInfo.position);
      }
      setDragOverInfo(null);
      setDraggingId(null);
      if (expandTimeoutRef.current) {
          clearTimeout(expandTimeoutRef.current);
          expandTimeoutRef.current = null;
      }
  };

  const handleDragLeave = () => {
    if (isSearching) return;
    if (expandTimeoutRef.current) {
        clearTimeout(expandTimeoutRef.current);
        expandTimeoutRef.current = null;
    }
    setTimeout(() => {
        setDragOverInfo(current => (current?.pageId === page.id ? null : current));
    }, 50);
  };
  
  const isDraggingThis = draggingId === page.id;
  const isDropTarget = dragOverInfo?.pageId === page.id && draggingId !== page.id;
  const isFolder = page.isFolder;

  return (
    <li className="flex flex-col" style={{ opacity: isDraggingThis ? 0.5 : 1 }}>
        <div
            draggable={!isSearching}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragLeave={handleDragLeave}
            onClick={() => onSelectPage(page.id)}
            style={{ paddingLeft: `${level * 12}px` }}
            className={`group flex items-center justify-between w-full text-left p-1.5 rounded-md cursor-pointer transition-all text-sm relative
                ${activePageId === page.id && !isDropTarget ? 'bg-[var(--accent)] text-white' : 'hover:bg-[var(--border-primary)]'}
                ${isDropTarget && dragOverInfo?.position === 'before' ? 'border-t-2 border-[var(--accent)]' : ''}
                ${isDropTarget && dragOverInfo?.position === 'after' ? 'border-b-2 border-[var(--accent)]' : ''}
                ${isDropTarget && dragOverInfo?.position === 'inside' ? 'bg-[var(--highlight-kp-bg)]' : ''}
            `}
        >
            <div className="flex items-center gap-1 flex-grow truncate">
                {children.length > 0 || isFolder ? (
                    <button onClick={(e) => { e.stopPropagation(); toggleExpand(page.id); }} className="p-0.5 rounded hover:bg-black/10 flex-shrink-0">
                        {isExpanded ? <ChevronDownIcon className="w-3 h-3"/> : <ChevronRightIcon className="w-3 h-3"/>}
                    </button>
                ) : (
                    <div className="w-4 h-4 flex-shrink-0"></div>
                )}
                <div className="w-4 h-4 flex-shrink-0 mr-1 flex items-center justify-center text-base">
                    {page.icon ? (
                        <span>{page.icon}</span>
                    ) : (
                        isFolder ? <FolderIcon className="w-full h-full" /> : <DocumentTextIcon className="w-full h-full" />
                    )}
                </div>
                {renamingId === page.id ? (
                    <input
                        ref={renameInputRef}
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={handleFinishRename}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-transparent outline-none border-b border-white/50"
                    />
                ) : (
                    <span className="truncate flex-grow">{page.title}</span>
                )}
            </div>
            
            {renamingId !== page.id && (
                <div className={`flex items-center opacity-0 group-hover:opacity-100 transition-opacity ${activePageId === page.id ? 'opacity-100' : ''}`}>
                     <button onClick={(e) => { e.stopPropagation(); onAddPage(page.id, false); }} className="p-1 rounded hover:bg-black/20" title="Add Page">
                        <DocumentPlusIcon className="w-3 h-3" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onAddPage(page.id, true); }} className="p-1 rounded hover:bg-black/20" title="Add Folder">
                        <FolderPlusIcon className="w-3 h-3" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleStartRename(page); }} className="p-1 rounded hover:bg-black/20" title="Rename">
                        <PencilIcon className="w-3 h-3" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDeletePage(page.id); }} className="p-1 rounded hover:bg-black/20" title="Delete">
                        <TrashIcon className="w-3 h-3" />
                    </button>
                </div>
            )}
        </div>
        {isExpanded && children.length > 0 && (
            <ul className="flex flex-col">
                {children.map(childPage => (
                    <PageItem 
                        key={childPage.id}
                        page={childPage}
                        allPages={allPages}
                        level={level + 1}
                        {...{ activePageId, onSelectPage, onAddPage, onDeletePage, onRenamePage, onMovePage, expandedPages, toggleExpand, dragOverInfo, setDragOverInfo, draggingId, setDraggingId, isSearching }}
                    />
                ))}
            </ul>
        )}
    </li>
  );
};

interface SidebarProps {
  isOpen: boolean;
  pages: NotePage[];
  activePageId: string | null;
  onSelectPage: (id: string) => void;
  onAddPage: (parentId: string | null, isFolder: boolean) => void;
  onDeletePage: (id: string) => void;
  onRenamePage: (id: string, newTitle: string) => void;
  onMovePage: (draggedId: string, targetId: string, position: DropPosition) => void;
  backgroundAnimation: BackgroundAnimationType;
  onAnimationChange: (type: BackgroundAnimationType) => void;
  tagsMap: Map<string, number>;
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  onOpenSettings: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    isOpen, pages, activePageId, onSelectPage, onAddPage, onDeletePage, onRenamePage, onMovePage, backgroundAnimation, onAnimationChange,
    tagsMap, selectedTag, onSelectTag, onOpenSettings
}) => {
  const [expandedPages, setExpandedPages] = useState<Record<string, boolean>>({});
  const [dragOverInfo, setDragOverInfo] = useState<DragOverInfo | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleExpand = (pageId: string) => {
    setExpandedPages(prev => ({ ...prev, [pageId]: !prev[pageId] }));
  };
  
  const handleExpandAll = () => {
    const allParentIds = pages.reduce((acc, p) => {
      if (pages.some(child => child.parentId === p.id)) {
        acc[p.id] = true;
      }
      return acc;
    }, {} as Record<string, boolean>);
    setExpandedPages(allParentIds);
  };
  
  const handleCollapseAll = () => {
    setExpandedPages({});
  };

  const handleCycleAnimation = () => {
    const animations: BackgroundAnimationType[] = ['none', 'floatingTiles', 'pulsingDots', 'gridStrobe', 'floatingShapes', 'matrixRain', 'fallingLeaves'];
    const currentIndex = animations.indexOf(backgroundAnimation);
    const nextIndex = (currentIndex + 1) % animations.length;
    onAnimationChange(animations[nextIndex]);
  };

  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) {
      return pages;
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    const matchingPageIds = new Set<string>();

    const pageMap = new Map(pages.map(p => [p.id, p]));

    pages.forEach(page => {
      if (page.title.toLowerCase().includes(lowerCaseQuery)) {
        matchingPageIds.add(page.id);
        let current = page;
        while (current.parentId) {
          matchingPageIds.add(current.parentId);
          const parent = pageMap.get(current.parentId);
          if (parent) {
            current = parent;
          } else {
            break;
          }
        }
      }
    });

    return pages.filter(p => matchingPageIds.has(p.id));
  }, [pages, searchQuery]);

  useEffect(() => {
      if (searchQuery.trim()) {
          const allParentIdsInFilter = filteredPages.reduce((acc, p) => {
              if(filteredPages.some(child => child.parentId === p.id)) {
                  acc[p.id] = true;
              }
              return acc;
          }, {} as Record<string, boolean>);
          setExpandedPages(allParentIdsInFilter);
      }
  }, [searchQuery, filteredPages]);

  const rootPages = useMemo(() => filteredPages.filter(p => p.parentId === null).sort((a,b) => a.order - b.order), [filteredPages]);
  const isSearching = !!searchQuery.trim();

  return (
    // Removed conditional backgroundAnimation class to prevent dark artifacts
    <aside className="relative flex flex-col h-full w-full p-4 overflow-hidden min-w-[250px]">
        <div className="relative z-10 flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] px-2">Pages</h2>
            <div className="flex items-center">
                 <button onClick={handleExpandAll} className="p-1 rounded hover:bg-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] btn-press" title="Expand All"><ArrowsPointingOutIcon className="w-4 h-4" /></button>
                 <button onClick={handleCollapseAll} className="p-1 rounded hover:bg-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] btn-press" title="Collapse All"><ArrowsPointingInIcon className="w-4 h-4" /></button>
                 <button
                    onClick={handleCycleAnimation}
                    className="p-1 rounded hover:bg-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] btn-press"
                    title="Cycle Background Animation"
                 >
                    <FilmIcon className="w-4 h-4" />
                </button>
                 <button onClick={() => onAddPage(null, true)} className="p-1 rounded hover:bg-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] btn-press" title="Add Folder"><FolderPlusIcon className="w-4 h-4" /></button>
                 <button onClick={() => onAddPage(null, false)} className="p-1 rounded hover:bg-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] btn-press" title="Add Page"><PlusIcon className="w-4 h-4" /></button>
            </div>
        </div>
         <div className="relative z-10 mb-2">
            <MagnifyingGlassIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <input 
                type="text"
                placeholder="Search pages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 text-sm bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
        </div>
        
        {/* Pages Tree */}
        <nav className="relative z-10 flex-grow overflow-y-auto -mr-2 pr-2 custom-scrollbar flex flex-col">
            <ul className="mb-4">
                {rootPages.map(page => (
                    <PageItem 
                        key={page.id}
                        page={page}
                        allPages={filteredPages}
                        level={0}
                        activePageId={activePageId}
                        onSelectPage={onSelectPage}
                        onAddPage={onAddPage}
                        onDeletePage={onDeletePage}
                        onRenamePage={onRenamePage}
                        onMovePage={onMovePage}
                        expandedPages={expandedPages}
                        toggleExpand={toggleExpand}
                        dragOverInfo={dragOverInfo}
                        setDragOverInfo={setDragOverInfo}
                        draggingId={draggingId}
                        setDraggingId={setDraggingId}
                        isSearching={isSearching}
                    />
                ))}
            </ul>

            {/* Tags Section */}
            {tagsMap.size > 0 && (
                <div className="pt-4 border-t border-[var(--border-primary)] mt-auto mb-4">
                     <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] px-2 mb-3 flex justify-between items-center">
                         <span className="flex items-center gap-1"><TagIcon className="w-3 h-3" /> Tags</span>
                         {selectedTag && (
                             <button 
                                onClick={() => onSelectTag(null)}
                                className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--danger)] text-white hover:opacity-80 transition-opacity"
                             >
                                 Clear
                             </button>
                         )}
                     </h2>
                     <div className="flex flex-col gap-1 max-h-[150px] overflow-y-auto custom-scrollbar">
                         {Array.from(tagsMap.entries()).map(([tag, count]) => (
                             <button
                                key={tag}
                                onClick={() => onSelectTag(selectedTag === tag ? null : tag)}
                                className={`flex items-center justify-between px-3 py-1.5 text-xs transition-all w-full text-left group arrow-tag
                                    ${selectedTag === tag ? 'bg-[var(--accent)] text-white shadow-sm' : 'hover:bg-[var(--border-primary)] text-[var(--text-primary)]'}
                                `}
                             >
                                 <div className="flex items-center gap-2 truncate">
                                     <span className="truncate">{tag}</span>
                                 </div>
                                 <span className={`text-[10px] px-1.5 rounded-full border ${selectedTag === tag ? 'bg-white/20 border-transparent text-white' : 'bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-secondary)]'}`}>
                                     {count}
                                 </span>
                             </button>
                         ))}
                     </div>
                </div>
            )}
        </nav>

        {/* Footer: Settings */}
        <div className="relative z-10 pt-2 border-t border-[var(--border-primary)] mt-2">
            <button 
                onClick={onOpenSettings}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)] group btn-press"
            >
                <CogIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                <span className="text-sm font-medium">Settings</span>
            </button>
        </div>
    </aside>
  );
};

export default Sidebar;
