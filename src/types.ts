export interface UploadedFile {
  id: string;
  name: string;
  size: string;
  type: string;
  data?: string; // base64 data URL
  textContent?: string;
  pageCount?: number;
  uploadedAt: string;
  selected: boolean;
  isSample?: boolean;
}

export interface MetricItem {
  label: string;
  value: string;
  context?: string;
}

export interface TopicItem {
  topic: string;
  summary: string;
}

export interface DocumentSummary {
  title: string;
  executiveSummary: string;
  keyTakeaways: string[];
  keyMetrics: MetricItem[];
  actionItems: string[];
  topicBreakdown: TopicItem[];
  suggestedQuestions: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isThinking?: boolean;
}

export type SummaryPreset = 'executive' | 'deep_dive' | 'actionable' | 'eli5' | 'study_guide';

export interface GoogleUserProfile {
  sub: string;
  email: string;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email_verified?: boolean;
}

export interface UserSettings {
  currentPreset?: SummaryPreset;
  customFocus?: string;
  activeTab?: 'summary' | 'chat';
  theme?: 'light' | 'dark' | 'system';
}

export interface ChunkItem {
  id: string;
  fileId: string;
  fileName: string;
  chunkIndex: number;
  text: string;
}
