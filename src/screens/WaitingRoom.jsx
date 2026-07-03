import React, { useEffect, useState, useCallback } from 'react';
import { C, SHADOW } from '../theme/tokens';
import { PrimaryBtn } from '../components/UI';
import { tgShare, haptics, tgBackButton } from '../hooks/useTelegram';
import { api } from '../api/client';
import { buildMiniAppLink } from '../config';

const MIN_PARTICIPANTS = 2;

export default function WaitingRoom({ activePoll, setActivePoll, user, navigate, startVoting, enterVoting, showToast, pollDraft }) {
  const [poll, setPoll] = useState(activePoll);
  const [starting, setStarting] = useState(false);
  const isCreator = poll && user && String(poll.createdBy?._id || poll.createdBy) === String(user.id);

  useEffect(() => tgBackButton(() => navigate('home')), [navigate]);

  // ── Опрашиваем сервер каждые 3 сек — не появился ли новый участник / не стартовало ли голосование ──
  const refresh = useCallback(async () => {
    if (!activePoll?._id) return;
    try {
      const fresh = await api.getPoll(activePoll._id);
      setPoll(prev => {
        // Уведомляем о новом участнике
        if (prev && fresh.participants.length > prev.participants.length) {
          haptics.success();
          showToast('👋 Новый участник присоединился');
        }
        return fresh;
      });
      setActivePoll(fresh);

      // Если организатор уже запустил голосование — переходим все вместе
      if (fresh.status === 'active') {
        enterVoting();
      }
    } catch (e) {
      // тихо игнорируем сетевые сбои опроса — попробуем через 3 сек снова
    }
  }, [activePoll?._id, setActivePoll, showToast, enterVoting]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleStart = async () => {
    if (!poll || poll.participants.length < MIN_PARTICIPANTS) return;
    setStarting(true);
    await startVoting(pollDraft?.votingDuration || 60);
    setStarting(false);
  };

  if (!poll) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bgGradient }}>
        <div style={{ color: C.textMuted, fontSize: 14 }}>Загрузка...</div>
      </div>
    );
  }

  const enoughPeople = poll.participants.length >= MIN_PARTICIPANTS;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bgGradient }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 20px 8px' }}>
        <div onClick={() => navigate('home')} style={{ fontSize: 20, color: C.textSecondary, cursor: 'pointer' }}>←</div>
        <div style={{ fontSize: 17, fontWeight: 600, color: C.textPrimary }}>Ожидание участников</div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 24px' }}>

        {/* Пульсирующий индикатор ожидания */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 36,
            background: enoughPeople ? 'rgba(74,222,128,.12)' : 'rgba(168,85,247,.12)',
            border: `2px solid ${enoughPeople ? C.like : C.accentTo}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30,
            animation: enoughPeople ? 'none' : 'waitPulse 1.6s ease-in-out infinite',
          }}>
            {enoughPeople ? '✅' : '⏳'}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: C.textPrimary, marginBottom: 6 }}>
            {enoughPeople ? 'Все на месте!' : 'Ждём участников'}
          </div>
          <div style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>
            {enoughPeople
              ? (isCreator ? 'Можно начинать голосование' : 'Организатор скоро начнёт голосование')
              : `Нужно ещё минимум ${MIN_PARTICIPANTS - poll.participants.length} ${MIN_PARTICIPANTS - poll.participants.length === 1 ? 'человек' : 'человека'}`}
          </div>
        </div>

        {/* Список участников */}
        <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 20, padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>
            Участники ({poll.participants.length})
          </div>
          {poll.participants.map(p => (
            <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              {p.photoUrl ? (
                <img src={p.photoUrl} style={{ width: 38, height: 38, borderRadius: 14, objectFit: 'cover' }} alt="" />
              ) : (
                <div style={{ width: 38, height: 38, borderRadius: 14, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: '#fff' }}>
                  {(p.name || '?')[0].toUpperCase()}
                </div>
              )}
              <div style={{ fontSize: 14, color: C.textPrimary, fontWeight: 500 }}>{p.name}</div>
              {String(p._id) === String(poll.createdBy?._id || poll.createdBy) && (
                <span style={{ fontSize: 10, color: C.textMuted, marginLeft: 'auto' }}>организатор</span>
              )}
            </div>
          ))}

          {/* Пустые слоты-плейсхолдеры показывают, что кого-то не хватает */}
          {!enoughPeople && Array.from({ length: MIN_PARTICIPANTS - poll.participants.length }).map((_, i) => (
            <div key={'empty' + i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, opacity: .35 }}>
              <div style={{ width: 38, height: 38, borderRadius: 14, border: `1.5px dashed ${C.textMuted}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>?</div>
              <div style={{ fontSize: 13, color: C.textMuted }}>Ожидаем...</div>
            </div>
          ))}
        </div>

        {/* Код сессии — всегда виден, чтобы легко переслать ещё раз */}
        <div style={{ border: `1.5px dashed ${C.cardBorder}`, borderRadius: 16, padding: '14px 16px', textAlign: 'center', marginBottom: 20, background: 'rgba(168,85,247,.04)' }}>
          <div style={{ fontSize: 10, color: C.textMuted, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>Код сессии</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.textPrimary, letterSpacing: 3 }}>{poll.sessionCode}</div>
        </div>

        <div
          onClick={() => tgShare(buildMiniAppLink(poll.sessionCode), `Присоединяйся к опросу «${poll.title}»!`)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 14, border: `1px solid ${C.borderSoft}`, marginBottom: 20, cursor: 'pointer' }}
        >
          <span>✈️</span>
          <span style={{ fontSize: 13, color: C.textPrimary, fontWeight: 500 }}>Пригласить ещё раз</span>
        </div>

        <div style={{ flex: 1 }} />

        {isCreator ? (
          <>
            {pollDraft?.votingDuration && (
              <div style={{ textAlign: 'center', fontSize: 11, color: C.textMuted, marginBottom: 10 }}>
                Голосование продлится {pollDraft.votingDuration >= 60 ? `${pollDraft.votingDuration / 60} ч` : `${pollDraft.votingDuration} мин`}
              </div>
            )}
            <PrimaryBtn onClick={handleStart} disabled={!enoughPeople || starting}>
              {starting ? 'Запускаем...' : enoughPeople ? 'Начать голосование' : `Нужно ещё ${MIN_PARTICIPANTS - poll.participants.length}`}
            </PrimaryBtn>
          </>
        ) : (
          <div style={{ textAlign: 'center', fontSize: 12, color: C.textMuted, padding: '14px' }}>
            Ждём, пока организатор запустит голосование...
          </div>
        )}
      </div>

      <style>{`
        @keyframes waitPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(1.08); opacity: .7; }
        }
      `}</style>
    </div>
  );
}
