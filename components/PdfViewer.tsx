
import React, { useState, useCallback, useRef, useEffect } from 'react';
import Modal from './Modal';
import { UploadIcon, CloseIcon, DocumentTextIcon, TrashIcon, PlusIcon, ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon, BookOpenIcon, GlobeIcon, ArrowPathIcon } from './Icons';
import Spinner from './Spinner';

export interface PdfFile {
    id: string;
    name: string;
    url: string;
    thumbnail?: string;
}

interface PdfViewerProps {
    isOpen: boolean;
    onClose: () => void;
    library: PdfFile[];
    onAddToLibrary: (files: PdfFile[]) => void;
    onDefineWord?: (word: string) => void;
}

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

const PdfViewer: React.FC<PdfViewerProps> = ({ isOpen, onClose, library, onAddToLibrary, onDefineWord }) => {
    const [currentPdf, setCurrentPdf] = useState<PdfFile | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [viewMode, setViewMode] = useState<'library' | 'web'>('library');
    const [webLoading, setWebLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // PDF State
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [scale, setScale] = useState<number>(1.2);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const textLayerRef = useRef<HTMLDivElement>(null);
    const renderTaskRef = useRef<any>(null);
    
    // Selection State
    const [selectionRect, setSelectionRect] = useState<{top: number, left: number} | null>(null);
    const [selectedText, setSelectedText] = useState<string>("");

    useEffect(() => {
        if (currentPdf) {
            setPageNumber(1);
            setViewMode('library'); // Reset to library view when opening a specific PDF
        }
    }, [currentPdf]);

    const renderPage = useCallback(async () => {
        if (!currentPdf || !window.pdfjsLib || !canvasRef.current || !textLayerRef.current) return;

        try {
            if (renderTaskRef.current) {
                await renderTaskRef.current.cancel();
            }

            const loadingTask = window.pdfjsLib.getDocument(currentPdf.url);
            const pdf = await loadingTask.promise;
            setNumPages(pdf.numPages);

            const page = await pdf.getPage(pageNumber);
            const viewport = page.getViewport({ scale });
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            renderTaskRef.current = page.render(renderContext);
            await renderTaskRef.current.promise;

            const textContent = await page.getTextContent();
            textLayerRef.current.innerHTML = '';
            textLayerRef.current.style.height = `${viewport.height}px`;
            textLayerRef.current.style.width = `${viewport.width}px`;
            textLayerRef.current.style.setProperty('--scale-factor', String(viewport.scale));

            // @ts-ignore
            window.pdfjsLib.renderTextLayer({
                textContentSource: textContent,
                container: textLayerRef.current,
                viewport: viewport,
                textDivs: []
            });

        } catch (error: any) {
            if (error.name !== 'RenderingCancelledException') {
                console.error("Error rendering PDF page:", error);
            }
        }
    }, [currentPdf, pageNumber, scale]);

    useEffect(() => {
        if (isOpen && currentPdf) renderPage();
    }, [isOpen, currentPdf, renderPage]);

    const handleTextSelection = () => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0 && textLayerRef.current) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const containerRect = textLayerRef.current.getBoundingClientRect();

            setSelectionRect({
                top: rect.top - containerRect.top - 40,
                left: rect.left - containerRect.left
            });
            setSelectedText(selection.toString());
        } else {
            setSelectionRect(null);
        }
    };

    const generateThumbnail = async (url: string): Promise<string | undefined> => {
        try {
            if (!window.pdfjsLib) return undefined;
            const loadingTask = window.pdfjsLib.getDocument(url);
            const pdf = await loadingTask.promise;
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 0.5 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) return undefined;
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            await page.render({ canvasContext: context, viewport: viewport }).promise;
            return canvas.toDataURL();
        } catch (error) {
            return undefined;
        }
    };

    const handleFiles = async (files: FileList) => {
        const newPdfs: PdfFile[] = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.type === 'application/pdf') {
                const url = URL.createObjectURL(file);
                const id = Date.now().toString() + Math.random();
                const thumbnail = await generateThumbnail(url);
                newPdfs.push({ id, name: file.name, url, thumbnail });
            }
        }
        if (newPdfs.length > 0) onAddToLibrary(newPdfs);
    };

    const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
    };

    return (
        <Modal isOpen={isOpen} onClose={() => { setCurrentPdf(null); setViewMode('library'); onClose(); }} title={currentPdf ? currentPdf.name : (viewMode === 'web' ? "PDF Search Engine" : "PDF Library")} size="full">
            <div className="h-full flex flex-col relative">
                {currentPdf ? (
                    <div className="flex flex-col h-full relative">
                        <div className="flex justify-between items-center mb-2 p-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg">
                            <button 
                                onClick={() => setCurrentPdf(null)}
                                className="px-3 py-1.5 text-xs font-semibold bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded hover:bg-[var(--border-primary)] transition-all flex items-center gap-2"
                            >
                                ← Library
                            </button>
                            <div className="flex items-center gap-4">
                                <button disabled={pageNumber <= 1} onClick={() => setPageNumber(p => p - 1)} className="p-1 rounded hover:bg-[var(--border-primary)] disabled:opacity-50"><ChevronLeftIcon className="w-4 h-4" /></button>
                                <span className="text-xs font-mono">Page {pageNumber} of {numPages}</span>
                                <button disabled={pageNumber >= numPages} onClick={() => setPageNumber(p => p + 1)} className="p-1 rounded hover:bg-[var(--border-primary)] disabled:opacity-50"><ChevronRightIcon className="w-4 h-4" /></button>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} className="p-1 rounded hover:bg-[var(--border-primary)]"><span className="text-lg">-</span></button>
                                <span className="text-xs w-12 text-center">{Math.round(scale * 100)}%</span>
                                <button onClick={() => setScale(s => Math.min(3, s + 0.2))} className="p-1 rounded hover:bg-[var(--border-primary)]"><span className="text-lg">+</span></button>
                            </div>
                        </div>

                        <div className="flex-grow overflow-auto bg-gray-100 flex justify-center p-4 relative custom-scrollbar border border-[var(--border-primary)] rounded-lg">
                            <div className="relative shadow-lg" onMouseUp={handleTextSelection}>
                                <canvas ref={canvasRef} className="block" />
                                <div ref={textLayerRef} className="pdf-text-layer" />
                                {selectionRect && (
                                    <div 
                                        className="absolute z-50 flex gap-1 p-1 bg-[var(--bg-secondary)] rounded-lg shadow-xl border border-[var(--border-primary)] animate-[popIn_0.1s_ease-out]"
                                        style={{ top: selectionRect.top, left: selectionRect.left }}
                                    >
                                        <button onClick={() => {}} className="px-3 py-1 text-xs hover:bg-[var(--bg-primary)] rounded flex items-center gap-1">
                                            <span className="w-3 h-3 bg-yellow-300 rounded-full border border-gray-400"></span> Highlight
                                        </button>
                                        <div className="w-px bg-[var(--border-primary)]"></div>
                                        <button onClick={() => onDefineWord?.(selectedText.trim())} className="px-3 py-1 text-xs hover:bg-[var(--bg-primary)] rounded flex items-center gap-1">
                                            <MagnifyingGlassIcon className="w-3 h-3" /> Define
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : viewMode === 'web' ? (
                    <div className="flex flex-col h-full bg-[var(--bg-primary)] rounded-2xl overflow-hidden border border-[var(--border-primary)] animate-[fadeIn_0.3s_ease-out]">
                        <div className="flex justify-between items-center p-3 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)]">
                            <button 
                                onClick={() => setViewMode('library')}
                                className="px-4 py-1.5 bg-[var(--accent)] text-white text-xs font-bold rounded-full hover:opacity-90 transition-all flex items-center gap-2 shadow-sm"
                            >
                                <BookOpenIcon className="w-4 h-4" /> Back to Bookshelf
                            </button>
                            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                                <GlobeIcon className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">PDF Search Engine (PDFDrive)</span>
                            </div>
                            <button 
                                onClick={() => { setWebLoading(true); const ifr = document.getElementById('search-engine-ifr') as HTMLIFrameElement; if(ifr) ifr.src = ifr.src; }}
                                className="p-1.5 rounded-full hover:bg-[var(--border-primary)] text-[var(--text-secondary)]"
                                title="Refresh"
                            >
                                <ArrowPathIcon className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex-grow relative">
                            {webLoading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--bg-primary)] z-10 gap-3">
                                    <Spinner className="w-8 h-8 text-[var(--accent)]" />
                                    <span className="text-xs font-bold text-[var(--text-secondary)] animate-pulse">Connecting to Engine...</span>
                                </div>
                            )}
                            <iframe 
                                id="search-engine-ifr"
                                src="https://pdfdrive.com.co/" 
                                className="w-full h-full border-none"
                                onLoad={() => setWebLoading(false)}
                                title="PDF Search Engine"
                            />
                        </div>
                    </div>
                ) : (
                    <div 
                        className="flex-grow rounded-2xl overflow-hidden relative shadow-2xl flex flex-col"
                        style={{
                            backgroundImage: `url('https://api.aistudio.google.com/v1/files/scpcp9l9h687')`, 
                            backgroundSize: '100% 100%',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            backgroundColor: '#4a3728'
                        }}
                    >
                        {/* Top Right Floating Action Bar */}
                        <div className="absolute top-6 right-8 z-50 flex gap-3">
                            <button 
                                onClick={() => setViewMode('web')}
                                className="group flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-full shadow-2xl border border-white/10 hover:bg-indigo-500 hover:scale-105 transition-all duration-300"
                            >
                                <GlobeIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                <span className="text-xs font-black uppercase tracking-tighter">Search Web</span>
                            </button>
                        </div>

                        <input type="file" ref={fileInputRef} className="hidden" accept="application/pdf" multiple onChange={(e) => e.target.files && handleFiles(e.target.files)} />
                        
                        {/* Shelf overlay for depth */}
                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-black/20 via-transparent to-black/20 z-0"></div>

                        <div 
                            className="flex-grow overflow-y-auto custom-scrollbar relative z-10 pt-[4%] px-[8%] pb-[5%]"
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                        >
                            {/* 6 Shelves Grid alignment */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-10 gap-y-[6.5%] min-h-full content-start items-end">
                                
                                {/* Add PDF Placeholder */}
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`group relative flex flex-col justify-end cursor-pointer h-44 transition-all hover:-translate-y-2 duration-300 ${isDragging ? 'scale-105' : ''}`}
                                >
                                    <div className={`relative z-10 w-full aspect-[3/4.2] bg-white/10 backdrop-blur-md rounded-r shadow-lg border-2 border-dashed ${isDragging ? 'border-amber-400 bg-amber-400/20' : 'border-white/20 group-hover:border-amber-400 group-hover:bg-white/10'} flex flex-col items-center justify-center p-4 transition-all`}>
                                        <UploadIcon className="w-8 h-8 text-amber-100/40 mb-2 group-hover:text-amber-400 group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-bold text-white/30 text-center uppercase tracking-widest leading-tight">Add to Shelf</span>
                                    </div>
                                    <div className="absolute bottom-[-4px] left-2 right-2 h-3 bg-black/60 blur-lg rounded-full opacity-60"></div>
                                </div>

                                {library.map((pdf) => (
                                    <div 
                                        key={pdf.id} 
                                        onClick={() => setCurrentPdf(pdf)} 
                                        className="group relative flex flex-col justify-end cursor-pointer h-44 transition-all duration-500 ease-out hover:-translate-y-4"
                                        style={{ perspective: '1200px' }}
                                    >
                                        <div 
                                            className="relative z-10 aspect-[3/4.5] w-full bg-slate-50 rounded-r shadow-2xl transition-transform duration-500 group-hover:rotate-y-[-18deg] group-hover:scale-[1.03]"
                                            style={{
                                                boxShadow: '-8px 0 20px rgba(0,0,0,0.7), 15px 15px 35px rgba(0,0,0,0.6)',
                                                transformStyle: 'preserve-3d'
                                            }}
                                        >
                                            {/* Spine Detail */}
                                            <div className="absolute left-0 top-0 bottom-0 w-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 rounded-l shadow-inner z-20 border-r border-white/10">
                                                <div className="h-full w-full flex flex-col items-center py-4 gap-4 opacity-30">
                                                    <div className="w-0.5 h-full bg-white/20"></div>
                                                </div>
                                            </div>
                                            
                                            <div className="absolute inset-0 pl-5 h-full w-full bg-white overflow-hidden rounded-r">
                                                {pdf.thumbnail ? (
                                                    <img src={pdf.thumbnail} alt={pdf.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-slate-100">
                                                        <DocumentTextIcon className="w-12 h-12 text-slate-300 mb-3" />
                                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight line-clamp-4 leading-tight">{pdf.name}</span>
                                                    </div>
                                                )}
                                                {/* Page Edges Visual */}
                                                <div className="absolute top-0 right-0 h-full w-2 bg-gradient-to-l from-black/15 via-black/5 to-transparent"></div>
                                                <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-black/30 pointer-events-none z-30"></div>
                                            </div>

                                            {/* Removal Button */}
                                            <button 
                                                className="absolute top-2 right-2 z-40 p-1.5 bg-rose-600/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:scale-125 shadow-2xl backdrop-blur-sm border border-white/20"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if(confirm("Remove this from your bookshelf?")) {
                                                        onAddToLibrary(library.filter(p => p.id !== pdf.id));
                                                    }
                                                }}
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                        
                                        {/* Physical contact shadow */}
                                        <div className="absolute bottom-[-8px] left-4 right-[-8px] h-4 bg-black/90 blur-xl rounded-full group-hover:scale-x-125 group-hover:opacity-100 transition-all duration-500 opacity-80"></div>

                                        {/* Floating Label */}
                                        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md text-white text-[11px] font-bold px-4 py-1.5 rounded-full shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none z-30 max-w-[160px] truncate border border-white/20">
                                            {pdf.name}
                                        </div>
                                    </div>
                                ))}

                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default PdfViewer;
