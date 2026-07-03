// Безопасная обёртка: если приложение открыто НЕ в Telegram —
// все вызовы становятся no-op, ничего не падает.

const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;

export const isInTelegram = !!tg;

export function initTelegram() {
  if (!tg) return;
  tg.ready();
  tg.expand();
  try {
    tg.setHeaderColor('#0d0d1c');
    tg.setBackgroundColor('#0d0d1c');
  } catch {}
  try { tg.enableClosingConfirmation(); } catch {}
}

// Сырые initData — отправляются на бэкенд для HMAC-проверки подлинности.
// Никогда не доверяем данным из initDataUnsafe напрямую на сервере —
// они парсятся на клиенте и могут быть подделаны, потому initData (строка)
// проверяется на бэкенде через секрет бота.
export function getInitData() {
  return tg?.initData || null;
}

// initDataUnsafe можно использовать только для мгновенного отображения
// (имя/аватар в UI до ответа сервера) — не для авторизации.
export function getTelegramUserUnsafe() {
  const u = tg?.initDataUnsafe?.user;
  if (!u) return null;
  return {
    id: String(u.id),
    name: u.first_name + (u.last_name ? ' ' + u.last_name : ''),
    username: u.username || null,
    photoUrl: u.photo_url || null,
  };
}

export function getStartParam() {
  return tg?.initDataUnsafe?.start_param || null;
}

export const haptics = {
  light()    { try { tg?.HapticFeedback?.impactOccurred('light'); } catch {} },
  medium()   { try { tg?.HapticFeedback?.impactOccurred('medium'); } catch {} },
  rigid()    { try { tg?.HapticFeedback?.impactOccurred('rigid'); } catch {} },
  success()  { try { tg?.HapticFeedback?.notificationOccurred('success'); } catch {} },
  warning()  { try { tg?.HapticFeedback?.notificationOccurred('warning'); } catch {} },
};

export function tgShare(url, text) {
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  if (tg) tg.openTelegramLink(shareUrl);
  else window.open(shareUrl, '_blank', 'noopener');
}

export function tgOpenLink(url) {
  if (tg) tg.openLink(url);
  else window.open(url, '_blank', 'noopener');
}

export function tgBackButton(onClick) {
  if (!tg?.BackButton) return () => {};
  tg.BackButton.show();
  tg.BackButton.onClick(onClick);
  return () => { tg.BackButton.hide(); tg.BackButton.offClick(onClick); };
}

export function tgClose() { try { tg?.close(); } catch {} }
