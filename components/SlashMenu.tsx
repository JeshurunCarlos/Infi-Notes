
import React, { useEffect, useRef } from 'react';
import { ListBulletIcon, ListNumberIcon, QuoteIcon, CodeBracketIcon, BoldIcon, ImageIcon } from './Icons';

interface SlashMenuProps {
  position: { top: number; left: number };
  onSelect: (command: string, arg?: string) => void;
  onClose: () => void;
}

const SlashMenu: React.FC<SlashMenuProps> = ({ position, onSelect, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  const items = [
    { label: 'Heading 1', command: 'formatBlock', arg: 'H1', icon: <span className="font-bold text-lg">H1</span> },
    { label: 'Heading 2', command: 'formatBlock', arg: 'H2', icon: <span className="font-bold text-md">H2</span> },
    { label: 'Heading 3', command: 'formatBlock', arg: 'H3', icon: <span className="font-bold text-sm">H3</span> },
    { label: 'Bulleted List', command: 'insertUnorderedList', icon: <ListBulletIcon className="w-4 h-4" /> },
    { label: 'Numbered List', command: 'insertOrderedList', icon: <ListNumberIcon className="w-4 h-4" /> },
    { label: 'Quote', command: 'formatBlock', arg: 'blockquote', icon: <QuoteIcon className="w-4 h-4" /> },
    { label: 'Code Block', command: 'formatBlock', arg: 'pre', icon: <CodeBracketIcon className="w-4 h-4" /> },
    { label: 'Divider', command: 'insertHorizontalRule', icon: <span className="font-bold">-</span> },
    { label: 'Image', command: 'insertImage', icon: <ImageIcon className="w-4 h-4" /> },
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed bg-[var(--bg-secondary)] border border-[var(--border-primary)] shadow-xl rounded-lg w-64 z-50 overflow-hidden animated-popover flex flex-col py-1"
      style={{ top: position.top, left: position.left }}
    >
        <div className="px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border-primary)] mb-1">
            Basic Blocks
        </div>
      {items.map((item, index) => (
        <button
          key={index}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onSelect(item.command, item.arg)}
          className="flex items-center gap-3 px-3 py-2 hover:bg-[var(--bg-primary)] text-sm text-left w-full transition-colors"
        >
          <div className="w-6 h-6 flex items-center justify-center border border-[var(--border-primary)] rounded bg-[var(--bg-primary)] text-[var(--text-secondary)]">
            {item.icon}
          </div>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default SlashMenu;
