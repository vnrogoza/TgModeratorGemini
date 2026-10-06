export type SentimentType = 'positive' | 'neutral' | 'negative' | 'aggressive' | 'constructive';

export type ModerationAction = 'allow' | 'warn' | 'delete' | 'mute_temp' | 'ban';

export interface ModerationResult {
  score: number; // strictly -5 to +5
  sentiment: SentimentType;
  profanityDetected: boolean;
  profanityWords: string[];
  toxicityScore: number; // 0.0 to 1.0
  categories: string[];
  explanation: string;
  action: ModerationAction;
  muteDurationMinutes?: number;
}

export interface UserHistoryItem {
  id: string;
  text: string;
  timestamp: number;
  score: number;
  sentiment: SentimentType;
  profanity: boolean;
  actionTaken: ModerationAction;
}

export interface UserRecord {
  id: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  rating: number; // cumulative karma score
  totalMessages: number;
  toxicMessages: number;
  profanityMessages: number;
  positiveMessages: number;
  status: 'active' | 'warned' | 'muted' | 'banned';
  mutedUntil?: number; // timestamp in ms
  lastActivity: number;
  history: UserHistoryItem[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface ChatMessage {
  id: string;
  userId: string;
  user: {
    id: string;
    username: string;
    fullName: string;
    rating: number;
    status: 'active' | 'warned' | 'muted' | 'banned';
    avatarUrl?: string;
  };
  text: string;
  timestamp: number;
  moderation?: ModerationResult;
  isDeleted?: boolean;
  botReply?: string;
}

export interface BotSettings {
  muteThreshold: number; // e.g. -10
  banThreshold: number; // e.g. -25
  muteDurationMinutes: number; // e.g. 60 min (1 hour)
  autoDeleteProfanity: boolean;
  showRatingBadgeUnderAll: boolean;
  realTelegramConnected: boolean;
  telegramBotUsername?: string;
}

export interface ModerationStats {
  totalMessages: number;
  totalViolations: number;
  profanityCount: number;
  averageRating: number;
  mutedUsersCount: number;
  bannedUsersCount: number;
  totalUsersCount: number;
  sentimentCounts: Record<SentimentType, number>;
}
