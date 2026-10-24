// Local storage utilities for Brolife app

export interface UserProfile {
  broName: string;
  userName: string;
  theme: 'light' | 'dark';
  preferences: {
    focusAreas: string[];
    workingHours: { start: string; end: string };
  };
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'health' | 'learning' | 'side-hustle' | 'personal';
  targetDate: string;
  progress: number;
  milestones: { id: string; title: string; completed: boolean }[];
  createdAt: string;
}

export interface ProgressData {
  date: string;
  health: number;
  food: number;
  learning: number;
  goals: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface TimetableSlot {
  id: string;
  time: string;
  activity: string;
  category: 'work' | 'health' | 'learning' | 'personal' | 'side-hustle';
  duration: number;
}

// Storage keys
const STORAGE_KEYS = {
  USER_PROFILE: 'brolife_user_profile',
  GOALS: 'brolife_goals',
  PROGRESS_DATA: 'brolife_progress',
  CHAT_HISTORY: 'brolife_chat_history',
  TIMETABLE: 'brolife_timetable',
} as const;

// Generic storage functions
export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
    }
  },
};

// Specific storage functions
export const userProfileStorage = {
  get: (): UserProfile => storage.get(STORAGE_KEYS.USER_PROFILE, {
    broName: 'Bro',
    userName: 'Champion',
    theme: 'light' as const,
    preferences: {
      focusAreas: ['health', 'learning'],
      workingHours: { start: '09:00', end: '17:00' },
    },
  }),
  set: (profile: UserProfile) => storage.set(STORAGE_KEYS.USER_PROFILE, profile),
};

export const goalsStorage = {
  get: (): Goal[] => storage.get(STORAGE_KEYS.GOALS, []),
  set: (goals: Goal[]) => storage.set(STORAGE_KEYS.GOALS, goals),
  add: (goal: Goal) => {
    const goals = goalsStorage.get();
    goals.push(goal);
    goalsStorage.set(goals);
  },
  update: (goalId: string, updates: Partial<Goal>) => {
    const goals = goalsStorage.get();
    const index = goals.findIndex(g => g.id === goalId);
    if (index !== -1) {
      goals[index] = { ...goals[index], ...updates };
      goalsStorage.set(goals);
    }
  },
};

export const progressStorage = {
  get: (): ProgressData[] => storage.get(STORAGE_KEYS.PROGRESS_DATA, []),
  set: (data: ProgressData[]) => storage.set(STORAGE_KEYS.PROGRESS_DATA, data),
  addDaily: (data: ProgressData) => {
    const progressData = progressStorage.get();
    const existingIndex = progressData.findIndex(p => p.date === data.date);
    if (existingIndex !== -1) {
      progressData[existingIndex] = data;
    } else {
      progressData.push(data);
    }
    progressStorage.set(progressData);
  },
};

export const chatStorage = {
  get: (): ChatMessage[] => storage.get(STORAGE_KEYS.CHAT_HISTORY, []),
  set: (messages: ChatMessage[]) => storage.set(STORAGE_KEYS.CHAT_HISTORY, messages),
  add: (message: ChatMessage) => {
    const messages = chatStorage.get();
    messages.push(message);
    // Keep only last 100 messages
    if (messages.length > 100) {
      messages.splice(0, messages.length - 100);
    }
    chatStorage.set(messages);
  },
};

export const timetableStorage = {
  get: (): TimetableSlot[] => storage.get(STORAGE_KEYS.TIMETABLE, []),
  set: (slots: TimetableSlot[]) => storage.set(STORAGE_KEYS.TIMETABLE, slots),
};

// Utility functions
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const getCurrentFocus = (): 'side-hustle' | 'health' => {
  const day = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
  // Side Hustle: Monday(1), Wednesday(3), Friday(5), Sunday(0)
  // Health: Tuesday(2), Thursday(4), Saturday(6)
  return [1, 3, 5, 0].includes(day) ? 'side-hustle' : 'health';
};