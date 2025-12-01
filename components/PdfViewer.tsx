
import React, { useState, useCallback, useRef, useEffect } from 'react';
import Modal from './Modal';
import { UploadIcon, CloseIcon, DocumentTextIcon, TrashIcon, PlusIcon, ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon, BookOpenIcon } from './Icons';

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

interface Highlight {
    page: number;
    rect: number[]; // [x, y, w, h] normalized 0-1
    text?: string;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ isOpen, onClose, library, onAddToLibrary, onDefineWord }) => {
    const [currentPdf, setCurrentPdf] = useState<PdfFile | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // PDF State
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [scale, setScale] = useState<number>(1.2);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const textLayerRef = useRef<HTMLDivElement>(null);
    const renderTaskRef = useRef<any>(null);
    
    // Highlighting & Context Menu State
    const [highlights, setHighlights] = useState<Highlight[]>([]);
    const [selectionRect, setSelectionRect] = useState<{top: number, left: number} | null>(null);
    const [selectedText, setSelectedText] = useState<string>("");

    useEffect(() => {
        if (currentPdf) {
            // Load highlights from local storage
            const storedHighlights = localStorage.getItem(`pdf-highlights-${currentPdf.id}`);
            if (storedHighlights) {
                setHighlights(JSON.parse(storedHighlights));
            } else {
                setHighlights([]);
            }
            setPageNumber(1);
        }
    }, [currentPdf]);

    const saveHighlights = (newHighlights: Highlight[]) => {
        setHighlights(newHighlights);
        if (currentPdf) {
            localStorage.setItem(`pdf-highlights-${currentPdf.id}`, JSON.stringify(newHighlights));
        }
    };

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
            
            // Render Canvas
            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            renderTaskRef.current = page.render(renderContext);
            await renderTaskRef.current.promise;

            // Render Text Layer
            const textContent = await page.getTextContent();
            textLayerRef.current.innerHTML = ''; // Clear previous text
            textLayerRef.current.style.height = `${viewport.height}px`;
            textLayerRef.current.style.width = `${viewport.width}px`;
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
        renderPage();
    }, [renderPage]);

    const handleTextSelection = () => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0 && textLayerRef.current) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const containerRect = textLayerRef.current.getBoundingClientRect();

            // Calculate position relative to container
            setSelectionRect({
                top: rect.top - containerRect.top - 40, // Position above text
                left: rect.left - containerRect.left
            });
            setSelectedText(selection.toString());
        } else {
            setSelectionRect(null);
        }
    };

    const addHighlight = () => {
        if (selectionRect && textLayerRef.current) {
            alert("Highlighting requires advanced coordinate mapping logic (out of scope for this demo).");
        }
        setSelectionRect(null);
    };

    const defineWord = () => {
        if (onDefineWord && selectedText) {
            onDefineWord(selectedText.trim());
        }
        setSelectionRect(null);
        // Clear selection
        window.getSelection()?.removeAllRanges();
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

    // Helper to render shelf rows
    const renderShelfRow = (items: React.ReactNode[], rowIndex: number) => (
        <div key={rowIndex} className="relative mb-8 pt-4 px-4">
            <div className="flex gap-6 sm:gap-8 overflow-x-auto pb-4 items-end min-h-[180px] z-10 relative">
                {items}
            </div>
            {/* Shelf Graphic */}
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-[#e2e8f0] border-t border-[#cbd5e1] shadow-md z-0 transform skew-x-12 origin-bottom-left"></div>
            <div className="absolute bottom-[-10px] left-0 right-0 h-3 bg-[#cbd5e1]/50 blur-sm z-[-1]"></div>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={() => { setCurrentPdf(null); onClose(); }} title={currentPdf ? currentPdf.name : "PDF Library"} size="full">
            <div className="h-full flex flex-col">
                {currentPdf ? (
                    <div className="flex flex-col h-full relative">
                        {/* Toolbar */}
                        <div className="flex justify-between items-center mb-2 p-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg">
                            <button 
                                onClick={() => setCurrentPdf(null)}
                                className="px-3 py-1.5 text-xs font-semibold bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded hover:bg-[var(--border-primary)] transition-all flex items-center gap-2"
                            >
                                ← Library
                            </button>
                            <div className="flex items-center gap-4">
                                <button disabled={pageNumber <= 1} onClick={() => setPageNumber(p => p - 1)} className="p-1 rounded hover:bg-[var(--border-primary)] disabled:opacity-50"><ChevronLeftIcon /></button>
                                <span className="text-xs font-mono">Page {pageNumber} of {numPages}</span>
                                <button disabled={pageNumber >= numPages} onClick={() => setPageNumber(p => p + 1)} className="p-1 rounded hover:bg-[var(--border-primary)] disabled:opacity-50"><ChevronRightIcon /></button>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} className="p-1 rounded hover:bg-[var(--border-primary)]"><span className="text-lg">-</span></button>
                                <span className="text-xs w-12 text-center">{Math.round(scale * 100)}%</span>
                                <button onClick={() => setScale(s => Math.min(3, s + 0.2))} className="p-1 rounded hover:bg-[var(--border-primary)]"><span className="text-lg">+</span></button>
                            </div>
                        </div>

                        {/* PDF Canvas Container */}
                        <div className="flex-grow overflow-auto bg-gray-100 flex justify-center p-4 relative custom-scrollbar border border-[var(--border-primary)] rounded-lg">
                            <div className="relative shadow-lg" onMouseUp={handleTextSelection}>
                                <canvas ref={canvasRef} className="block" />
                                <div ref={textLayerRef} className="pdf-text-layer" />
                                
                                {selectionRect && (
                                    <div 
                                        className="absolute z-50 flex gap-1 p-1 bg-[var(--bg-secondary)] rounded-lg shadow-xl border border-[var(--border-primary)] animate-[popIn_0.1s_ease-out]"
                                        style={{ top: selectionRect.top, left: selectionRect.left }}
                                    >
                                        <button onClick={addHighlight} className="px-3 py-1 text-xs hover:bg-[var(--bg-primary)] rounded flex items-center gap-1">
                                            <span className="w-3 h-3 bg-yellow-300 rounded-full border border-gray-400"></span> Highlight
                                        </button>
                                        <div className="w-px bg-[var(--border-primary)]"></div>
                                        <button onClick={defineWord} className="px-3 py-1 text-xs hover:bg-[var(--bg-primary)] rounded flex items-center gap-1">
                                            <MagnifyingGlassIcon className="w-3 h-3" /> Define
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Library Bookshelf View */
                    <div className="flex flex-col h-full bg-[var(--bg-secondary)] rounded-lg overflow-hidden relative">
                        <input type="file" ref={fileInputRef} className="hidden" accept="application/pdf" multiple onChange={(e) => e.target.files && handleFiles(e.target.files)} />
                        
                        <div 
                            className="flex-grow overflow-y-auto custom-scrollbar p-8"
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                        >
                            {/* Render Library Items on Shelves */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-16 gap-x-8">
                                
                                {/* 1. Add PDF Button (Always first) */}
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`group relative flex flex-col justify-end cursor-pointer h-full min-h-[180px] w-full max-w-[140px] mx-auto transition-transform hover:-translate-y-2 duration-300 ${isDragging ? 'scale-105' : ''}`}
                                >
                                    <div className={`relative z-10 w-full aspect-[3/4] bg-[var(--bg-primary)] rounded-r-sm shadow-md border-2 border-dashed ${isDragging ? 'border-[var(--accent)] bg-[var(--highlight-kp-bg)]' : 'border-[var(--border-primary)] group-hover:border-[var(--accent)]'} flex flex-col items-center justify-center p-4 transition-colors`}>
                                        <div className="p-3 rounded-full bg-[var(--bg-secondary)] mb-2 group-hover:scale-110 transition-transform">
                                            <UploadIcon className="w-6 h-6 text-[var(--accent)]" />
                                        </div>
                                        <span className="text-[10px] font-bold text-[var(--text-secondary)] text-center uppercase tracking-wide">Add PDF</span>
                                    </div>
                                    <div className="absolute bottom-[2px] left-2 right-2 h-2 bg-black/10 blur-sm rounded-full opacity-0 group-hover:opacity-40 transition-opacity"></div>
                                </div>

                                {/* 2. Library Items */}
                                {library.map((pdf) => (
                                    <div key={pdf.id} onClick={() => setCurrentPdf(pdf)} className="group relative flex flex-col justify-end cursor-pointer h-full min-h-[180px] w-full max-w-[140px] mx-auto hover:-translate-y-2 transition-transform duration-300">
                                        {/* Book Body */}
                                        <div className="relative z-10 aspect-[3/4] w-full bg-white rounded-r-sm shadow-lg origin-bottom-left overflow-hidden" style={{
                                            boxShadow: '-1px 0 2px rgba(0,0,0,0.1), 4px 4px 12px rgba(0,0,0,0.15)'
                                        }}>
                                            {/* Spine */}
                                            <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-gray-300 to-gray-100 rounded-l-sm z-20 border-r border-black/5"></div>
                                            
                                            {/* Cover */}
                                            <div className="absolute inset-0 pl-3 h-full w-full bg-[var(--bg-primary)]">
                                                {pdf.thumbnail ? (
                                                    <img src={pdf.thumbnail} alt={pdf.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-[var(--bg-secondary)]">
                                                        <BookOpenIcon className="w-8 h-8 text-[var(--text-secondary)] opacity-50 mb-2" />
                                                        <span className="text-[9px] text-[var(--text-secondary)] font-medium line-clamp-3 leading-tight">{pdf.name}</span>
                                                    </div>
                                                )}
                                                {/* Gloss */}
                                                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/5 pointer-events-none"></div>
                                            </div>
                                        </div>
                                        
                                        {/* Shadow on Shelf */}
                                        <div className="absolute bottom-[-5px] left-2 right-2 h-3 bg-black/20 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                        {/* Title Tooltip */}
                                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-30 max-w-[150px] truncate">
                                            {pdf.name}
                                        </div>
                                    </div>
                                ))}

                                {/* 3. Empty Slot Fillers (To maintain grid look) */}
                                {Array.from({ length: Math.max(0, 9 - library.length) }).map((_, i) => (
                                    <div key={`empty-${i}`} className="w-full max-w-[140px] mx-auto h-full min-h-[180px] flex items-end opacity-20 pointer-events-none">
                                        <div className="w-full h-2 bg-[var(--border-primary)] rounded-full"></div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Shelf Lines Background */}
                            <div className="absolute inset-0 z-[-1] pointer-events-none" style={{
                                backgroundImage: `linear-gradient(to bottom, transparent 95%, var(--border-primary) 95%)`,
                                backgroundSize: '100% 240px', // Adjust based on grid row height
                                backgroundPosition: '0 30px'
                            }}></div>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default PdfViewer;
