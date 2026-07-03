import React from 'react';
import { C, SHADOW } from '../theme/tokens';
import { PrimaryBtn, SecondaryBtn } from '../components/UI';

const PLANS = [
  { id: 'free', emoji: '🌱', name: 'Бесплатно', month: 0, year: 0,
    features: ['3 опроса', '2 участника', '2 категории', '7 дней истории'] },
  { id: 'pair', emoji: '❤️', name: 'Пара', month: 249, year: 2490, badge: 'Популярный',
    features: ['Безлимит опросов', 'Все 6 категорий', 'Все интеграции', '6 месяцев истории'] },
  { id: 'group', emoji: '👥', name: 'Группа', month: 599, year: 5990,
    features: ['До 20 участников', 'Все категории', 'Все интеграции', 'История навсегда'] },
];

export default function Pricing({ billing, setBilling, navigate }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bgGradient, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 20px 6px' }}>
        <div onClick={() => navigate('profile')} style={{ fontSize: 20, color: C.textSecondary, cursor: 'pointer' }}>←</div>
        <div style={{ fontSize: 17, fontWeight: 600, color: C.textPrimary }}>Тарифы</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 20px 28px' }}>

        <div style={{ display: 'flex', background: C.chipInactiveBg, borderRadius: 999, padding: 4, marginBottom: 22 }}>
          {['month', 'year'].map(b => (
            <div key={b} onClick={() => setBilling(b)} style={{
              flex: 1, textAlign: 'center', padding: '9px', borderRadius: 999, cursor: 'pointer',
              background: billing === b ? C.accent : 'transparent',
              color: billing === b ? '#fff' : C.textSecondary, fontSize: 13, fontWeight: 600, position: 'relative',
            }}>
              {b === 'month' ? 'Месяц' : 'Год'}
              {b === 'year' && <span style={{ position: 'absolute', top: -9, right: 4, background: C.discuss, color: '#1a1200', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 8 }}>−40%</span>}
            </div>
          ))}
        </div>

        {PLANS.map(p => (
          <div key={p.id} style={{
            background: p.badge ? 'rgba(168,85,247,.08)' : C.card,
            border: `1.5px solid ${p.badge ? C.accentTo : C.borderSoft}`,
            borderRadius: 22, padding: 18, marginBottom: 14, position: 'relative',
          }}>
            {p.badge && <span style={{ position: 'absolute', top: -10, left: 18, background: C.accent, color: '#fff', fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 999 }}>{p.badge}</span>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{p.emoji}</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: C.textPrimary }}>{p.name}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.textPrimary }}>
                  {p.month === 0 ? 'Бесплатно' : `${billing === 'year' ? Math.round(p.year / 12) : p.month}₽`}
                </div>
                {p.month > 0 && <div style={{ fontSize: 11, color: C.textMuted }}>/мес</div>}
              </div>
            </div>
            {p.features.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ color: C.like, fontSize: 12 }}>✓</span>
                <span style={{ fontSize: 13, color: C.textSecondary }}>{f}</span>
              </div>
            ))}
            <div style={{ marginTop: 12 }}>
              {p.id === 'free'
                ? <SecondaryBtn onClick={() => navigate('profile')}>Текущий план</SecondaryBtn>
                : <PrimaryBtn onClick={() => navigate('profile')}>Выбрать</PrimaryBtn>}
            </div>
          </div>
        ))}

        <div style={{ fontSize: 11, color: C.textMuted, textAlign: 'center', lineHeight: 1.6, marginTop: 8 }}>
          Категория «Интим» доступна только в платных тарифах
        </div>
      </div>
    </div>
  );
}
