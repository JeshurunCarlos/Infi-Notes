
import React, { useState, useCallback, useRef, useEffect } from 'react';
import Modal from './Modal';
import { UploadIcon, CloseIcon, DocumentTextIcon, TrashIcon, PlusIcon, ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon } from './Icons';

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
        // This is a simplified highlighter. 
        // A robust one requires complex range-to-viewport coordinate mapping logic which is quite extensive.
        // For this demo, we mock visual persistence by overlaying the current selection rect.
        // Real implementation would parse PDF text coordinates.
        if (selectionRect && textLayerRef.current) {
            const containerRect = textLayerRef.current.getBoundingClientRect();
            // Approximating the highlight rect based on the selection menu position
            // In a real app, use range.getClientRects() and map relative to viewport
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
                                
                                {/* Floating Context Menu */}
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
                    /* Library View */
                    <div className="flex flex-col h-full">
                         <div 
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                            className={`flex-shrink-0 w-full p-8 mb-6 flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-all cursor-pointer group
                                ${isDragging 
                                    ? 'border-[var(--accent)] bg-[var(--highlight-kp-bg)] scale-[1.01]' 
                                    : 'border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--accent)] hover:bg-[var(--bg-primary)]'
                                }`
                            }
                        >
                            <div className={`p-4 rounded-full bg-[var(--bg-primary)] mb-3 transition-transform group-hover:scale-110 ${isDragging ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--accent)]'}`}>
                                <UploadIcon className="w-8 h-8" />
                            </div>
                            <p className="text-lg font-bold mb-1">Add PDF Files</p>
                            <p className="text-sm text-[var(--text-secondary)]">Drag & Drop or Click to Browse</p>
                            <input type="file" ref={fileInputRef} className="hidden" accept="application/pdf" multiple onChange={(e) => e.target.files && handleFiles(e.target.files)} />
                        </div>

                        <div className="flex-grow overflow-y-auto custom-scrollbar">
                            {library.length === 0 ? (
                                <div className="text-center text-[var(--text-secondary)] mt-12 opacity-60">
                                    <DocumentTextIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p>Your library is empty.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 p-2">
                                    {library.map((pdf) => (
                                        <div key={pdf.id} onClick={() => setCurrentPdf(pdf)} className="group relative flex flex-col gap-2 cursor-pointer">
                                            <div className="aspect-[1/1.4] bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all relative">
                                                {pdf.thumbnail ? (
                                                    <img src={pdf.thumbnail} alt={pdf.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-[var(--bg-secondary)]">
                                                        <DocumentTextIcon className="w-12 h-12 text-[var(--text-secondary)] opacity-50" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            </div>
                                            <p className="text-xs font-semibold text-center truncate px-1 text-[var(--text-primary)]" title={pdf.name}>{pdf.name}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default PdfViewer;
