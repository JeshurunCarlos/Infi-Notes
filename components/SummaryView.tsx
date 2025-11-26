
import React from 'react';

interface SummaryViewProps {
  summaryContent: string;
  onClose: () => void;
  onAppend: (plainTextSummary: string) => void;
}

const SummaryView: React.FC<SummaryViewProps> = ({ summaryContent, onClose, onAppend }) => {

  const parseAndRenderLine = (text: string) => {
    // Handle bullet points at the start
    let content = text;
    let isListItem = false;
    if (content.trim().startsWith('- ') || content.trim().startsWith('* ') || content.trim().startsWith('• ')) {
        isListItem = true;
        content = content.trim().substring(2);
    }

    // Split by tags. Note: we now support <bd> which is 2 chars.
    const parts = content.split(/<(\/?[a-z]{2})>/g);
    const elements: React.ReactNode[] = [];
    let openTag: string | null = null;
    
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!part) continue;

        if (['kp', 'ps', 'dt', 'lc', 'bd'].includes(part)) {
            openTag = part;
        } else if (part.startsWith('/') && ['kp', 'ps', 'dt', 'lc', 'bd'].includes(part.substring(1))) {
            openTag = null;
        } else {
            // It is content
            if (openTag === 'bd') {
                 elements.push(<strong key={i} className="font-bold text-[var(--text-primary)]">{part}</strong>);
            } else if (openTag) {
                elements.push(<span key={i} className={`summary-highlight highlight-${openTag}`}>{part}</span>);
            } else {
                elements.push(<span key={i}>{part}</span>);
            }
        }
    }

    return isListItem ? (
        <li className="mb-2 pl-2">{elements}</li>
    ) : (
        <p className="mb-2">{elements}</p>
    );
  };

  const handleAppend = () => {
    const plainText = summaryContent.replace(/<[^>]+>/g, '');
    onAppend(plainText);
  };
  
  const lines = summaryContent.split('\n').filter(line => line.trim().length > 0);

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center p-8">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-[fadeIn_0.2s_ease-out]" 
        onClick={onClose}
      />
      
      {/* Centered Content Card */}
      <div className="relative z-10 w-full max-w-2xl bg-[var(--bg-secondary)] rounded-xl shadow-2xl border border-[var(--border-primary)] flex flex-col max-h-full animate-[popIn_0.3s_cubic-bezier(0.16,1,0.3,1)] overflow-hidden">
        <div className="flex-shrink-0 mb-0 border-b border-[var(--border-primary)] p-4 bg-[var(--bg-secondary)]/80 backdrop-blur-md">
          <h3 className="text-lg font-bold flex items-center gap-2">
              <span className="text-[var(--accent)]">✨</span> AI Summary
          </h3>
        </div>
        <div className="flex-grow overflow-y-auto bg-[var(--bg-primary)] p-6 text-sm leading-relaxed custom-scrollbar">
          <ul className="list-disc pl-4">
              {lines.map((line, idx) => (
                  <React.Fragment key={idx}>
                      {parseAndRenderLine(line)}
                  </React.Fragment>
              ))}
          </ul>
        </div>
        <div className="flex-shrink-0 flex justify-end gap-3 p-4 bg-[var(--bg-secondary)] border-t border-[var(--border-primary)]">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-md hover:bg-[var(--border-primary)] transition-all btn-press border border-[var(--border-primary)]">Close</button>
          <button onClick={handleAppend} className="px-4 py-2 text-sm font-semibold text-white bg-[var(--accent)] rounded-md hover:opacity-90 transition-all btn-press shadow-md">Append to Notes</button>
        </div>
      </div>
    </div>
  );
};

export default SummaryView;
