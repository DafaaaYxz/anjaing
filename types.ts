export interface User {
  username: string;
  password: string; // In a real app, hash this.
  requestedAiName: string;
  requestedDevName: string;
  isNameApproved: boolean;
  isAdmin: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string; // base64
  timestamp: number;
}

export interface ChatSession {
  id: string;
  username: string;
  messages: Message[];
  title: string;
  lastUpdated: number;
}

export interface GlobalSettings {
  apiKeys: string[];
  maintenanceMode: boolean;
  featureImageGen: boolean;
  customPersona: string;
}

export enum Page {
  BOOT = 'BOOT',
  HOME = 'HOME',
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  TERMINAL = 'TERMINAL',
  HISTORY = 'HISTORY',
  ABOUT = 'ABOUT',
  TESTIMONI = 'TESTIMONI',
  ADMIN = 'ADMIN',
  MAINTENANCE = 'MAINTENANCE',
  CODE_VIEW = 'CODE_VIEW'
}
