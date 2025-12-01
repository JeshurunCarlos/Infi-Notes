
export interface User {
    id: string;
    name: string;
    email: string;
    avatar: string;
}

export type Theme = 'light' | 'matrix' | 'monokai' | 'pitch-black' | 'frosty' | 'cyberpunk';

export type WidgetType = 'empty' | 'pomodoro' | 'image' | 'hyperlink' | 'calculator' | 'selecting' | 'stickynote' | 'music' | 'spotify' | 'todolist' | 'terminal' | 'googlesearch' | 'snake' | 'dictionary' | 'zipgame' | 'tictactoe' | 'chatgpt' | 'game2048' | 'news';

export type BackgroundAnimationType = 'none' | 'floatingTiles' | 'pulsingDots' | 'gridStrobe' | 'floatingShapes' | 'matrixRain' | 'fallingLeaves';

export interface WidgetState {
  type: WidgetType;
  data?: any;
  isBgToggled?: boolean;
}

export interface ToDoItem {
  id: string;
  text: string;
  completed: boolean;
  status: 'todo' | 'doing' | 'done';
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
