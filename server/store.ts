import { BotSettings, ChatMessage, ModerationResult, ModerationStats, UserRecord } from "../src/types";

class ChatModerationStore {
  private users: Map<string, UserRecord> = new Map();
  private messages: ChatMessage[] = [];
  private settings: BotSettings = {
    muteThreshold: -10,
    banThreshold: -25,
    muteDurationMinutes: 120, // 2 hours
    autoDeleteProfanity: true,
    showRatingBadgeUnderAll: true,
    realTelegramConnected: false,
    telegramBotUsername: 'ModAIBot',
  };

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    const now = Date.now();

    const initialUsers: UserRecord[] = [
      {
        id: 'user_101',
        username: 'alex_tech',
        fullName: 'Алексей Смирнов',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        rating: 18,
        totalMessages: 24,
        toxicMessages: 0,
        profanityMessages: 0,
        positiveMessages: 19,
        status: 'active',
        lastActivity: now - 1000 * 60 * 15,
        riskLevel: 'low',
        history: [
          {
            id: 'h1',
            text: 'Привет всем! Если кому-то нужна помощь с настройкой вебхуков — пишите, подготовил инструкцию.',
            timestamp: now - 1000 * 60 * 60 * 3,
            score: 4,
            sentiment: 'constructive',
            profanity: false,
            actionTaken: 'allow',
          },
          {
            id: 'h2',
            text: 'Отличная идея, поддерживаю! Добавил ссылку на документацию в закреп.',
            timestamp: now - 1000 * 60 * 30,
            score: 3,
            sentiment: 'positive',
            profanity: false,
            actionTaken: 'allow',
          },
        ],
      },
      {
        id: 'user_102',
        username: 'anna_dev',
        fullName: 'Анна Кузнецова',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
        rating: 12,
        totalMessages: 14,
        toxicMessages: 0,
        profanityMessages: 0,
        positiveMessages: 10,
        status: 'active',
        lastActivity: now - 1000 * 60 * 45,
        riskLevel: 'low',
        history: [
          {
            id: 'h3',
            text: 'Спасибо огромное за фикс, всё заработало с первого раза!',
            timestamp: now - 1000 * 60 * 120,
            score: 4,
            sentiment: 'positive',
            profanity: false,
            actionTaken: 'allow',
          },
        ],
      },
      {
        id: 'user_103',
        username: 'dmitry_chaos',
        fullName: 'Дмитрий Тролль',
        avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
        rating: -14,
        totalMessages: 9,
        toxicMessages: 6,
        profanityMessages: 3,
        positiveMessages: 0,
        status: 'muted',
        mutedUntil: now + 1000 * 60 * 95, // muted for another 95 min
        lastActivity: now - 1000 * 60 * 25,
        riskLevel: 'critical',
        history: [
          {
            id: 'h4',
            text: 'Вы все тут тупые и ничего не понимаете, идите на*** отсюда',
            timestamp: now - 1000 * 60 * 180,
            score: -5,
            sentiment: 'aggressive',
            profanity: true,
            actionTaken: 'delete',
          },
          {
            id: 'h5',
            text: 'Админ криворукий даун, удали свой чат',
            timestamp: now - 1000 * 60 * 25,
            score: -5,
            sentiment: 'aggressive',
            profanity: true,
            actionTaken: 'mute_temp',
          },
        ],
      },
      {
        id: 'user_104',
        username: 'ivan_coder',
        fullName: 'Иван Петров',
        avatarUrl: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&auto=format&fit=crop&q=80',
        rating: 3,
        totalMessages: 6,
        toxicMessages: 1,
        profanityMessages: 0,
        positiveMessages: 3,
        status: 'active',
        lastActivity: now - 1000 * 60 * 5,
        riskLevel: 'medium',
        history: [
          {
            id: 'h6',
            text: 'Подскажите, где посмотреть параметры для Telegram Bot API?',
            timestamp: now - 1000 * 60 * 60,
            score: 1,
            sentiment: 'neutral',
            profanity: false,
            actionTaken: 'allow',
          },
        ],
      },
    ];

    for (const u of initialUsers) {
      this.users.set(u.id, u);
    }

