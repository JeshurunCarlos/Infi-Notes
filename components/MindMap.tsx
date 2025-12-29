
import React, { useState, useRef, useEffect, useCallback } from 'react';
// Added Squares2X2Icon to imports
import { PlusIcon, CloseIcon, TrashIcon, CheckIcon, ArrowPathIcon, Squares2X2Icon } from './Icons';

interface MindNode {
    id: string;
    text: string;
    icon: string;
    x: number;
    y: number;
    color: string;
    shape: 'circle' | 'rect';
}

interface Connection {
    from: string;
    to: string;
    style: 'solid' | 'dashed';
}

interface MindMapProps {
    onClose: () => void;
}

const EMOJIS = ["💡", "🚀", "📝", "🎯", "⚡", "🌈", "🔥", "⚙️", "🧩", "📚", "🧠", "🔍"];
const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#2dd4bf", "#64748b"];

const MindMap: React.FC<MindMapProps> = ({ onClose }) => {
    const [nodes, setNodes] = useState<MindNode[]>([
        { id: '1', text: 'Central Idea', icon: '💡', x: 200, y: 200, color: '#3b82f6', shape: 'circle' }
    ]);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
    const [connectingFromId, setConnectingFromId] = useState<string | null>(null);
    const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (id: string, e: React.MouseEvent) => {
        if (connectingFromId) {
            if (connectingFromId !== id) {
                setConnections(prev => [...prev, { from: connectingFromId, to: id, style: 'solid' }]);
            }
            setConnectingFromId(null);
            return;
        }
        setDraggingNodeId(id);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!draggingNodeId || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left - 40;
        const y = e.clientY - rect.top - 40;
        setNodes(prev => prev.map(n => n.id === draggingNodeId ? { ...n, x, y } : n));
    };

    const handleMouseUp = () => { setDraggingNodeId(null); };

    const addNode = (parentId: string) => {
        const parent = nodes.find(n => n.id === parentId);
        if (!parent) return;
        const newNode: MindNode = {
            id: Date.now().toString(),
            text: 'New Point',
            icon: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
            x: parent.x + 150,
            y: parent.y + (Math.random() * 100 - 50),
            color: parent.color,
            shape: 'rect'
        };
        setNodes(prev => [...prev, newNode]);
        setConnections(prev => [...prev, { from: parentId, to: newNode.id, style: 'solid' }]);
        setEditingNodeId(newNode.id);
    };

    const deleteNode = (id: string) => {
        if (nodes.length <= 1) return;
        setNodes(prev => prev.filter(n => n.id !== id));
        setConnections(prev => prev.filter(c => c.from !== id && c.to !== id));
    };

    const updateNode = (id: string, updates: Partial<MindNode>) => {
        setNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
    };

    const toggleConnectionStyle = (idx: number) => {
        setConnections(prev => prev.map((c, i) => i === idx ? { ...c, style: c.style === 'solid' ? 'dashed' : 'solid' } : c));
    };

    const recenter = () => {
        setNodes(prev => prev.map(n => ({ ...n, x: n.x - (prev[0].x - 200), y: n.y - (prev[0].y - 200) })));
    };

    return (
        <div 
            className="absolute inset-0 z-[100] bg-[var(--bg-primary-glass)] backdrop-blur-md flex flex-col animate-[spring-up_0.5s_cubic-bezier(0.16,1,0.3,1)] overflow-hidden"
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[var(--accent)] text-white rounded-lg shadow-lg"><CubeIcon className="w-5 h-5" /></div>
                    <h2 className="font-bold text-lg tracking-tight">Interactive Knowledge Map</h2>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={recenter} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-full hover:bg-[var(--accent)] hover:text-white transition-all">Recenter</button>
                    <button onClick={() => { if(confirm("Clear board?")) { setNodes([nodes[0]]); setConnections([]); } }} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-rose-500 bg-rose-50 border border-rose-100 rounded-full hover:bg-rose-500 hover:text-white transition-all">Reset</button>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--border-primary)] transition-colors"><CloseIcon className="w-5 h-5" /></button>
                </div>
            </div>

            <div className="flex-grow relative overflow-hidden bg-[radial-gradient(var(--border-primary)_1px,transparent_1px)] [background-size:24px_24px]">
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                    {connections.map((conn, idx) => {
                        const fromNode = nodes.find(n => n.id === conn.from);
                        const toNode = nodes.find(n => n.id === conn.to);
                        if (!fromNode || !toNode) return null;
                        return (
                            <line 
                                key={idx} 
                                x1={fromNode.x + 40} y1={fromNode.y + 40} 
                                x2={toNode.x + 40} y2={toNode.y + 40} 
                                stroke={fromNode.color} 
                                strokeWidth="2" 
                                strokeDasharray={conn.style === 'dashed' ? "6,6" : "0"}
                                opacity="0.6"
                                className="pointer-events-auto cursor-pointer transition-all hover:stroke-width-[4]"
                                onClick={(e) => { e.stopPropagation(); toggleConnectionStyle(idx); }}
                            />
                        );
                    })}
                </svg>

                {nodes.map(node => (
                    <div 
                        key={node.id}
                        style={{ left: node.x, top: node.y }}
                        className={`absolute w-40 z-10 select-none ${draggingNodeId === node.id ? 'cursor-grabbing scale-105' : 'cursor-grab'} transition-transform duration-150`}
                        onMouseDown={(e) => handleMouseDown(node.id, e)}
                    >
                        <div 
                            className={`p-3 border-2 transition-all duration-300 group
                                ${node.shape === 'circle' ? 'rounded-full aspect-square' : 'rounded-2xl'}
                                ${connectingFromId === node.id ? 'border-[var(--accent)] bg-[var(--accent)] text-white' : 'bg-[var(--bg-primary)] border-[var(--border-primary)] hover:shadow-2xl shadow-lg'}`}
                            style={{ borderColor: connectingFromId === node.id ? undefined : node.color }}
                        >
                            <div className="flex flex-col items-center justify-center h-full gap-1">
                                <div className="text-2xl mb-1">{node.icon}</div>
                                {editingNodeId === node.id ? (
                                    <input 
                                        autoFocus
                                        value={node.text}
                                        onChange={(e) => updateNode(node.id, { text: e.target.value })}
                                        onBlur={() => setEditingNodeId(null)}
                                        onKeyDown={(e) => e.key === 'Enter' && setEditingNodeId(null)}
                                        className="w-full text-center bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-tight"
                                    />
                                ) : (
                                    <span onDoubleClick={() => setEditingNodeId(node.id)} className="text-[10px] font-black uppercase tracking-tight text-center leading-tight line-clamp-2">{node.text}</span>
                                )}
                            </div>

                            {/* Node Floating Context Controls */}
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-20 bg-[var(--bg-secondary)]/80 backdrop-blur-sm p-1 rounded-full border border-[var(--border-primary)] shadow-xl">
                                <button onClick={(e) => { e.stopPropagation(); addNode(node.id); }} className="p-1.5 bg-emerald-500 text-white rounded-full hover:scale-110"><PlusIcon className="w-3 h-3" /></button>
                                <button onClick={(e) => { e.stopPropagation(); setConnectingFromId(node.id); }} className="p-1.5 bg-indigo-500 text-white rounded-full hover:scale-110"><ArrowPathIcon className="w-3 h-3" /></button>
                                <button onClick={(e) => { e.stopPropagation(); updateNode(node.id, { shape: node.shape === 'circle' ? 'rect' : 'circle' }); }} className="p-1.5 bg-slate-500 text-white rounded-full hover:scale-110"><Squares2X2Icon className="w-3 h-3" /></button>
                                <button onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }} className="p-1.5 bg-rose-500 text-white rounded-full hover:scale-110"><TrashIcon className="w-3 h-3" /></button>
                            </div>

                            {/* Color & Icon Strip */}
                            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all group-hover:-bottom-14 flex flex-col gap-1 items-center z-20">
                                <div className="flex gap-0.5 bg-[var(--bg-secondary)] p-1 rounded-full border border-[var(--border-primary)] shadow-md overflow-hidden">
                                    {COLORS.slice(0, 4).map(c => (
                                        <button key={c} onClick={(e) => { e.stopPropagation(); updateNode(node.id, { color: c }); }} className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: c }} />
                                    ))}
                                </div>
                                <div className="flex gap-0.5 bg-[var(--bg-secondary)] p-1 rounded-full border border-[var(--border-primary)] shadow-md overflow-hidden">
                                    {EMOJIS.slice(0, 5).map(emoji => (
                                        <button key={emoji} onClick={(e) => { e.stopPropagation(); updateNode(node.id, { icon: emoji }); }} className="w-6 h-6 flex items-center justify-center text-[10px] hover:bg-[var(--bg-primary)] rounded-full">{emoji}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <style>{`@keyframes dash { to { stroke-dashoffset: -100; } }`}</style>
        </div>
    );
};

const CubeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
  </svg>
);

export default MindMap;
