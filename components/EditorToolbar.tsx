
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    BoldIcon, ItalicIcon, UnderlineIcon, StrikethroughIcon,
    ListBulletIcon, ListNumberIcon, QuoteIcon, CodeBracketIcon,
    AlignLeftIcon, AlignCenterIcon, AlignRightIcon, AlignJustifyIcon,
    UndoIcon, RedoIcon, IndentDecreaseIcon, IndentIncreaseIcon,
    SubscriptIcon, SuperscriptIcon, EraserIcon, LinkIcon, ChevronDownIcon, CheckIcon
} from './Icons';

interface ToolbarButtonProps {
    command: string;
    children: React.ReactNode;
    title: string;
    active: boolean;
    arg?: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ command, children, title, active, arg }) => {
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent losing focus from editor
        if (command === 'createLink') {
            const url = prompt('Enter link URL:', 'https://');
            if (url) {
                document.execCommand(command, false, url);
            }
        } else {
            document.execCommand(command, false, arg);
        }
    };

    return (
        <button
            onMouseDown={handleMouseDown}
            className={`editor-toolbar-button ${active ? 'active' : ''}`}
            title={title}
        >
            {children}
        </button>
    );
};

const EditorToolbar = () => {
    const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
    const [blockType, setBlockType] = useState('p');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const savedRange = useRef<Range | null>(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

    const updateToolbarState = useCallback(() => {
        const newActiveFormats = new Set<string>();
        const commands = [
            'bold', 'italic', 'underline', 'strikethrough', 
            'insertUnorderedList', 'insertOrderedList',
            'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull',
            'subscript', 'superscript'
        ];
        
        commands.forEach(cmd => {
            try {
                if (document.queryCommandState(cmd)) {
                    newActiveFormats.add(cmd);
                }
            } catch (e) {}
        });

        let parentNode = window.getSelection()?.focusNode?.parentNode;
        let currentBlockType = 'p';
        while (parentNode) {
            const tagName = parentNode.nodeName.toLowerCase();
            if (['p', 'h1', 'h2', 'h3', 'blockquote', 'pre'].includes(tagName)) {
                currentBlockType = tagName;
                break;
            }
            if ((parentNode as HTMLElement).isContentEditable) break;
            parentNode = parentNode.parentNode;
        }
        setBlockType(currentBlockType);
        setActiveFormats(newActiveFormats);
    }, []);

    useEffect(() => {
        const handleSelectionChange = () => {
            updateToolbarState();
        };
        document.addEventListener('selectionchange', handleSelectionChange);
        document.addEventListener('focusin', handleSelectionChange);
        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange);
            document.removeEventListener('focusin', handleSelectionChange);
        };
    }, [updateToolbarState]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) && 
                triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const saveSelection = () => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            savedRange.current = sel.getRangeAt(0).cloneRange();
        }
    };

    const restoreSelection = () => {
        const sel = window.getSelection();
        if (sel && savedRange.current) {
            sel.removeAllRanges();
            sel.addRange(savedRange.current);
        }
    };
    
    const toggleDropdown = (e: React.MouseEvent) => {
        e.preventDefault();
        saveSelection();
        if (!isDropdownOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setDropdownPos({ top: rect.bottom + 8, left: rect.left });
        }
        setIsDropdownOpen(!isDropdownOpen);
    };

    const handleFormatBlock = (tag: string) => {
        restoreSelection(); // CRITICAL: Restore selection before applying command
        document.execCommand('formatBlock', false, `<${tag}>`);
        setBlockType(tag);
        setIsDropdownOpen(false);
        // Ensure editor regains focus immediately
        const editor = document.querySelector('.notebook-textarea') as HTMLElement;
        if (editor) editor.focus();
    };

    const blockTypeLabels: Record<string, string> = {
        'p': 'Paragraph',
        'h1': 'Heading 1',
        'h2': 'Heading 2',
        'h3': 'Heading 3',
        'blockquote': 'Quote',
        'pre': 'Code'
    };

    return (
        <div className="editor-toolbar flex-shrink-0 relative">
            {/* Custom Themed Dropdown with Portal to avoid Clipping */}
            <div className="relative">
                <button 
                    ref={triggerRef}
                    onMouseDown={toggleDropdown}
                    className={`flex items-center gap-2 px-3 py-1 text-xs font-bold transition-all rounded-md active:scale-95 border border-transparent
                        ${isDropdownOpen ? 'bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'}
                    `}
                >
                    <span className="min-w-[70px] text-left">{blockTypeLabels[blockType] || 'Text Style'}</span>
                    <ChevronDownIcon className={`w-3 h-3 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && createPortal(
                    <div 
                        ref={dropdownRef}
                        className="fixed bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl shadow-2xl z-[9999] overflow-hidden animated-popover py-1.5 backdrop-blur-md w-52"
                        style={{ top: dropdownPos.top, left: dropdownPos.left }}
                    >
                        {Object.entries(blockTypeLabels).map(([tag, label]) => (
                            <button
                                key={tag}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => handleFormatBlock(tag)}
                                className={`flex items-center justify-between w-full px-4 py-2.5 text-xs font-semibold text-left transition-all
                                    ${blockType === tag 
                                        ? 'bg-[var(--accent)] text-white' 
                                        : 'text-[var(--text-primary)] hover:bg-[var(--bg-primary)] hover:pl-5'}
                                `}
                            >
                                <span className={tag === 'p' ? '' : (tag === 'h1' ? 'text-lg font-black' : (tag === 'h2' ? 'text-base font-bold' : (tag === 'h3' ? 'text-sm font-bold' : '')))}>{label}</span>
                                {blockType === tag && <CheckIcon className="w-3.5 h-3.5" />}
                            </button>
                        ))}
                    </div>,
                    document.body
                )}
            </div>

            <div className="editor-toolbar-separator" />
            
            <ToolbarButton command="undo" title="Undo (Ctrl+Z)" active={false}><UndoIcon className="w-4 h-4" /></ToolbarButton>
            <ToolbarButton command="redo" title="Redo (Ctrl+Y)" active={false}><RedoIcon className="w-4 h-4" /></ToolbarButton>
            
            <div className="editor-toolbar-separator" />

            <ToolbarButton command="bold" title="Bold (Ctrl+B)" active={activeFormats.has('bold')}><BoldIcon className="w-4 h-4" /></ToolbarButton>
            <ToolbarButton command="italic" title="Italic (Ctrl+I)" active={activeFormats.has('italic')}><ItalicIcon className="w-4 h-4" /></ToolbarButton>
            <ToolbarButton command="underline" title="Underline (Ctrl+U)" active={activeFormats.has('underline')}><UnderlineIcon className="w-4 h-4" /></ToolbarButton>
            <ToolbarButton command="strikethrough" title="Strikethrough" active={activeFormats.has('strikethrough')}><StrikethroughIcon className="w-4 h-4" /></ToolbarButton>
            <ToolbarButton command="subscript" title="Subscript" active={activeFormats.has('subscript')}><SubscriptIcon className="w-4 h-4" /></ToolbarButton>
            <ToolbarButton command="superscript" title="Superscript" active={activeFormats.has('superscript')}><SuperscriptIcon className="w-4 h-4" /></ToolbarButton>
            
            <div className="editor-toolbar-separator" />
            
            <ToolbarButton command="insertUnorderedList" title="Bulleted List" active={activeFormats.has('insertUnorderedList')}><ListBulletIcon className="w-5 h-5" /></ToolbarButton>
            <ToolbarButton command="insertOrderedList" title="Numbered List" active={activeFormats.has('insertOrderedList')}><ListNumberIcon className="w-5 h-5" /></ToolbarButton>
            <ToolbarButton command="outdent" title="Decrease Indent" active={false}><IndentDecreaseIcon className="w-5 h-5" /></ToolbarButton>
            <ToolbarButton command="indent" title="Increase Indent" active={false}><IndentIncreaseIcon className="w-5 h-5" /></ToolbarButton>

            <div className="editor-toolbar-separator" />

            <ToolbarButton command="justifyLeft" title="Align Left" active={activeFormats.has('justifyLeft')}><AlignLeftIcon className="w-5 h-5" /></ToolbarButton>
            <ToolbarButton command="justifyCenter" title="Align Center" active={activeFormats.has('justifyCenter')}><AlignCenterIcon className="w-5 h-5" /></ToolbarButton>
            <ToolbarButton command="justifyRight" title="Align Right" active={activeFormats.has('justifyRight')}><AlignRightIcon className="w-5 h-5" /></ToolbarButton>
            <ToolbarButton command="justifyFull" title="Justify" active={activeFormats.has('justifyFull')}><AlignJustifyIcon className="w-5 h-5" /></ToolbarButton>
            
            <div className="editor-toolbar-separator" />

            <ToolbarButton command="formatBlock" arg="blockquote" title="Blockquote" active={blockType === 'blockquote'}><QuoteIcon className="w-5 h-5" /></ToolbarButton>
            <ToolbarButton command="formatBlock" arg="pre" title="Code Block" active={blockType === 'pre'}><CodeBracketIcon className="w-5 h-5" /></ToolbarButton>
            <ToolbarButton command="createLink" title="Insert Link" active={false}><LinkIcon className="w-4 h-4" /></ToolbarButton>
            
            <div className="editor-toolbar-separator" />
            
            <ToolbarButton command="removeFormat" title="Clear Formatting" active={false}><EraserIcon className="w-4 h-4" /></ToolbarButton>
        </div>
    );
};

export default EditorToolbar;
