
export interface Lesson {
  id: string;
  title: string;
  description: string;
  type: 'grammar' | 'vocabulary' | 'reading' | 'speaking' | 'writing';
  completed: boolean;
  content: string;
}

export interface DayPlan {
  day: number;
  week: number;
  title: string;
  focus: string;
  lessons: Lesson[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export type View = 'dashboard' | 'curriculum' | 'tutor' | 'writing-lab' | 'progress';
