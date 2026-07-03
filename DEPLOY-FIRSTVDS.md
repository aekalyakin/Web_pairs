# Деплой Pair Decisions (Neon Aurora) на FirstVDS

## Локальная разработка

```bash
cd pair-decisions-neon
npm install
npm run dev        # http://localhost:3000 — для проверки на компьютере
```

Для теста на телефоне в локальной сети: `npm run dev -- --host`, затем открой
`http://IP-компьютера:3000` с телефона (тот же Wi-Fi).

---

## Настройка сервера FirstVDS (один раз)

Подключись по SSH (данные — в письме от FirstVDS, либо через встроенный веб-терминал в панели управления):

```bash
apt update && apt install -y nginx certbot python3-certbot-nginx
mkdir -p /var/www/pair-decisions
chown -R www-data:www-data /var/www/pair-decisions
```

### Конфиг nginx

Создай файл `/etc/nginx/sites-available/pair-decisions`:

```nginx
server {
    listen 80;
    server_name ваш-домен.ru www.ваш-домен.ru;

    root /var/www/pair-decisions;
    index index.html;

    # SPA-роутинг — все пути отдают index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
}
```

Активируй конфиг:

```bash
ln -s /etc/nginx/sites-available/pair-decisions /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### HTTPS (обязательно для Face ID / WebAuthn / Telegram Mini App)

```bash
certbot --nginx -d ваш-домен.ru -d www.ваш-домен.ru
```

Сертификат Let's Encrypt бесплатный, автопродление уже настроено `certbot`.

---

## Синхронизация через WinSCP

1. **Подключение к серверу:**
   - Протокол: SFTP
   - Хост, логин, пароль/ключ — из письма FirstVDS
   - Порт обычно 22

2. **Настроить автосинхронизацию:**
   - В WinSCP: `Commands → Keep Remote Directory up to Date` (или `Ctrl+U`)
   - Локальная папка: `pair-decisions-neon\dist`
   - Удалённая папка: `/var/www/pair-decisions`
   - Отметь галочку **"Synchronize automatically"** — WinSCP будет следить за изменениями в `dist/` и сразу заливать их

3. **Локально держи открытым watch-режим сборки:**
   ```bash
   npm run build:watch
   ```
   Vite будет пересобирать `dist/` при каждом сохранении файла кода → WinSCP тут же увидит изменения и зальёт на сервер.

**Итоговый цикл правки:** меняешь код → Vite пересобрал (~1-2 сек) → WinSCP залил (~5-10 сек) → обновляешь страницу на сервере. Никакого GitHub в цепочке.

---

## Проверка после деплоя

```bash
curl -I https://ваш-домен.ru
# Ожидаем: HTTP/2 200
```

Открой сайт на телефоне → должна загрузиться **Onboarding** (3 слайда) → Auth → Home.

---

## Подключение к Telegram (когда домен готов)

1. Открой `@BotFather` → `/newapp` → выбери бота
2. URL: `https://ваш-домен.ru`
3. Mini App станет доступен по `t.me/ИмяБота/app`

Внутри Telegram авторизация происходит автоматически (см. `useTelegram.js` —
`getTelegramUser()`), экран Auth пропускается.

---

## Структура проекта

```
pair-decisions-neon/
├── index.html              ← Telegram SDK, safe-area, PWA-меты
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx
    ├── App.jsx              ← стейт-машина экранов
    ├── theme/tokens.js       ← ВСЕ значения дизайна (цвета/тени/отступы/пороги свайпа)
    ├── hooks/
    │   ├── useApp.js         ← навигация, данные опроса, голоса
    │   └── useTelegram.js    ← safe no-op обёртка над TG SDK
    ├── components/
    │   ├── UI.jsx            ← Button/Chip/TabBar/SegmentedBar/ProgressDots
    │   └── Confetti.jsx       ← анимация конфетти для мэтча
    └── screens/
        ├── Onboarding.jsx     ← 3 слайда
        ├── Auth.jsx           ← TG-кнопка + телефон fallback
        ├── Home.jsx
        ├── CreatePoll.jsx     ← визард 3 шага + код приглашения
        ├── Voting.jsx         ← drag, повороты, штампы, пороги 88px
        ├── MatchOverlay.jsx   ← конфетти + pop-in анимация
        ├── Results.jsx        ← сегментированная шкала лайк/обсудим/нет
        ├── Profile.jsx
        └── Pricing.jsx        ← 3 тарифа, переключатель мес/год
```

---

## Что дальше (не реализовано в этой версии — MVP-заглушки)

- Реальный бэкенд для опросов (сейчас демо-данные в `useApp.js` — `DEMO_CARDS`)
- Анонимность голосов до полного голосования всех участников (описана в спецификации, требует бэкенда)
- Полноценный undo с откатом состояния голосования
- Замена emoji-плейсхолдеров на реальные фото + логотипы сервисов (2ГИС, Я.Карты, Ozon, Wildberries, Кинопоиск)
