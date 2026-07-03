import React, { useState, useRef, useCallback, useEffect } from 'react';
import { C, SHADOW, SWIPE } from '../theme/tokens';
import { VoteDots } from '../components/UI';
import { haptics, tgBackButton } from '../hooks/useTelegram';

export default function Voting({ activePoll, cardIdx, castVote, nextCard, navigate, pollLoading }) {
  const cards = activePoll?.cards || [];
  const card = cards[cardIdx];
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [flying, setFlying] = useState(null);
  const startRef = useRef({ x: 0, y: 0 });

  useEffect(() => tgBackButton(() => navigate('home')), [navigate]);

  const gp = (e) => ({ x: e.clientX ?? e.touches?.[0]?.clientX ?? 0, y: e.clientY ?? e.touches?.[0]?.clientY ?? 0 });

  const onDown = (e) => { startRef.current = gp(e); setDrag(d => ({ ...d, active: true })); };
  const onMove = (e) => {
    if (!drag.active) return;
    const p = gp(e);
    setDrag({ x: p.x - startRef.current.x, y: p.y - startRef.current.y, active: true });
  };
  const onUp = () => {
    if (!drag.active) return;
    const { x, y } = drag;
    const ax = Math.abs(x), ay = Math.abs(y);
    setDrag(d => ({ ...d, active: false }));

    if (y < -SWIPE.vertical && ay > ax) commit('discuss');
    else if (x > SWIPE.horizontal) commit('like');
    else if (x < -SWIPE.horizontal) commit('nope');
    else setDrag({ x: 0, y: 0, active: false });
  };

  const commit = useCallback(async (vote) => {
    if (!card) return;
    haptics.light();
    setFlying(vote);
    const result = await castVote(card._id, vote);
    setTimeout(() => {
      setFlying(null);
      setDrag({ x: 0, y: 0, active: false });
      if (result === 'match') {
        haptics.success();
        navigate('match');
      } else {
        nextCard();
      }
    }, SWIPE.commitDuration);
  }, [card, castVote, nextCard, navigate]);

  if (pollLoading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bgGradient }}>
        <div style={{ color: C.textMuted, fontSize: 14 }}>Загрузка опроса...</div>
      </div>
    );
  }

  if (!card) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: C.bgGradient, gap: 12, padding: 24 }}>
        <div style={{ fontSize: 15, color: C.textPrimary, fontWeight: 600 }}>В этом опросе пока нет вариантов</div>
        <div onClick={() => navigate('home')} style={{ color: '#c4b5fd', fontSize: 13, cursor: 'pointer' }}>← На главную</div>
      </div>
    );
  }

  const rotate = drag.x / SWIPE.rotateDivisor;
  const flyTransform =
    flying === 'like'    ? `translate(${SWIPE.flyDistanceX}px, -40px) rotate(24deg)` :
    flying === 'nope'    ? `translate(-${SWIPE.flyDistanceX}px, -40px) rotate(-24deg)` :
    flying === 'discuss' ? `translate(0, -${SWIPE.flyDistanceY}px) rotate(0deg)` : null;

  const cardStyle = {
    position: 'absolute', inset: 0, borderRadius: 24, overflow: 'hidden',
    background: C.card, border: `1px solid ${C.cardBorder}`,
    boxShadow: SHADOW.cardStack,
    userSelect: 'none', touchAction: 'none', cursor: drag.active ? 'grabbing' : 'grab',
    transform: flyTransform || `translate(${drag.x}px, ${Math.min(drag.y, 0)}px) rotate(${rotate}deg)`,
    transition: flying ? `transform ${SWIPE.commitDuration}ms ease-out, opacity ${SWIPE.commitDuration}ms` : (drag.active ? 'none' : SWIPE.springBack),
    opacity: flying ? 0.2 : 1,
  };

  const isVert = drag.y < 0 && Math.abs(drag.y) > Math.abs(drag.x);
  const likeOp = !isVert ? Math.min(1, Math.max(0, drag.x / 90)) : 0;
  const nopeOp = !isVert ? Math.min(1, Math.max(0, -drag.x / 90)) : 0;
  const discussOp = isVert ? Math.min(1, Math.max(0, -drag.y / 90)) : 0;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bgGradient, overflow: 'hidden' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 10px' }}>
        <div onClick={() => navigate('home')} style={{ fontSize: 20, color: C.textSecondary, cursor: 'pointer', width: 32 }}>✕</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary }}>{activePoll.title}</div>
        </div>
        <div style={{ width: 32 }} />
      </div>

      <div style={{ marginBottom: 14 }}><VoteDots total={cards.length} current={cardIdx} /></div>

      <div style={{ flex: 1, margin: '0 20px', position: 'relative', minHeight: 0 }}
        onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
        onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
      >
        {[2, 1].map(offset => {
          const peek = cards[cardIdx + offset];
          if (!peek) return null;
          return (
            <div key={peek._id} style={{
              position: 'absolute', inset: 0, borderRadius: 24, background: C.card,
              border: `1px solid ${C.cardBorder}`, transform: `scale(${1 - offset * 0.04}) translateY(${offset * 10}px)`,
              opacity: 1 - offset * 0.3,
            }} />
          );
        })}

        <div style={cardStyle}>
          <div style={{ position: 'relative', height: '62%', background: card.imageBase64 ? undefined : `linear-gradient(160deg, #2a1f5c, #1a1a2e)`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {card.imageBase64 ? (
              <img src={`data:image/jpeg;base64,${card.imageBase64}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            ) : (
              <div style={{ fontSize: 40, fontWeight: 700, color: 'rgba(255,255,255,.2)' }}>{card.title?.[0]?.toUpperCase()}</div>
            )}

            <div style={{ position: 'absolute', top: 18, right: 16, border: `3px solid ${C.like}`, borderRadius: 10, padding: '4px 12px', transform: 'rotate(10deg)', opacity: likeOp }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.like, letterSpacing: 1 }}>НРАВИТСЯ</span>
            </div>
            <div style={{ position: 'absolute', top: 18, left: 16, border: `3px solid ${C.no}`, borderRadius: 10, padding: '4px 12px', transform: 'rotate(-10deg)', opacity: nopeOp }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.no, letterSpacing: 1 }}>NOPE</span>
            </div>
            <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', border: `3px solid ${C.discuss}`, borderRadius: 10, padding: '4px 12px', opacity: discussOp }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.discuss, letterSpacing: 1 }}>ОБСУДИМ</span>
            </div>
          </div>

          <div style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 19, fontWeight: 600, color: C.textPrimary, marginBottom: 6 }}>{card.title}</div>
            {card.description && <div style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>{card.description}</div>}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '16px 20px calc(20px + env(safe-area-inset-bottom,0px))' }}>
        <div onClick={() => commit('nope')} style={{ width: 54, height: 54, borderRadius: 27, border: `2px solid ${C.no}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: C.no, cursor: 'pointer' }}>✕</div>
        <div onClick={() => commit('discuss')} style={{ width: 54, height: 54, borderRadius: 27, border: `2px solid ${C.discuss}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: C.discuss, cursor: 'pointer' }}>💬</div>
        <div onClick={() => commit('like')} style={{ width: 64, height: 64, borderRadius: 32, background: C.like, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, color: '#0d0d1c', cursor: 'pointer', boxShadow: SHADOW.likeButton }}>♥</div>
      </div>
    </div>
  );
}
