
import React, { useState, useMemo, useRef } from 'react';
import { ToDoItem } from '../App';
import { CheckIcon, PlusIcon, TrashIcon, ChevronDownIcon, BoardIcon, ListBulletIcon } from './Icons';
import KanbanBoard from './KanbanBoard';

interface ToDoListProps {
  todos: ToDoItem[];
  onChange: (todos: ToDoItem[]) => void;
  isWidget?: boolean;
  onCollapse?: () => void;
}

const ToDoList: React.FC<ToDoListProps> = ({ todos, onChange, isWidget = false, onCollapse }) => {
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [newTaskText, setNewTaskText] = useState('');
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const addTaskInputRef = useRef<HTMLInputElement>(null);

  const sortedTodos = useMemo(() => {
    return [...todos].sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));
  }, [todos]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskText.trim()) {
      const newTask: ToDoItem = {
        id: Date.now().toString(),
        text: newTaskText.trim(),
        completed: false,
        status: 'todo' // Default status
      };
      onChange([...todos, newTask]);
      setNewTaskText('');
    }
  };

  const handleToggleComplete = (id: string) => {
    onChange(todos.map(todo => {
        if (todo.id === id) {
            const newCompleted = !todo.completed;
            return { 
                ...todo, 
                completed: newCompleted,
                status: newCompleted ? 'done' : 'todo'
            };
        }
        return todo;
    }));
  };

  const handleDeleteTask = (id: string) => {
    setDeletingIds(prev => new Set(prev).add(id));
    setTimeout(() => {
      onChange(todos.filter(t => t.id !== id));
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }, 300);
  };
  
  const handleClearCompleted = () => {
      const completedIds = new Set(todos.filter(t => t.completed).map(t => t.id));
      setDeletingIds(prev => new Set([...prev, ...completedIds]));
      setTimeout(() => {
          onChange(todos.filter(t => !t.completed));
          setDeletingIds(prev => {
              const newSet = new Set(prev);
              completedIds.forEach(id => newSet.delete(id));
              return newSet;
          });
      }, 300);
  };

  const handleStartEdit = (todo: ToDoItem) => {
    setEditingId(todo.id);
    setEditText(todo.text);
  };

  const handleSaveEdit = () => {
    if (editingId && editText.trim()) {
      onChange(todos.map(t => t.id === editingId ? { ...t, text: editText.trim() } : t));
    }
    setEditingId(null);
    setEditText('');
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditText('');
    }
  };

  const incompleteCount = todos.filter(t => !t.completed).length;
  const completedCount = todos.length - incompleteCount;
  const progress = todos.length > 0 ? (completedCount / todos.length) * 100 : 0;

  return (
    <div className={`todo-list-card transition-all ${isWidget ? 'h-full flex flex-col widget-todo-gradient' : ''}`}>
       <div className={`todo-list-header ${isWidget ? 'justify-between' : ''}`}>
            <div className="flex items-center gap-2">
                 <h3 className="font-bold text-sm">Tasks</h3>
                 {viewMode === 'list' && !isWidget && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--accent)] text-white">{incompleteCount} Pending</span>
                 )}
            </div>
            
            <div className="flex items-center gap-1">
                <button
                    onClick={() => setViewMode(viewMode === 'list' ? 'board' : 'list')}
                    className="p-1 rounded hover:bg-[var(--border-primary)] text-[var(--text-secondary)] btn-press"
                    title={viewMode === 'list' ? "Switch to Board View" : "Switch to List View"}
                >
                    {viewMode === 'list' ? <BoardIcon className="w-4 h-4" /> : <ListBulletIcon className="w-4 h-4" />}
                </button>
                
                {!isWidget && completedCount > 0 && viewMode === 'list' && (
                    <button
                        onClick={(e) => { e.stopPropagation(); handleClearCompleted(); }}
                        className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--danger)] ml-2"
                    >
                        Clear Done
                    </button>
                )}
                {onCollapse && (
                    <button
                        onClick={onCollapse}
                        className="p-1 rounded-full text-[var(--text-secondary)] hover:bg-[var(--border-primary)] hover:text-[var(--text-primary)] btn-press ml-1"
                        title="Collapse"
                    >
                        <ChevronDownIcon className="w-4 h-4" />
                    </button>
                )}
            </div>
      </div>
      
      {viewMode === 'board' ? (
          <div className="flex-grow overflow-hidden p-2">
              <KanbanBoard todos={todos} onChange={onChange} />
          </div>
      ) : (
        <div className={`overflow-hidden ${isWidget ? 'flex-grow flex flex-col' : ''}`}>
            {/* Progress bar */}
            <div className="px-3 pt-2">
                <div className="w-full bg-[var(--border-primary)] rounded-full h-1.5">
                    <div className="bg-[var(--accent)] h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            <ul className={isWidget ? 'flex-grow overflow-y-auto px-3 custom-scrollbar' : 'todo-list-items custom-scrollbar'}>
            {sortedTodos.map(todo => (
                <li
                key={todo.id}
                className={`todo-item group flex items-center gap-3 py-2 border-b border-[var(--border-primary)] last:border-b-0 transition-colors hover:bg-[var(--bg-primary)] ${
                    deletingIds.has(todo.id) ? 'todo-item-exit-active' : 'todo-item-enter-active'
                } ${todo.completed ? 'completed' : ''}`}
                >
                <div
                    onClick={(e) => { e.stopPropagation(); handleToggleComplete(todo.id); }}
                    className={`todo-checkbox ${todo.completed ? 'completed' : ''}`}
                    aria-label={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
                >
                    {todo.completed && <CheckIcon className="w-3 h-3 text-white" />}
                </div>
                {editingId === todo.id ? (
                <input
                    type="text"
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    onBlur={handleSaveEdit}
                    onKeyDown={handleEditKeyDown}
                    className="flex-grow text-sm bg-transparent border-b-2 border-[var(--accent)] focus:outline-none"
                    autoFocus
                />
                ) : (
                <span onClick={() => handleStartEdit(todo)} className="flex-grow text-sm truncate cursor-pointer">{todo.text}</span>
                )}
                <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteTask(todo.id); }}
                    className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--danger)] hover:bg-[var(--border-primary)] btn-press opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Delete task"
                >
                    <TrashIcon className="w-4 h-4" />
                </button>
                </li>
            ))}
            {todos.length === 0 && (
                <li className="text-center text-sm text-[var(--text-secondary)] py-4">No tasks yet.</li>
            )}
            </ul>
            
            <form onSubmit={handleAddTask} className={isWidget ? "todo-list-form flex-shrink-0" : "todo-list-form"}>
                <div className="flex items-center gap-2">
                    <PlusIcon className="w-4 h-4 text-[var(--text-secondary)] flex-shrink-0" />
                    <input
                        ref={addTaskInputRef}
                        type="text"
                        value={newTaskText}
                        onChange={e => setNewTaskText(e.target.value)}
                        placeholder={isWidget ? "Add a task..." : "Add a new task..."}
                        className="flex-grow w-full text-sm bg-transparent focus:outline-none"
                    />
                    <button type="submit" className="p-1.5 rounded-md bg-[var(--accent)] text-white hover:opacity-90 btn-press text-xs font-bold" aria-label="Add task">
                        {isWidget ? <PlusIcon className="w-4 h-4" /> : "ADD"}
                    </button>
                </div>
            </form>
        </div>
      )}
    </div>
  );
};

export default ToDoList;
