# Руководство по запуску Telegram AI Модератора

Этот проект состоит из двух взаимосвязанных частей:
1. **Full-Stack Node.js/Express сервер + Gemini 3.8 AI**: обрабатывает сообщения, выставляет оценки от -5 до +5, следит за кармой, мутит нарушителей и слушает Telegram Webhook.
2. **React + Tailwind веб-панель администратора**: интерактивный симулятор чата, база пользователей, карма, статистика и аналитика в реальном времени.

---

## Вариант 1. Запуск прямо сейчас в AI Studio (Облачная среда)

Проект **уже запущен и готов к работе**:
- **Адрес панели:** откройте вкладку браузера с текущим превью.
- Во вкладке **«Чат & Симулятор»** вы можете:
  - Писать любые фразы в поле ввода внизу и нажимать `Enter` (или кликать по кнопкам быстрого теста: *Мат и токсичность*, *Оскорбление*, *Вопрос*, *Конструктив*).
  - Переключать участников (*Вы*, *Дмитрий-Тролль*, *Алексей-Эксперт*, *Анна-Позитив*).
  - Наблюдать, как бот выставляет оценки под каждым сообщением, перечеркивает удаленный мат и применяет автоматический мут при падении кармы ниже -10.

---

## Вариант 2. Запуск на собственном сервере (VPS / VDS / Ubuntu / Debian)

### 1. Требования
- Node.js версии 20 или выше (`node -v`)
- npm (`npm -v`)
- Токен бота из Telegram [@BotFather](https://t.me/BotFather)
- Ключ Google Gemini API (`GEMINI_API_KEY`) из [Google AI Studio](https://aistudio.google.com/)

### 2. Клонирование и установка зависимостей
```bash
# Перейдите в папку проекта
cd telegram-ai-moderator

# Установите зависимости
npm install
```

### 3. Настройка переменных окружения (.env)
Создайте файл `.env`:
```env
PORT=3000
NODE_ENV=production
GEMINI_API_KEY=ваш_ключ_gemini
TELEGRAM_BOT_TOKEN=ваш_токен_из_BotFather
```

### 4. Сборка и запуск
```bash
# Сборка веб-интерфейса и сервера
npm run build

# Запуск в фоновом режиме (через pm2 или напрямую)
npm start
```
Для непрерывной работы в фоне рекомендуется использовать `pm2`:
```bash
npm install -g pm2
pm2 start dist/server.cjs --name "tg-ai-moderator"
pm2 save
pm2 startup
```

---

## Вариант 3. Запуск через Docker

Создайте `Dockerfile`:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Сборка и запуск контейнера:
```bash
docker build -t tg-ai-moderator .
docker run -d -p 3000:3000 \
  -e GEMINI_API_KEY="ваш_ключ" \
  -e TELEGRAM_BOT_TOKEN="ваш_токен" \
  --name telegram-bot tg-ai-moderator
```

---

## Настройка Telegram Webhook

После того как ваш сервер запущен и доступен по домену с HTTPS (например, `https://your-domain.com`):
1. Откройте в браузере:
```text
https://api.telegram.org/bot<ВАШ_ТОКЕН>/setWebhook?url=https://your-domain.com/api/telegram/webhook
```
2. Telegram ответит:
```json
{"ok": true, "result": true, "description": "Webhook was set"}
```
3. Добавьте вашего бота в Telegram-группу и назначьте его **Администратором** с правами:
   - *Удаление сообщений*
   - *Блокировка пользователей*
