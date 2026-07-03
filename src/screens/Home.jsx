import React, { useState, useRef, useCallback } from 'react';
import { C, CATEGORIES, SHADOW } from '../theme/tokens';
import { Chip, TabBar } from '../components/UI';
import { haptics, tgShare } from '../hooks/useTelegram';
import { buildMiniAppLink } from '../config';

const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));
const ACTION_W = 60; // ширина одной кнопки действия

function formatRemaining(votingEndsAt) {
  if (!votingEndsAt) return null;
  const ms = new Date(votingEndsAt).getTime() - Date.now();
  if (ms <= 0) return null;
  const totalMin = Math.ceil(ms / 60000);
  if (totalMin >= 60) {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return m > 0 ? `${h} ч ${m} мин` : `${h} ч`;
  }
  return `${totalMin} мин`;
}

// Свайп-строка опроса. Драг двигает DOM напрямую через ref (без re-render на
// каждый пиксель — та же техника, что и в Voting.jsx), React-state дёргается
// только один раз в конце жеста, чтобы зафиксировать открыто/закрыто.
function PollRow({ poll, isOrganizer, canEdit, onOpen, onEdit, onDelete, onShare }) {
  const contentRef = useRef(null);
  const dragRef = useRef({ startX: 0, current: 0, active: false, openBase: 0 });
  const rafRef = useRef(null);
  const [open, setOpen] = useState(false);

  const actions = [
    canEdit && { key: 'edit', icon: '✏️', bg: '#4c1d95', label: 'Изменить', onClick: onEdit },
    isOrganizer && { key: 'delete', icon: '🗑️', bg: '#7f1d1d', label: 'Удалить', onClick: onDelete },
    { key: 'share', icon: '📤', bg: '#1e3a5f', label: 'Отправить', onClick: onShare },
  ].filter(Boolean);
  const actionsWidth = actions.length * ACTION_W;

  const applyTransform = (x) => {
    if (contentRef.current) contentRef.current.style.transform = `translateX(${x}px)`;
  };

  const clamp = (x) => Math.max(-actionsWidth, Math.min(0, x));

  const onDown = (e) => {
    dragRef.current = {
      startX: e.clientX ?? e.touches?.[0]?.clientX ?? 0,
      current: open ? -actionsWidth : 0,
      active: true,
      openBase: open ? -actionsWidth : 0,
    };
    if (contentRef.current) contentRef.current.style.transition = 'none';
  };

  const onMove = (e) => {
    if (!dragRef.current.active) return;
    const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const delta = x - dragRef.current.startX;
    dragRef.current.current = clamp(dragRef.current.openBase + delta);
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(() => {
        applyTransform(dragRef.current.current);
        rafRef.current = null;
      });
    }
  };

  const onUp = () => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    if (rafRef.current != null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }

    const shouldOpen = dragRef.current.current < -actionsWidth / 2;
    setOpen(shouldOpen);
    if (contentRef.current) {
      contentRef.current.style.transition = 'transform .2s ease-out';
      contentRef.current.style.transform = `translateX(${shouldOpen ? -actionsWidth : 0}px)`;
    }

    // Если сдвиг был совсем маленьким — считаем это обычным тапом по карточке
    const movedFar = Math.abs(dragRef.current.current - dragRef.current.openBase) > 6;
    if (!movedFar && !open) onOpen();
  };

  const closeAnd = (fn) => () => {
    setOpen(false);
    if (contentRef.current) {
      contentRef.current.style.transition = 'transform .2s ease-out';
      contentRef.current.style.transform = 'translateX(0px)';
    }
    fn();
  };

  const catInfo = CAT_MAP[poll.category] || { emoji: '📌', label: poll.category };
  const isDone = poll.status === 'completed' || poll.progress >= 100;

  return (
    <div style={{ position: 'relative', borderRadius: 22, overflow: 'hidden', marginBottom: 12 }}>
      {/* Действия — под контентом, справа */}
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, display: 'flex' }}>
        {actions.map(a => (
          <div
            key={a.key}
            onClick={closeAnd(a.onClick)}
            style={{ width: ACTION_W, background: a.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer' }}
          >
            <span style={{ fontSize: 18 }}>{a.icon}</span>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,.8)' }}>{a.label}</span>
          </div>
        ))}
      </div>

      {/* Контент — двигается через ref, поверх слоя действий */}
      <div
        ref={contentRef}
        onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
        onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
        style={{
          position: 'relative', background: isDone ? 'rgba(74,222,128,.06)' : C.card,
          border: `1px solid ${isDone ? 'rgba(74,222,128,.2)' : C.cardBorder}`,
          borderRadius: 22, padding: 16, cursor: 'pointer', touchAction: 'pan-y',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.textPrimary, marginBottom: 3 }}>{poll.title}</div>
            <div style={{ fontSize: 12, color: C.textSecondary }}>{poll.cardsCount} {poll.cardsCount === 1 ? 'вариант' : 'вариантов'} · {poll.participantsCount}{poll.targetParticipants ? `/${poll.targetParticipants}` : ''} участников</div>
          </div>
          <span style={{ fontSize: 11, background: 'rgba(168,85,247,.15)', color: '#c4b5fd', padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>{catInfo.emoji} {catInfo.label}</span>
        </div>
        <div style={{ height: 5, background: 'rgba(255,255,255,.08)', borderRadius: 3, overflow: 'hidden', marginBottom: isDone ? 8 : 6 }}>
          <div style={{ height: '100%', width: `${poll.progress}%`, background: isDone ? C.like : C.accent, borderRadius: 3 }} />
        </div>
        {isDone && <div style={{ fontSize: 12, color: C.like, fontWeight: 500 }}>Готово · есть результаты 🎉</div>}
        {!isDone && poll.status === 'active' && formatRemaining(poll.votingEndsAt) && (
          <div style={{ fontSize: 11, color: C.textMuted }}>⏳ Осталось {formatRemaining(poll.votingEndsAt)}</div>
        )}
      </div>
    </div>
  );
}

export default function Home({ user, myPolls, pollsLoading, navigate, openPoll, openPollForEdit, deletePollFromList, showToast }) {
  const [cat, setCat] = useState(null);
  const initials = (user?.name || '??').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const filtered = cat ? myPolls.filter(p => p.category === cat) : myPolls;

  const handleDelete = (poll) => {
    if (window.confirm ? window.confirm(`Удалить опрос «${poll.title}»?`) : true) {
      deletePollFromList(poll._id);
    }
  };

  const handleShare = (poll) => {
    tgShare(buildMiniAppLink(poll.sessionCode), `Присоединяйся к опросу «${poll.title}»!`);
  };

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary }}>
            {cat ? 'Опросы в категории' : 'Активные опросы'}
          </div>
          {filtered.length > 0 && <div style={{ fontSize: 10.5, color: C.textMuted }}>← смахните для действий</div>}
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
          const isOrganizer = user && String(poll.createdBy) === String(user.id || user._id);
          const canEdit = isOrganizer && (poll.votesCount || 0) === 0;
          return (
            <PollRow
              key={poll._id}
              poll={poll}
              isOrganizer={isOrganizer}
              canEdit={canEdit}
              onOpen={() => openPoll(poll._id)}
              onEdit={() => openPollForEdit(poll._id)}
              onDelete={() => handleDelete(poll)}
              onShare={() => handleShare(poll)}
            />
          );
        })}

        <div style={{ height: 90 }} />
      </div>

      <TabBar active="home" onNav={navigate} />
    </div>
  );
}
