import React, { useState } from 'react';
import { C, CATEGORIES, SHADOW } from '../theme/tokens';
import { Chip, TabBar } from '../components/UI';
import { haptics } from '../hooks/useTelegram';

const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

export default function Home({ user, myPolls, pollsLoading, navigate, openPoll }) {
  const [cat, setCat] = useState(null);
  const initials = (user?.name || '??').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const filtered = cat ? myPolls.filter(p => p.category === cat) : myPolls;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bgGradient, overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px 0' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {user?.photoUrl ? (
              <img src={user.photoUrl} style={{ width: 44, height: 44, borderRadius: 16, objectFit: 'cover' }} alt="" />
            ) : (
              <div style={{ width: 44, height: 44, borderRadius: 16, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 600, color: '#fff' }}>{initials}</div>
            )}
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: C.textPrimary }}>Привет, {user?.name?.split(' ')[0] || '...'}</div>
              <div style={{ fontSize: 12, color: C.textSecondary }}>
                {pollsLoading ? 'Загрузка...' : `${myPolls.length} ${myPolls.length === 1 ? 'опрос' : 'опросов'}`}
              </div>
            </div>
          </div>
          <div onClick={() => { haptics.light(); navigate('profile'); }} style={{ width: 40, height: 40, borderRadius: 14, background: C.chipInactiveBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, cursor: 'pointer' }}>⚙️</div>
        </div>

        {/* Primary actions */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
          <div
            onClick={() => { haptics.light(); navigate('create'); }}
            style={{ flex: 1, padding: '14px 16px', borderRadius: 16, background: C.accent, boxShadow: SHADOW.primaryCTA, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', color: '#fff', fontWeight: 600, fontSize: 14 }}
          >＋ Создать</div>
          <div
            onClick={() => { haptics.light(); navigate('join'); }}
            style={{ flex: 1, padding: '14px 16px', borderRadius: 16, border: `1.5px solid ${C.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', color: C.textPrimary, fontWeight: 600, fontSize: 14 }}
          ># По коду</div>
        </div>

        {/* Categories filter */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 24, paddingBottom: 2 }}>
          <Chip label="Все" emoji="✨" active={!cat} onClick={() => setCat(null)} />
          {CATEGORIES.map(c => <Chip key={c.id} label={c.label} emoji={c.emoji} active={cat === c.id} onClick={() => setCat(c.id)} />)}
        </div>

        {/* Polls list */}
        <div style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, marginBottom: 12 }}>
          {cat ? 'Опросы в категории' : 'Активные опросы'}
        </div>

        {pollsLoading && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: C.textMuted, fontSize: 13 }}>Загрузка опросов...</div>
        )}

        {!pollsLoading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: C.textMuted, fontSize: 13, lineHeight: 1.6 }}>
            Пока нет опросов.<br />Создайте первый — займёт меньше минуты.
          </div>
        )}

        {filtered.map(poll => {
          const catInfo = CAT_MAP[poll.category] || { emoji: '📌', label: poll.category };
          const isDone = poll.status === 'completed' || poll.progress >= 100;
          return (
            <div
              key={poll._id}
              onClick={() => openPoll(poll._id)}
              style={{
                background: isDone ? 'rgba(74,222,128,.06)' : C.card,
                border: `1px solid ${isDone ? 'rgba(74,222,128,.2)' : C.cardBorder}`,
                borderRadius: 22, padding: 16, marginBottom: 12, cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: C.textPrimary, marginBottom: 3 }}>{poll.title}</div>
                  <div style={{ fontSize: 12, color: C.textSecondary }}>{poll.cardsCount} {poll.cardsCount === 1 ? 'вариант' : 'вариантов'} · {poll.participantsCount} {poll.participantsCount === 1 ? 'участник' : 'участников'}</div>
                </div>
                <span style={{ fontSize: 11, background: 'rgba(168,85,247,.15)', color: '#c4b5fd', padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>{catInfo.emoji} {catInfo.label}</span>
              </div>
              <div style={{ height: 5, background: 'rgba(255,255,255,.08)', borderRadius: 3, overflow: 'hidden', marginBottom: isDone ? 8 : 0 }}>
                <div style={{ height: '100%', width: `${poll.progress}%`, background: isDone ? C.like : C.accent, borderRadius: 3 }} />
              </div>
              {isDone && <div style={{ fontSize: 12, color: C.like, fontWeight: 500 }}>Готово · есть результаты 🎉</div>}
            </div>
          );
        })}

        <div style={{ height: 90 }} />
      </div>

      <TabBar active="home" onNav={navigate} />
    </div>
  );
}
