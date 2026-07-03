import React from 'react';
import { C, RADIUS, SHADOW, FONT } from '../theme/tokens';

// ─── Primary CTA (gradient, elevated shadow) ──────────────────────
export const PrimaryBtn = ({ children, onClick, disabled, style = {} }) => (
  <button
    onClick={disabled ? undefined : onClick}
    style={{
      width: '100%', padding: '15px 20px', borderRadius: RADIUS.button,
      border: 'none', fontFamily: FONT.family,
      fontSize: 15, fontWeight: 600, color: '#fff',
      background: disabled ? 'rgba(124,58,237,.35)' : C.accent,
      boxShadow: disabled ? 'none' : SHADOW.primaryCTA,
      cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.6 : 1,
      transition: 'transform .12s, opacity .15s',
      ...style,
    }}
    onTouchStart={e => !disabled && (e.currentTarget.style.transform = 'scale(.97)')}
    onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
  >
    {children}
  </button>
);

// ─── Secondary / outline button ───────────────────────────────────
export const SecondaryBtn = ({ children, onClick, style = {}, danger }) => (
  <button
    onClick={onClick}
    style={{
      width: '100%', padding: '14px 20px', borderRadius: RADIUS.button,
      border: `1.5px solid ${danger ? 'rgba(248,113,113,.4)' : C.cardBorder}`,
      background: 'transparent', fontFamily: FONT.family,
      fontSize: 15, fontWeight: 600,
      color: danger ? C.no : C.textPrimary,
      cursor: 'pointer',
      ...style,
    }}
  >
    {children}
  </button>
);

// ─── Category chip ─────────────────────────────────────────────────
export const Chip = ({ label, emoji, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
      padding: '9px 16px', borderRadius: RADIUS.pill,
      border: active ? 'none' : `1px solid ${C.borderSoft}`,
      background: active ? C.accent : C.chipInactiveBg,
      color: active ? '#fff' : C.chipInactiveText,
      fontFamily: FONT.family, fontSize: 13, fontWeight: 500,
      cursor: 'pointer', whiteSpace: 'nowrap',
      transition: 'all .15s',
    }}
  >
    <span>{emoji}</span><span>{label}</span>
  </button>
);

// ─── Progress dots (onboarding) ────────────────────────────────────
export const ProgressDots = ({ count, active }) => (
  <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} style={{
        height: 6, width: i === active ? 20 : 6, borderRadius: RADIUS.pill,
        background: i === active ? C.accent : 'rgba(255,255,255,.15)',
        transition: 'width .25s ease, background .25s ease',
      }} />
    ))}
  </div>
);

// ─── Vote progress dots (voting screen, 5 cards) ───────────────────
export const VoteDots = ({ total, current }) => (
  <div style={{ display: 'flex', gap: 5, justifyContent: 'center', padding: '0 20px' }}>
    {Array.from({ length: total }).map((_, i) => (
      <div key={i} style={{
        flex: 1, maxWidth: i === current ? 32 : 22, height: 4, borderRadius: 2,
        background: i < current ? 'rgba(168,85,247,.5)' : i === current ? C.accentTo : 'rgba(255,255,255,.1)',
        transition: 'all .2s',
      }} />
    ))}
  </div>
);

// ─── Bottom tab bar ─────────────────────────────────────────────────
export const TabBar = ({ active, onNav }) => (
  <div style={{
    display: 'flex', alignItems: 'center',
    background: C.surface, borderTop: `1px solid ${C.borderSoft}`,
    paddingTop: 8, paddingBottom: 'calc(10px + env(safe-area-inset-bottom,0px))',
    flexShrink: 0, position: 'relative',
  }}>
    {[
      { id: 'home', icon: '🏠', label: 'Главная' },
      { id: 'create-fab', icon: '＋', label: '', fab: true },
      { id: 'profile', icon: '👤', label: 'Профиль' },
    ].map(item => item.fab ? (
      <div key="fab" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <div
          onClick={() => onNav('create')}
          style={{
            width: 52, height: 52, borderRadius: 26, background: C.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, color: '#fff', cursor: 'pointer',
            boxShadow: SHADOW.primaryCTA, marginTop: -26,
            border: `4px solid ${C.surface}`,
          }}
        >＋</div>
      </div>
    ) : (
      <div
        key={item.id}
        onClick={() => onNav(item.id)}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', opacity: active === item.id ? 1 : .4 }}
      >
        <span style={{ fontSize: 20 }}>{item.icon}</span>
        <span style={{ fontSize: 10, color: active === item.id ? '#c4b5fd' : C.textMuted }}>{item.label}</span>
      </div>
    ))}
  </div>
);

// ─── Segmented result bar (like/discuss/nope proportions) ─────────
export const SegmentedBar = ({ like, discuss, nope }) => {
  const total = like + discuss + nope || 1;
  return (
    <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex', background: 'rgba(255,255,255,.06)' }}>
      {like > 0    && <div style={{ width: `${(like/total)*100}%`,    background: C.like }} />}
      {discuss > 0 && <div style={{ width: `${(discuss/total)*100}%`, background: C.discuss }} />}
      {nope > 0    && <div style={{ width: `${(nope/total)*100}%`,    background: C.no }} />}
    </div>
  );
};

// ─── Input field ────────────────────────────────────────────────────
export const Field = ({ label, value, onChange, placeholder, type = 'text' }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <div style={{ fontSize: 11, color: C.textMuted, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 7, fontWeight: 500 }}>{label}</div>}
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{
        width: '100%', padding: '14px 16px', borderRadius: RADIUS.buttonSm, fontSize: 16,
        background: 'rgba(255,255,255,.05)', border: `1px solid ${C.borderSoft}`,
        color: C.textPrimary, outline: 'none', boxSizing: 'border-box', fontFamily: FONT.family,
      }}
    />
  </div>
);

export const ScreenTitle = ({ children }) => (
  <div style={{ ...FONT.screenTitle, color: C.textPrimary }}>{children}</div>
);
