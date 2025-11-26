
import React, { useState, useEffect, useCallback } from 'react';
import {
    BoldIcon, ItalicIcon, UnderlineIcon, StrikethroughIcon,
    ListBulletIcon, ListNumberIcon, QuoteIcon, CodeBracketIcon,
    AlignLeftIcon, AlignCenterIcon, AlignRightIcon, AlignJustifyIcon,
    UndoIcon, RedoIcon, IndentDecreaseIcon, IndentIncreaseIcon,
    SubscriptIcon, SuperscriptIcon, EraserIcon, LinkIcon
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
        e.preventDefault();
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

    const updateToolbarState = useCallback(() => {
        const newActiveFormats = new Set<string>();
        const commands = [
            'bold', 'italic', 'underline', 'strikethrough', 
            'insertUnorderedList', 'insertOrderedList',
            'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull',
            'subscript', 'superscript'
        ];
        
        commands.forEach(cmd => {
            if (document.queryCommandState(cmd)) {
                newActiveFormats.add(cmd);
            }
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
    
    const handleFormatBlock = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const tag = e.target.value;
        document.execCommand('formatBlock', false, `<${tag}>`);
    };

    return (
        <div className="editor-toolbar flex-shrink-0">
            <select value={blockType} onChange={handleFormatBlock} className="editor-toolbar-select" title="Text Style">
                <option value="p">Paragraph</option>
                <option value="h1">Heading 1</option>
                <option value="h2">Heading 2</option>
                <option value="h3">Heading 3</option>
            </select>
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
