import React from 'react';
import { C, SHADOW } from '../theme/tokens';
import { SecondaryBtn, TabBar } from '../components/UI';

const ROWS = [
  { icon: '🔔', label: 'Уведомления' },
  { icon: '🌙', label: 'Тёмная тема' },
  { icon: '🔗', label: 'Мои интеграции' },
  { icon: '❓', label: 'Помощь' },
];

const PLAN_LABELS = { free: '🌱 Бесплатный план', pair: '❤️ Пара', group: '👥 Группа' };

export default function Profile({ user, logout, navigate }) {
  const initials = (user?.name || '??').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bgGradient, overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 20px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          {user?.photoUrl ? (
            <img src={user.photoUrl} style={{ width: 64, height: 64, borderRadius: 22, objectFit: 'cover' }} alt="" />
          ) : (
            <div style={{ width: 64, height: 64, borderRadius: 22, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 600, color: '#fff' }}>{initials}</div>
          )}
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: C.textPrimary }}>{user?.name || '...'}</div>
            {user?.telegramUsername && <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 4 }}>@{user.telegramUsername}</div>}
            <span style={{ fontSize: 11, background: C.chipInactiveBg, color: C.textSecondary, padding: '3px 10px', borderRadius: 999 }}>
              {PLAN_LABELS[user?.plan] || PLAN_LABELS.free}
            </span>
          </div>
        </div>

        {user?.plan === 'free' && (
          <div
            onClick={() => navigate('pricing')}
            style={{ background: C.accent, borderRadius: 22, padding: 18, marginBottom: 22, cursor: 'pointer', boxShadow: SHADOW.primaryCTA }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Откройте больше вместе ❤️</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.85)', marginBottom: 12 }}>Все категории, интеграции и безлимит опросов</div>
            <div style={{ display: 'inline-block', background: 'rgba(255,255,255,.2)', padding: '8px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#fff' }}>Смотреть тарифы</div>
          </div>
        )}

        <div style={{ background: C.card, border: `1px solid ${C.borderSoft}`, borderRadius: 20, overflow: 'hidden', marginBottom: 24 }}>
          {ROWS.map((r, i) => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: i < ROWS.length - 1 ? `1px solid ${C.borderSoft}` : 'none', cursor: 'pointer' }}>
              <span style={{ fontSize: 18 }}>{r.icon}</span>
              <span style={{ fontSize: 14, color: C.textPrimary, flex: 1 }}>{r.label}</span>
              <span style={{ fontSize: 14, color: C.textMuted }}>›</span>
            </div>
          ))}
        </div>

        <SecondaryBtn danger onClick={logout}>Выйти</SecondaryBtn>
      </div>
      <TabBar active="profile" onNav={navigate} />
    </div>
  );
}
