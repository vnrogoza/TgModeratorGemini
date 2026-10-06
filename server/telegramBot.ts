import { store } from './store';
import { analyzeMessageWithGemini } from './geminiModerator';

export class TelegramService {
  private token: string = process.env.TELEGRAM_BOT_TOKEN || '';
  private botInfo: { id: number; username: string; first_name: string } | null = null;
  private isPolling: boolean = false;
  private pollingTimeout: NodeJS.Timeout | null = null;
  private lastUpdateId: number = 0;

  constructor() {
    if (this.token) {
      this.initBot().then((res) => {
        if (res.success) {
          this.startPolling();
        }
      });
    }
  }

  public setToken(newToken: string) {
    this.token = newToken.trim();
    if (this.token) {
      this.initBot().then((res) => {
        if (res.success) {
          this.startPolling();
        }
      });
    } else {
      this.stopPolling();
      this.botInfo = null;
      store.updateSettings({ realTelegramConnected: false, telegramBotUsername: undefined });
    }
  }

  public getToken(): string {
    return this.token;
  }

  public getStatus() {
    return {
      connected: !!this.botInfo,
      botName: this.botInfo?.username,
      isPolling: this.isPolling,
      lastUpdateId: this.lastUpdateId,
    };
  }

  public async initBot(): Promise<{ success: boolean; botName?: string; error?: string }> {
    if (!this.token) {
      return { success: false, error: 'Токен Telegram бота не задан.' };
    }

    try {
      const res = await fetch(`https://api.telegram.org/bot${this.token}/getMe`);
      const data = await res.json();
      if (data.ok) {
        this.botInfo = data.result;
        store.updateSettings({
          realTelegramConnected: true,
          telegramBotUsername: data.result.username,
        });
        return { success: true, botName: data.result.username };
      } else {
        return { success: false, error: data.description || 'Неверный токен бота' };
      }
    } catch (e: any) {
      return { success: false, error: e.message || 'Ошибка подключения к Telegram API' };
    }
  }

  public async deleteWebhook(): Promise<{ success: boolean; description?: string }> {
    if (!this.token) return { success: false, description: 'Токен не настроен' };
    try {
      const res = await fetch(`https://api.telegram.org/bot${this.token}/deleteWebhook?drop_pending_updates=false`);
      const data = await res.json();
      return { success: data.ok, description: data.description };
    } catch (e: any) {
      return { success: false, description: e.message };
    }
  }

  public async startPolling() {
    if (this.isPolling) return;
    if (!this.token) {
      console.log('[Telegram Polling] Cannot start: Token is not configured');
      return;
    }

    console.log('[Telegram Polling] Deleting any webhook to enable getUpdates Long Polling...');
    await this.deleteWebhook();

    this.isPolling = true;
    console.log('[Telegram Polling] Long Polling started successfully!');
    this.pollLoop();
  }

  public stopPolling() {
    this.isPolling = false;
    if (this.pollingTimeout) {
      clearTimeout(this.pollingTimeout);
      this.pollingTimeout = null;
    }
    console.log('[Telegram Polling] Polling stopped.');
  }

