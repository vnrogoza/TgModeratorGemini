import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { store } from "./server/store";
import { analyzeMessageWithGemini } from "./server/geminiModerator";
import { telegramService } from "./server/telegramBot";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });

  // Moderation text analyzer (for direct playground or manual test)
  app.post("/api/moderation/analyze", async (req, res) => {
    try {
      const { text, userSummary } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Параметр 'text' обязателен." });
      }
      const result = await analyzeMessageWithGemini(text, userSummary);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Chat message simulator: post message to chat and moderate
  app.post("/api/chat/send", async (req, res) => {
    try {
      const { userId, username, fullName, text, avatarUrl } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Параметр 'text' обязателен." });
      }

      const uid = userId || `user_${Date.now().toString().slice(-4)}`;
      const uName = username || `user_${uid}`;
      const fName = fullName || uName;

      const existingUser = store.getUser(uid);
      const userSummary = existingUser
        ? `Рейтинг: ${existingUser.rating}, нарушений: ${existingUser.toxicMessages}, статус: ${existingUser.status}`
        : undefined;

      // Analyze message with Gemini
      const moderation = await analyzeMessageWithGemini(text, userSummary);

      // Process and store
      const outcome = store.processIncomingMessage(
        uid,
        uName,
        fName,
        text,
        moderation,
        avatarUrl
      );

      res.json(outcome);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get messages
  app.get("/api/chat/messages", (req, res) => {
    res.json({ messages: store.getMessages() });
  });

  // Clear messages
  app.post("/api/chat/clear", (req, res) => {
    store.clearMessages();
    res.json({ success: true });
  });

  // Get users database
  app.get("/api/users", (req, res) => {
    res.json({ users: store.getAllUsers() });
  });

  // Get single user
  app.get("/api/users/:id", (req, res) => {
    const user = store.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }
    res.json({ user });
  });

  // Admin user action: mute, unmute, ban, reset_rating
  app.post("/api/users/:id/action", (req, res) => {
    const { action, durationMinutes, newRating } = req.body;
    const userId = req.params.id;

    if (action === "mute") {
      const updated = store.updateUserStatus(userId, "muted", durationMinutes);
      return res.json({ user: updated });
    } else if (action === "unmute") {
      const updated = store.updateUserStatus(userId, "active");
      return res.json({ user: updated });
    } else if (action === "ban") {
      const updated = store.updateUserStatus(userId, "banned");
      return res.json({ user: updated });
    } else if (action === "reset_rating") {
      const updated = store.resetUserRating(userId, newRating ?? 0);
      return res.json({ user: updated });
    }

    res.status(400).json({ error: "Неизвестное действие" });
  });

  // Stats
  app.get("/api/stats", (req, res) => {
    res.json({ stats: store.getStats() });
  });

  // Settings
  app.get("/api/settings", (req, res) => {
    res.json({ settings: store.getSettings() });
  });

  app.post("/api/settings", (req, res) => {
    const updated = store.updateSettings(req.body);
    res.json({ settings: updated });
  });

  // Telegram bot management
  app.get("/api/telegram/status", async (req, res) => {
    const token = telegramService.getToken();
    if (!token) {
      return res.json({
        connected: false,
        message: "Токен бота не настроен. Добавьте его в настройках или в TELEGRAM_BOT_TOKEN.",
      });
    }
    const result = await telegramService.initBot();
    const status = telegramService.getStatus();
    res.json({
      connected: result.success,
      botName: result.botName,
      isPolling: status.isPolling,
      lastUpdateId: status.lastUpdateId,
      error: result.error,
    });
  });

  app.post("/api/telegram/start-polling", async (req, res) => {
    await telegramService.startPolling();
    res.json({ success: true, message: "Long Polling запущен" });
  });

  app.post("/api/telegram/stop-polling", (req, res) => {
    telegramService.stopPolling();
    res.json({ success: true, message: "Long Polling остановлен" });
  });

  app.post("/api/telegram/set-token", async (req, res) => {
    const { token } = req.body;
    telegramService.setToken(token || "");
    const result = await telegramService.initBot();
    res.json(result);
  });

  app.post("/api/telegram/set-webhook", async (req, res) => {
    const { webhookUrl } = req.body;
    const result = await telegramService.setWebhook(webhookUrl);
    res.json(result);
  });

  app.get("/api/telegram/webhook-info", async (req, res) => {
    const info = await telegramService.getWebhookInfo();
    res.json(info);
  });

  // Telegram webhook endpoint
  app.post("/api/telegram/webhook", async (req, res) => {
    try {
      await telegramService.handleWebhookUpdate(req.body);
      res.json({ ok: true });
    } catch (e: any) {
      console.error("Webhook processing error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Telegram Chat Moderator Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
