export interface User {
    id: string;
    name: string;
    email: string;
    avatar: string;
}

export type Theme = 'light' | 'matrix' | 'monokai' | 'pitch-black' | 'frosty' | 'cyberpunk' | 'paper';

export type WidgetType = 'empty' | 'pomodoro' | 'image' | 'hyperlink' | 'calculator' | 'selecting' | 'stickynote' | 'music' | 'spotify' | 'todolist' | 'terminal' | 'googlesearch' | 'snake' | 'dictionary' | 'downloadpdf' | 'tictactoe' | 'chatgpt' | 'game2048' | 'news' | 'wikipedia' | 'weather' | 'live-ai';

export type BackgroundAnimationType = 'none' | 'floatingTiles' | 'pulsingDots' | 'gridStrobe' | 'floatingShapes' | 'matrixRain' | 'fallingLeaves';

export interface WidgetState {
  type: WidgetType;
  data?: any;
  isBgToggled?: boolean;
  position?: { x: number; y: number };
}

export interface FloatingWidget {
  id: string;
  type: WidgetType;
  data: any;
  x: number;
  y: number;
  isDragging?: boolean;
}

export interface ToDoItem {
  id: string;
  text: string;
  description?: string;
  completed: boolean;
  status: 'todo' | 'doing' | 'done';
  date?: string; // ISO date string or YYYY-MM-DD
}

export interface NotePage {
  id: string;
  title: string;
  content: string;
  parentId: string | null;
  order: number;
  todos: ToDoItem[];
  isFolder?: boolean;
  icon?: string; // Emoji or icon char
  coverImage?: string; // URL for cover image
  tags?: string[]; // Array of tags
}

export interface LiveMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: number;
}