    // Seed recent messages
    this.messages = [
      {
        id: 'msg_1',
        userId: 'user_101',
        user: {
          id: 'user_101',
          username: 'alex_tech',
          fullName: 'Алексей Смирнов',
          rating: 14,
          status: 'active',
          avatarUrl: initialUsers[0].avatarUrl,
        },
        text: 'Привет всем! Если кому-то нужна помощь с настройкой вебхуков — пишите, подготовил инструкцию.',
        timestamp: now - 1000 * 60 * 40,
        moderation: {
          score: 4,
          sentiment: 'constructive',
          profanityDetected: false,
          profanityWords: [],
          toxicityScore: 0.0,
          categories: ['Взаимопомощь', 'Конструктив'],
          explanation: 'Предложение бескорыстной помощи участникам чата и полезный материал.',
          action: 'allow',
        },
      },
      {
        id: 'msg_2',
        userId: 'user_102',
        user: {
          id: 'user_102',
          username: 'anna_dev',
          fullName: 'Анна Кузнецова',
          rating: 12,
          status: 'active',
          avatarUrl: initialUsers[1].avatarUrl,
        },
        text: 'Спасибо огромное за фикс, всё заработало с первого раза! 👍',
        timestamp: now - 1000 * 60 * 30,
        moderation: {
          score: 3,
          sentiment: 'positive',
          profanityDetected: false,
          profanityWords: [],
          toxicityScore: 0.0,
          categories: ['Благодарность', 'Доброжелательность'],
          explanation: 'Искренняя благодарность и позитивный тон.',
          action: 'allow',
        },
      },
      {
        id: 'msg_3',
        userId: 'user_103',
        user: {
          id: 'user_103',
          username: 'dmitry_chaos',
          fullName: 'Дмитрий Тролль',
          rating: -9,
          status: 'active',
          avatarUrl: initialUsers[2].avatarUrl,
        },
        text: 'Админ криворукий даун, удали свой чат и не позорься',
        timestamp: now - 1000 * 60 * 25,
        isDeleted: true,
        moderation: {
          score: -5,
          sentiment: 'aggressive',
          profanityDetected: false,
          profanityWords: ['даун'],
          toxicityScore: 0.95,
          categories: ['Оскорбление', 'Агрессия', 'Троллинг'],
          explanation: 'Прямое грубое оскорбление администрации. Токсичность 95%.',
          action: 'mute_temp',
          muteDurationMinutes: 120,
        },
        botReply: '🔇 Пользователь @dmitry_chaos временно заблокирован на 2 ч. Причина: Накоплен критический отрицательный рейтинг (-14). Оценка сообщения: [-5/5]',
      },
      {
        id: 'msg_4',
        userId: 'user_104',
        user: {
          id: 'user_104',
          username: 'ivan_coder',
          fullName: 'Иван Петров',
          rating: 3,
          status: 'active',
          avatarUrl: initialUsers[3].avatarUrl,
        },
        text: 'Подскажите пожалуйста, в какой вкладке настраивается вебхук модератора?',
        timestamp: now - 1000 * 60 * 10,
        moderation: {
          score: 1,
          sentiment: 'neutral',
          profanityDetected: false,
          profanityWords: [],
          toxicityScore: 0.0,
          categories: ['Вопрос по теме'],
          explanation: 'Вежливый вопрос по функционалу чата.',
          action: 'allow',
        },
      },
    ];
  }

  public getSettings(): BotSettings {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<BotSettings>): BotSettings {
    this.settings = { ...this.settings, ...partial };
    return this.settings;
  }

  public getAllUsers(): UserRecord[] {
    const now = Date.now();
    // Auto-expire mutes
    for (const u of this.users.values()) {
      if (u.status === 'muted' && u.mutedUntil && now > u.mutedUntil) {
        u.status = 'active';
        u.mutedUntil = undefined;
      }
      this.recalcRiskLevel(u);
    }
    return Array.from(this.users.values()).sort((a, b) => b.rating - a.rating);
  }

  public getUser(id: string): UserRecord | undefined {
    const user = this.users.get(id);
    if (user && user.status === 'muted' && user.mutedUntil && Date.now() > user.mutedUntil) {
      user.status = 'active';
      user.mutedUntil = undefined;
      this.recalcRiskLevel(user);
    }
    return user;
  }

  public getOrCreateUser(id: string, username: string, fullName: string, avatarUrl?: string): UserRecord {
    let user = this.getUser(id);
    if (!user) {
      user = {
        id,
        username: username || `user_${id}`,
        fullName: fullName || username || 'Участник',
        avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${id}`,
        rating: 0,
        totalMessages: 0,
        toxicMessages: 0,
        profanityMessages: 0,
        positiveMessages: 0,
        status: 'active',
        lastActivity: Date.now(),
        riskLevel: 'low',
        history: [],
      };
      this.users.set(id, user);
    } else {
      if (username) user.username = username;
      if (fullName) user.fullName = fullName;
      if (avatarUrl) user.avatarUrl = avatarUrl;
    }
    return user;
  }

  private recalcRiskLevel(user: UserRecord) {
    if (user.status === 'banned') {
      user.riskLevel = 'critical';
    } else if (user.status === 'muted' || user.rating <= this.settings.muteThreshold) {
      user.riskLevel = 'critical';
    } else if (user.rating < 0 || (user.toxicMessages > 0 && user.toxicMessages / Math.max(1, user.totalMessages) > 0.3)) {
      user.riskLevel = 'high';
    } else if (user.toxicMessages > 0) {
      user.riskLevel = 'medium';
    } else {
      user.riskLevel = 'low';
    }
  }

  public processIncomingMessage(
    userId: string,
    username: string,
    fullName: string,
    text: string,
    moderation: ModerationResult,
    avatarUrl?: string
  ): { message: ChatMessage; user: UserRecord; autoAction?: string } {
    const user = this.getOrCreateUser(userId, username, fullName, avatarUrl);
    const now = Date.now();
    user.lastActivity = now;

    // Check if user is currently muted
    if (user.status === 'muted' && user.mutedUntil && now < user.mutedUntil) {
      const remainingMinutes = Math.ceil((user.mutedUntil - now) / (60 * 1000));
      const blockedMsg: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          rating: user.rating,
          status: user.status,
          avatarUrl: user.avatarUrl,
        },
        text,
        timestamp: now,
        isDeleted: true,
        moderation: {
          ...moderation,
          action: 'delete',
          explanation: `Сообщение отклонено: пользователь находится во временном муте (осталось ${remainingMinutes} мин).`,
        },
        botReply: `🔇 @${user.username}, вы временно заблокированы в чате. До снятия ограничений: ${remainingMinutes} мин.`,
      };
      this.messages.push(blockedMsg);
      return { message: blockedMsg, user, autoAction: 'blocked_muted' };
    }

    if (user.status === 'banned') {
      const blockedMsg: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          rating: user.rating,
          status: user.status,
          avatarUrl: user.avatarUrl,
        },
        text,
        timestamp: now,
        isDeleted: true,
        moderation: {
          ...moderation,
          action: 'ban',
          explanation: 'Пользователь навсегда заблокирован за критические нарушения.',
        },
        botReply: `🚫 @${user.username} заблокирован навсегда за систематические грубые нарушения.`,
      };
      this.messages.push(blockedMsg);
      return { message: blockedMsg, user, autoAction: 'blocked_banned' };
    }

    // Apply cumulative rating change
    user.rating += moderation.score;
    user.totalMessages += 1;

    if (moderation.score < 0) {
      user.toxicMessages += 1;
    } else if (moderation.score > 0) {
      user.positiveMessages += 1;
    }

    if (moderation.profanityDetected) {
      user.profanityMessages += 1;
    }

    // Record history
    user.history.unshift({
      id: `h_${Date.now()}`,
      text,
      timestamp: now,
      score: moderation.score,
      sentiment: moderation.sentiment,
      profanity: moderation.profanityDetected,
      actionTaken: moderation.action,
    });
    if (user.history.length > 50) user.history.pop();

    let autoAction: string | undefined;
    let botReply: string | undefined;
    let shouldDelete = false;

    // Check auto-delete profanity
    if (this.settings.autoDeleteProfanity && moderation.profanityDetected) {
      shouldDelete = true;
    }

    // Auto-check cumulative rating triggers
    if (user.rating <= this.settings.banThreshold) {
      user.status = 'banned';
      autoAction = 'banned';
      shouldDelete = true;
      botReply = `🚫 Пользователь @${user.username} навсегда заблокирован в чате. Кумулятивный рейтинг упал до критической отметки (${user.rating} ≤ ${this.settings.banThreshold}).`;
    } else if (user.rating <= this.settings.muteThreshold) {
      user.status = 'muted';
      const durationMs = this.settings.muteDurationMinutes * 60 * 1000;
      user.mutedUntil = now + durationMs;
      autoAction = 'muted';
      shouldDelete = true;
      botReply = `🔇 Пользователь @${user.username} временно заблокирован на ${this.settings.muteDurationMinutes} мин! Накоплен высокий отрицательный рейтинг: ${user.rating} (порог мута: ${this.settings.muteThreshold}). Оценка сообщения: [${moderation.score > 0 ? '+' : ''}${moderation.score}/5]`;
    } else if (moderation.score <= -3) {
      user.status = 'warned';
      botReply = `⚠️ Предупреждение @${user.username}: оценка сообщения [${moderation.score}/5]. Причина: ${moderation.explanation}. Текущий рейтинг: ${user.rating}. При достижении ${this.settings.muteThreshold} включится авто-мут.`;
    }

    this.recalcRiskLevel(user);

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        rating: user.rating,
        status: user.status,
        avatarUrl: user.avatarUrl,
      },
      text,
      timestamp: now,
      moderation,
      isDeleted: shouldDelete,
      botReply,
    };

    this.messages.push(newMsg);
    if (this.messages.length > 100) this.messages.shift();

    return { message: newMsg, user, autoAction };
  }

  public getMessages(): ChatMessage[] {
    return this.messages;
  }

  public clearMessages(): void {
    this.messages = [];
  }

  public updateUserStatus(
    userId: string,
    status: 'active' | 'warned' | 'muted' | 'banned',
    durationMinutes?: number
  ): UserRecord | undefined {
    const user = this.users.get(userId);
    if (!user) return undefined;

    user.status = status;
    if (status === 'muted') {
      const mins = durationMinutes || this.settings.muteDurationMinutes;
      user.mutedUntil = Date.now() + mins * 60 * 1000;
    } else if (status === 'active') {
      user.mutedUntil = undefined;
    }
    this.recalcRiskLevel(user);
    return user;
  }

  public resetUserRating(userId: string, newRating: number = 0): UserRecord | undefined {
    const user = this.users.get(userId);
    if (!user) return undefined;
    user.rating = newRating;
    user.status = 'active';
    user.mutedUntil = undefined;
    this.recalcRiskLevel(user);
    return user;
  }

  public getStats(): ModerationStats {
    let totalMessages = this.messages.length;
    let totalViolations = 0;
    let profanityCount = 0;
    let sumRating = 0;
    let mutedUsersCount = 0;
    let bannedUsersCount = 0;

    const sentimentCounts: Record<ModerationResult['sentiment'], number> = {
      positive: 0,
      neutral: 0,
      negative: 0,
      aggressive: 0,
      constructive: 0,
    };

    for (const msg of this.messages) {
      if (msg.moderation) {
        if (msg.moderation.score < 0 || msg.moderation.profanityDetected) {
          totalViolations++;
        }
        if (msg.moderation.profanityDetected) {
          profanityCount++;
        }
        sentimentCounts[msg.moderation.sentiment] =
          (sentimentCounts[msg.moderation.sentiment] || 0) + 1;
      }
    }

    const allUsers = this.getAllUsers();
    for (const u of allUsers) {
      sumRating += u.rating;
      if (u.status === 'muted') mutedUsersCount++;
      if (u.status === 'banned') bannedUsersCount++;
    }

    return {
      totalMessages,
      totalViolations,
      profanityCount,
      averageRating: allUsers.length > 0 ? Math.round((sumRating / allUsers.length) * 10) / 10 : 0,
      mutedUsersCount,
      bannedUsersCount,
      totalUsersCount: allUsers.length,
      sentimentCounts,
    };
  }
}

export const store = new ChatModerationStore();
