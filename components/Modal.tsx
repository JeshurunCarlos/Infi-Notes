
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from './Icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    full: 'max-w-5xl h-[90vh]',
};

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
        document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div 
        className={`
            relative z-10 bg-[var(--bg-secondary)] text-[var(--text-primary)] 
            rounded-xl shadow-2xl border border-[var(--border-primary)] 
            flex flex-col overflow-hidden animate-[popIn_0.3s_cubic-bezier(0.16,1,0.3,1)]
            ${sizeClasses[size]} w-full max-h-[90vh]
        `}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-primary)] flex-shrink-0 bg-[var(--bg-secondary)]/50 backdrop-blur-md">
          <h2 className="text-lg font-bold truncate pr-4">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[var(--border-primary)] btn-press transition-colors">
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
        <div className={`p-6 overflow-y-auto custom-scrollbar ${size === 'full' ? 'flex-grow' : ''}`}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
