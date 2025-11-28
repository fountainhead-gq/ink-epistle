
export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  TEMPLATES = 'TEMPLATES',
  PHRASE_ATLAS = 'PHRASE_ATLAS',
  PRACTICE = 'PRACTICE',
  EDITOR = 'EDITOR',
  SIMULATOR = 'SIMULATOR',
  BOOTCAMP = 'BOOTCAMP',
  STORY_MODE = 'STORY_MODE',
  MUSEUM = 'MUSEUM',
  AI_TUTOR = 'AI_TUTOR',
  COMMUNITY = 'COMMUNITY',
  SEAL_STUDIO = 'SEAL_STUDIO',
  FLYING_FLOWER = 'FLYING_FLOWER',
}

export interface User {
  id: string;
  name: string;
  styleName: string;
  avatarColor: string;
  joinedDate: string;
  isPro?: boolean;
  seals?: Seal[];
}

export interface UserActivity {
  date: string;
  minutes: number;
  wordsWritten: number;
  lettersSent: number;
  loginCount: number;
  aiCalls?: number;
}

export interface Template {
  id: string;
  title: string;
  category: string;
  recipient: string;
  preview: string;
  structure: string[];
}

export interface Phrase {
  id: string;
  text: string;
  meaning: string;
  type: 'honorific' | 'greeting' | 'sentiment' | 'closing';
  tags: string[];
}

export interface QuizQuestion {
  id: string;
  type: 'single' | 'multi' | 'fill';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  tags?: string[];
}

export interface QuizResult {
  questionId: string;
  isCorrect: boolean;
  timestamp: string;
  tags?: string[];
}

export interface HistoricalFigure {
  id: string;
  name: string;
  title: string;
  description: string;
  avatarColor: string;
  initialMessage: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export interface StoryStep {
  type: 'narrative' | 'letter';
  content: string;
  sender?: string;
}

export interface Scenario {
  id: string;
  title: string;
  role: string;
  desc: string;
  openingNarrative: string;
  initialLetter: string;
  npcName: string;
  isGenerated?: boolean;
}

export interface DraftSnapshot {
  id: string;
  content: string;
  timestamp: string;
  summary?: string;
}

export interface RhythmData {
  sentences: {
    text: string;
    tones: ('ping' | 'ze' | 'unknown')[];
  }[];
  varianceScore: number;
  rhymeScheme: string[];
}

export interface SpectrumData {
  temperature: number;
  style: number;
  emotion: number;
  rhythm: number;
  structure: number;
  summary: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  userId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  likes: number;
  likedBy: string[];
  comments: Comment[];
  createdAt: string;
  tags?: string[];
}

export interface SealConfig {
    text: string;
    style: 'zhuwen' | 'baiwen';
    shape: 'square' | 'circle' | 'oval';
    font: 'zhuanshu' | 'lishu' | 'kaishu';
    wearLevel: number;
}

export interface Seal extends SealConfig {
  id: string;
  createdAt: string;
}

export interface FlyingFlowerTurn {
  sender: 'user' | 'ai';
  verse: string;
  isCorrect?: boolean;
  reason?: string;
}

export interface FlyingFlowerGame {
  id: string;
  timestamp: string;
  keyword: string;
  score: number;
  turns: FlyingFlowerTurn[];
}