  private async pollLoop() {
    if (!this.isPolling || !this.token) return;

    try {
      const url = `https://api.telegram.org/bot${this.token}/getUpdates?offset=${this.lastUpdateId + 1}&limit=20&timeout=4`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          if (update.update_id > this.lastUpdateId) {
            this.lastUpdateId = update.update_id;
          }
          await this.handleWebhookUpdate(update);
        }
      } else if (!data.ok) {
        console.warn('[Telegram Polling] getUpdates returned error:', data.description);
      }
    } catch (err: any) {
      console.warn('[Telegram Polling] Loop exception:', err.message);
    }

    if (this.isPolling) {
      this.pollingTimeout = setTimeout(() => this.pollLoop(), 1000);
    }
  }

  public async getWebhookInfo(): Promise<any> {
    if (!this.token) return { ok: false, error: 'Токен не настроен' };
    try {
      const res = await fetch(`https://api.telegram.org/bot${this.token}/getWebhookInfo`);
      return await res.json();
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  }

  public async setWebhook(webhookUrl: string): Promise<{ success: boolean; description?: string }> {
    if (!this.token) return { success: false, description: 'Токен не настроен' };
    try {
      const res = await fetch(`https://api.telegram.org/bot${this.token}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl }),
      });
      const data = await res.json();
      return { success: data.ok, description: data.description };
    } catch (err: any) {
      return { success: false, description: err.message };
    }
  }

  public async sendMessage(chatId: number | string, text: string, replyToMessageId?: number) {
    if (!this.token) return;
    try {
      await fetch(`https://api.telegram.org/bot${this.token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          reply_to_message_id: replyToMessageId,
          parse_mode: 'HTML',
        }),
      });
    } catch (err) {
      console.error('Failed to send Telegram message:', err);
    }
  }

  public async deleteMessage(chatId: number | string, messageId: number) {
    if (!this.token) return;
    try {
      await fetch(`https://api.telegram.org/bot${this.token}/deleteMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, message_id: messageId }),
      });
    } catch (err) {
      console.error('Failed to delete Telegram message:', err);
    }
  }

  public async restrictMember(chatId: number | string, userId: number | string, untilDateUnix: number) {
    if (!this.token) return;
    try {
      await fetch(`https://api.telegram.org/bot${this.token}/restrictChatMember`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          user_id: userId,
          until_date: untilDateUnix,
          permissions: {
            can_send_messages: false,
            can_send_audios: false,
            can_send_documents: false,
            can_send_photos: false,
            can_send_videos: false,
            can_send_video_notes: false,
            can_send_voice_notes: false,
            can_send_polls: false,
            can_send_other_messages: false,
            can_add_web_page_previews: false,
            can_change_info: false,
            can_invite_users: false,
            can_pin_messages: false,
          },
        }),
      });
    } catch (err) {
      console.error('Failed to restrict Telegram chat member:', err);
    }
  }

  public async handleWebhookUpdate(update: any) {
    console.log('[Telegram Webhook] Received update ID:', update?.update_id);
    const msg = update?.message || update?.edited_message || update?.channel_post;
    if (!msg) {
      console.log('[Telegram Webhook] No message in update keys:', Object.keys(update || {}));
      return;
    }

    const text = (msg.text || msg.caption || '').trim();
    if (!text) {
      console.log('[Telegram Webhook] Message has no text or caption');
      return;
    }

    const chatId = msg.chat?.id;
    const messageId = msg.message_id;
    const from = msg.from;
    if (!from) {
      console.log('[Telegram Webhook] Message has no sender (from)');
      return;
    }

    const userId = String(from.id);
    const username = from.username || from.first_name || `user_${userId}`;
    const fullName = [from.first_name, from.last_name].filter(Boolean).join(' ') || username;
    const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`;

    console.log(`[Telegram Webhook] Processing message from @${username} (${fullName}) in chat ${chatId}: "${text}"`);

    // Handle bot commands
    if (text.startsWith('/')) {
      const command = text.split(' ')[0].toLowerCase().split('@')[0];
      if (command === '/start' || command === '/help') {
        const helpText = `<b>🤖 Робот-модератор чата</b>
Я анализирую каждое сообщение в чате с помощью ИИ:
• Оценка качества сообщений от -5 до +5
• Фильтрация мата и оскорблений
• Определение эмоциональной тональности
• Подсчет персональной кармы участников
• Автоматический временный мут при накоплении отрицательного рейтинга (порог: ${store.getSettings().muteThreshold})

Команды:
/rating - проверить свой рейтинг
/stats - статистика модерации чата
/rules - правила чата`;
        await this.sendMessage(chatId, helpText, messageId);
        return;
      }

      if (command === '/rating' || command === '/karma') {
        const u = store.getUser(userId);
        const rating = u ? u.rating : 0;
        const status = u ? u.status : 'active';
        const ratingText = `👤 <b>Рейтинг @${username}</b>: ${rating > 0 ? '+' : ''}${rating}
📊 Всего сообщений: ${u ? u.totalMessages : 0}
Статус: ${status === 'muted' ? '🔇 Заблокирован' : status === 'banned' ? '🚫 Бан' : '✅ Активен'}`;
        await this.sendMessage(chatId, ratingText, messageId);
        return;
      }

      if (command === '/stats') {
        const stats = store.getStats();
        const statsMsg = `📊 <b>Статистика модерации чата</b>
• Проанализировано сообщений: ${stats.totalMessages}
• Нарушений пресечено: ${stats.totalViolations}
• Ненормативной лексики: ${stats.profanityCount}
• Пользователей в муте: ${stats.mutedUsersCount}
• Средний рейтинг участников: ${stats.averageRating}`;
        await this.sendMessage(chatId, statsMsg, messageId);
        return;
      }
    }

    // Call Gemini Moderation
    const userSummary = store.getUser(userId)
      ? `Текущий рейтинг: ${store.getUser(userId)!.rating}, нарушений: ${store.getUser(userId)!.toxicMessages}`
      : undefined;

    const modResult = await analyzeMessageWithGemini(text, userSummary);
    const result = store.processIncomingMessage(userId, username, fullName, text, modResult, avatarUrl);

    console.log(`[Telegram Webhook] Moderated message: ${modResult.score}/5, user rating: ${result.user.rating}`);

    const scoreSign = modResult.score > 0 ? '+' : '';
    const scoreEmoji =
      modResult.score >= 3
        ? '🌟'
        : modResult.score > 0
        ? '👍'
        : modResult.score === 0
        ? '💬'
        : modResult.score >= -2
        ? '⚠️'
        : '🚨';

    // Form score notification badge under message
    const scoreBadge = `${scoreEmoji} <b>[${scoreSign}${modResult.score}/5]</b> ${modResult.explanation} | Карма: ${result.user.rating}`;

    // If auto-delete profanity
    if (store.getSettings().autoDeleteProfanity && modResult.profanityDetected) {
      await this.deleteMessage(chatId, messageId);
    }

    // If auto-muted
    if (result.autoAction === 'muted') {
      const untilUnix = Math.floor(Date.now() / 1000) + store.getSettings().muteDurationMinutes * 60;
      await this.restrictMember(chatId, from.id, untilUnix);
      await this.sendMessage(
        chatId,
        `🔇 <b>Пользователь @${username} временно заблокирован на ${store.getSettings().muteDurationMinutes} мин!</b>\nПричина: Высокий отрицательный рейтинг (${result.user.rating}).\nОценка: [${scoreSign}${modResult.score}/5] ${modResult.explanation}`
      );
    } else if (result.message.botReply) {
      // Send bot moderation reply
      await this.sendMessage(chatId, result.message.botReply, messageId);
    } else if (store.getSettings().showRatingBadgeUnderAll || modResult.score <= -1 || modResult.score >= 4) {
      // Send reaction/score badge under message
      await this.sendMessage(chatId, scoreBadge, messageId);
    }
  }
}

export const telegramService = new TelegramService();
