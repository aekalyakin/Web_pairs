// ═══════════════════════════════════════════════════════════════
// Design Tokens — "Neon Aurora"
// Источник: Pair Decisions Prototype README (approved, high-fidelity)
// ═══════════════════════════════════════════════════════════════

export const C = {
  // Backgrounds
  bgBase: '#0d0d1c',
  bgGradient: 'radial-gradient(130% 80% at 50% -10%, #231a4a 0%, #0d0d1c 55%)',
  surface: '#13131f',
  card: '#1a1a2e',
  cardBorder: 'rgba(168,85,247,.2)',
  cardBorderStrong: 'rgba(168,85,247,.3)',

  // Accent gradient (primary actions, active states, progress)
  accentFrom: '#7c3aed',
  accentTo: '#a855f7',
  accent: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
  accentSolid: '#7c3aed',

  // Semantic
  like: '#4ade80',
  likeBg: 'rgba(74,222,128,.12)',
  no: '#f87171',
  noBg: 'rgba(248,113,113,.12)',
  discuss: '#fbbf24',
  discussBg: 'rgba(251,191,36,.12)',

  // Text
  textPrimary: '#ECECF5',
  textSecondary: '#8b8ba7',
  textMuted: '#6b6b85',

  // Chips
  chipInactiveBg: 'rgba(255,255,255,.07)',
  chipInactiveText: '#8b8ba7',

  // Telegram brand (auth button)
  tgFrom: '#37aee2',
  tgTo: '#1e96c8',

  white100: '#ffffff',
  border: 'rgba(255,255,255,.1)',
  borderSoft: 'rgba(255,255,255,.07)',
};

export const RADIUS = {
  card: 24,
  cardSm: 22,
  button: 16,
  buttonSm: 14,
  pill: 999,
  iconBtn: 13,
  iconBtnSm: 12,
};

export const SHADOW = {
  primaryCTA: '0 12px 28px rgba(124,58,237,.4)',
  cardStack: '0 24px 48px rgba(0,0,0,.55)',
  cardStackSoft: '0 22px 44px rgba(0,0,0,.5)',
  likeButton: '0 12px 26px rgba(74,222,128,.35)',
};

export const SPACE = {
  screenX: 20,       // 18-24px horizontal padding
  sectionGap: 18,     // 12-22px
  tabBarHeight: 64,
};

export const FONT = {
  family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  screenTitle: { fontSize: 20, fontWeight: 600 },
  cardTitle:   { fontSize: 19, fontWeight: 600 },
  body:        { fontSize: 13, fontWeight: 400 },
  bodyMedium:  { fontSize: 13, fontWeight: 500 },
  small:       { fontSize: 12, fontWeight: 400 }, // never smaller than this
};

export const CATEGORIES = [
  { id: 'dosug',   label: 'Досуг',       emoji: '🎬' },
  { id: 'byt',     label: 'Быт',         emoji: '🏠' },
  { id: 'intim',   label: 'Интим',       emoji: '❤️' },
  { id: 'finance', label: 'Финансы',     emoji: '💰' },
  { id: 'travel',  label: 'Путешествия', emoji: '🗺️' },
  { id: 'career',  label: 'Карьера',     emoji: '💼' },
];

// Swipe thresholds (px) — из спецификации
export const SWIPE = {
  horizontal: 88,   // like/nope
  vertical: 88,     // discuss (up)
  flyDistanceX: 520,
  flyDistanceY: 680,
  commitDuration: 270, // ms
  springBack: 'transform .3s cubic-bezier(.2,.8,.3,1)',
  rotateDivisor: 18, // rotate = dx / 18deg
};
