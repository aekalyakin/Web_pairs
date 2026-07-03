// Меняется в одном месте при переходе с тестового бота на боевой.
// Сейчас используется тестовый бот для проверки функциональности.
export const BOT_USERNAME = 'colibri13_test_bot';

export function buildMiniAppLink(startParam) {
  const base = `https://t.me/${BOT_USERNAME}/app`;
  return startParam ? `${base}?startapp=${startParam}` : base;
}
