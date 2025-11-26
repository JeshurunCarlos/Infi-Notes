
import React, { useState } from 'react';
import { ToDoItem } from '../App';
import { PlusIcon, TrashIcon } from './Icons';

interface KanbanBoardProps {
    todos: ToDoItem[];
    onChange: (todos: ToDoItem[]) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ todos, onChange }) => {
    const [draggingId, setDraggingId] = useState<string | null>(null);

    const columns: { id: ToDoItem['status'], title: string }[] = [
        { id: 'todo', title: 'To Do' },
        { id: 'doing', title: 'In Progress' },
        { id: 'done', title: 'Done' }
    ];

    const handleDragStart = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData('todoId', id);
        setDraggingId(id);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, status: ToDoItem['status']) => {
        const id = e.dataTransfer.getData('todoId');
        const updatedTodos = todos.map(t => {
            if (t.id === id) {
                // Also update 'completed' boolean for backward compatibility
                return { ...t, status, completed: status === 'done' };
            }
            return t;
        });
        onChange(updatedTodos);
        setDraggingId(null);
    };

    const handleDelete = (id: string) => {
        onChange(todos.filter(t => t.id !== id));
    };

    return (
        <div className="flex h-full gap-4 overflow-x-auto pb-2">
            {columns.map(col => (
                <div 
                    key={col.id}
                    className="flex-1 min-w-[200px] bg-[var(--bg-primary)] rounded-lg border border-[var(--border-primary)] flex flex-col max-h-full"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col.id)}
                >
                    <div className="p-3 border-b border-[var(--border-primary)] font-bold text-sm flex justify-between items-center bg-[var(--bg-secondary)] rounded-t-lg">
                        <span>{col.title}</span>
                        <span className="bg-[var(--border-primary)] px-2 py-0.5 rounded-full text-xs">
                            {todos.filter(t => t.status === col.id).length}
                        </span>
                    </div>
                    <div className="flex-grow overflow-y-auto p-2 space-y-2 custom-scrollbar">
                        {todos.filter(t => t.status === col.id).map(todo => (
                            <div
                                key={todo.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, todo.id)}
                                className={`p-3 rounded bg-[var(--bg-secondary)] border border-[var(--border-primary)] shadow-sm cursor-grab active:cursor-grabbing hover:border-[var(--accent)] group transition-all ${draggingId === todo.id ? 'opacity-50' : ''}`}
                            >
                                <p className="text-sm text-[var(--text-primary)] mb-2">{todo.text}</p>
                                <div className="flex justify-end">
                                    <button 
                                        onClick={() => handleDelete(todo.id)}
                                        className="p-1 text-[var(--text-secondary)] hover:text-[var(--danger)] opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <TrashIcon className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Dropping area hint if empty */}
                    {todos.filter(t => t.status === col.id).length === 0 && (
                        <div className="flex-grow flex items-center justify-center text-[var(--text-secondary)] opacity-30 text-xs italic">
                            Drop items here
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default KanbanBoard;
