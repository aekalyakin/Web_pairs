import React from 'react';
import { C, FONT } from '../theme/tokens';
import { PrimaryBtn, ProgressDots } from '../components/UI';

const SLIDES = [
  {
    tile: '🤝', tileBg: C.accent,
    title: 'Pair Decisions',
    tagline: 'Договаривайтесь вместе',
    body: 'Решайте вопросы вдвоём или компанией — без долгих споров и уговоров.',
  },
  {
    tile: null, // gesture pills illustration
    title: 'Три голоса, а не один',
    body: 'Свайп вправо — да, влево — нет. А если не уверены — свайп вверх: «Обсудим вместе». Это честнее, чем выбирать между да и нет.',
  },
  {
    tile: '🎉', tileBg: 'linear-gradient(135deg,#22c55e,#4ade80)',
    title: 'Момент мэтча',
    body: 'Голоса скрыты, пока не проголосуют все. Когда мнения совпадают — момент открытия становится маленьким праздником.',
  },
];

export default function Onboarding({ onboardIdx, setOnboardIdx, navigate }) {
  const slide = SLIDES[onboardIdx];
  const isLast = onboardIdx === SLIDES.length - 1;

  const next = () => isLast ? navigate('auth') : setOnboardIdx(onboardIdx + 1);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bgGradient, padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div onClick={() => navigate('auth')} style={{ fontSize: 13, color: C.textSecondary, cursor: 'pointer', padding: '6px 4px' }}>Пропустить</div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        {slide.tile ? (
          <div style={{
            width: 96, height: 96, borderRadius: 44, background: slide.tileBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 44, marginBottom: 32, boxShadow: '0 16px 32px rgba(124,58,237,.3)',
          }}>{slide.tile}</div>
        ) : (
          <div style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
            {[['✕', 'Нет', C.no, C.noBg], ['♥', 'Да', C.like, C.likeBg], ['💬', 'Обсудим', C.discuss, C.discussBg]].map(([icon, label, color, bg]) => (
              <div key={label} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                padding: '14px 16px', borderRadius: 18, background: bg, border: `1px solid ${color}33`,
              }}>
                <span style={{ fontSize: 20, color }}>{icon}</span>
                <span style={{ fontSize: 11, color, fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ fontSize: 24, fontWeight: 700, color: C.textPrimary, marginBottom: 12, lineHeight: 1.3 }}>{slide.title}</div>
        {slide.tagline && <div style={{ fontSize: 15, color: '#c4b5fd', fontWeight: 500, marginBottom: 16 }}>{slide.tagline}</div>}
        <div style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.6, maxWidth: 280 }}>{slide.body}</div>
      </div>

      <div style={{ marginBottom: 24 }}><ProgressDots count={SLIDES.length} active={onboardIdx} /></div>
      <PrimaryBtn onClick={next}>{isLast ? 'Начать' : 'Далее'}</PrimaryBtn>
    </div>
  );
}
