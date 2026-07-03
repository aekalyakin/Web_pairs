import React, { useState, useRef, useCallback, useEffect } from 'react';
import { C, SHADOW, SWIPE } from '../theme/tokens';
import { VoteDots } from '../components/UI';
import { haptics, tgBackButton, tgOpenLink } from '../hooks/useTelegram';

export default function Voting({ activePoll, cardIdx, castVote, nextCard, navigate, pollLoading }) {
  const cards = activePoll?.cards || [];
  const card = cards[cardIdx];

  // Во время самого свайпа мы НЕ трогаем React state — иначе каждый пиксель
  // движения пальца вызывает полный re-render (это и вызывало тормоза).
  // Вместо этого пишем стили напрямую в DOM через refs, батчим через rAF,
  // и обращаемся к React только когда жест завершён (спружинить назад / улететь).
  const cardRef = useRef(null);
  const likeStampRef = useRef(null);
  const nopeStampRef = useRef(null);
  const discussStampRef = useRef(null);

  const dragRef = useRef({ x: 0, y: 0, active: false });
  const startRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);

  const [flying, setFlying] = useState(null);

  useEffect(() => tgBackButton(() => navigate('home')), [navigate]);

  // Сбрасываем позицию карточки при смене карточки (новая карточка = чистый лист)
  useEffect(() => {
    dragRef.current = { x: 0, y: 0, active: false };
    if (cardRef.current) {
      cardRef.current.style.transition = 'none';
      cardRef.current.style.transform = 'translate(0px, 0px) rotate(0deg)';
      cardRef.current.style.opacity = '1';
    }
    [likeStampRef, nopeStampRef, discussStampRef].forEach(r => { if (r.current) r.current.style.opacity = '0'; });
  }, [cardIdx]);

  const gp = (e) => ({ x: e.clientX ?? e.touches?.[0]?.clientX ?? 0, y: e.clientY ?? e.touches?.[0]?.clientY ?? 0 });

  // Применяет текущую позицию драга к DOM — вызывается максимум раз за кадр (rAF)
  const applyDragToDOM = () => {
    rafRef.current = null;
    const { x, y } = dragRef.current;
    if (!cardRef.current) return;

    const rotate = x / SWIPE.rotateDivisor;
    cardRef.current.style.transform = `translate(${x}px, ${Math.min(y, 0)}px) rotate(${rotate}deg)`;

    const isVert = y < 0 && Math.abs(y) > Math.abs(x);
    const likeOp = !isVert ? Math.min(1, Math.max(0, x / 90)) : 0;
    const nopeOp = !isVert ? Math.min(1, Math.max(0, -x / 90)) : 0;
    const discussOp = isVert ? Math.min(1, Math.max(0, -y / 90)) : 0;

    if (likeStampRef.current) likeStampRef.current.style.opacity = String(likeOp);
    if (nopeStampRef.current) nopeStampRef.current.style.opacity = String(nopeOp);
    if (discussStampRef.current) discussStampRef.current.style.opacity = String(discussOp);
  };

  const onDown = (e) => {
    startRef.current = gp(e);
    dragRef.current = { x: 0, y: 0, active: true };
    if (cardRef.current) {
      cardRef.current.style.transition = 'none';
      cardRef.current.style.cursor = 'grabbing';
    }
  };

  const onMove = (e) => {
    if (!dragRef.current.active) return;
    const p = gp(e);
    dragRef.current.x = p.x - startRef.current.x;
    dragRef.current.y = p.y - startRef.current.y;
    // Батчим запись в DOM — не чаще одного раза за кадр, даже если события идут чаще
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(applyDragToDOM);
    }
  };

  const springBack = () => {
    if (rafRef.current != null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    dragRef.current = { x: 0, y: 0, active: false };
    if (cardRef.current) {
      cardRef.current.style.transition = SWIPE.springBack;
      cardRef.current.style.transform = 'translate(0px, 0px) rotate(0deg)';
      cardRef.current.style.cursor = 'grab';
    }
    [likeStampRef, nopeStampRef, discussStampRef].forEach(r => { if (r.current) r.current.style.opacity = '0'; });
  };

  const onUp = () => {
    if (!dragRef.current.active) return;
    const { x, y } = dragRef.current;
    dragRef.current.active = false;
    const ax = Math.abs(x), ay = Math.abs(y);

    if (y < -SWIPE.vertical && ay > ax) commit('discuss');
    else if (x > SWIPE.horizontal) commit('like');
    else if (x < -SWIPE.horizontal) commit('nope');
    else springBack();
  };

  const commit = useCallback(async (vote) => {
    if (!card) return;
    if (rafRef.current != null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    haptics.light();
    setFlying(vote); // единственный setState за весь жест — на коммит, не на движение
    const result = await castVote(card._id, vote);
    setTimeout(() => {
      setFlying(null);
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

  const flyTransform =
    flying === 'like'    ? `translate(${SWIPE.flyDistanceX}px, -40px) rotate(24deg)` :
    flying === 'nope'    ? `translate(-${SWIPE.flyDistanceX}px, -40px) rotate(-24deg)` :
    flying === 'discuss' ? `translate(0, -${SWIPE.flyDistanceY}px) rotate(0deg)` : null;

  // flying меняется редко (раз за карточку) — тут React-рендер это нормально и дёшево
  const cardStyle = {
    position: 'absolute', inset: 0, borderRadius: 24, overflow: 'hidden',
    background: C.card, border: `1px solid ${C.cardBorder}`,
    boxShadow: SHADOW.cardStack,
    userSelect: 'none', touchAction: 'none', cursor: 'grab',
    ...(flying ? { transform: flyTransform, transition: `transform ${SWIPE.commitDuration}ms ease-out, opacity ${SWIPE.commitDuration}ms`, opacity: 0.2 } : {}),
  };

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

        <div ref={cardRef} style={cardStyle}>
          <div style={{ position: 'relative', height: '62%', background: card.imageBase64 ? undefined : `linear-gradient(160deg, #2a1f5c, #1a1a2e)`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {card.imageBase64 ? (
              <img src={`data:image/jpeg;base64,${card.imageBase64}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" draggable={false} />
            ) : (
              <div style={{ fontSize: 40, fontWeight: 700, color: 'rgba(255,255,255,.2)' }}>{card.title?.[0]?.toUpperCase()}</div>
            )}

            <div ref={likeStampRef} style={{ position: 'absolute', top: 18, right: 16, border: `3px solid ${C.like}`, borderRadius: 10, padding: '4px 12px', transform: 'rotate(10deg)', opacity: 0 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.like, letterSpacing: 1 }}>НРАВИТСЯ</span>
            </div>
            <div ref={nopeStampRef} style={{ position: 'absolute', top: 18, left: 16, border: `3px solid ${C.no}`, borderRadius: 10, padding: '4px 12px', transform: 'rotate(-10deg)', opacity: 0 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.no, letterSpacing: 1 }}>NOPE</span>
            </div>
            <div ref={discussStampRef} style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', border: `3px solid ${C.discuss}`, borderRadius: 10, padding: '4px 12px', opacity: 0 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.discuss, letterSpacing: 1 }}>ОБСУДИМ</span>
            </div>
          </div>

          <div style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 19, fontWeight: 600, color: C.textPrimary, marginBottom: 6 }}>{card.title}</div>
            {card.description && <div style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.5, marginBottom: card.links?.length ? 10 : 0 }}>{card.description}</div>}
            {card.links?.length > 0 && (
              <div style={{ display: 'flex', gap: 8 }}>
                {card.links.map((url, i) => {
                  const isYandex = url.includes('yandex.ru');
                  const is2gis = url.includes('2gis.ru');
                  const icon = isYandex ? '📍' : is2gis ? '🗺️' : '🔗';
                  const name = isYandex ? 'Я.Карты' : is2gis ? '2GIS' : 'Ссылка';
                  return (
                    <div
                      key={i}
                      onClick={(e) => { e.stopPropagation(); tgOpenLink(url); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 10, background: 'rgba(255,255,255,.05)', border: `1px solid ${C.borderSoft}`, cursor: 'pointer' }}
                    >
                      <span style={{ fontSize: 13 }}>{icon}</span>
                      <span style={{ fontSize: 11.5, color: C.textSecondary, fontWeight: 500 }}>{name}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 12, padding: '16px 20px calc(20px + env(safe-area-inset-bottom,0px))' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div onClick={() => commit('nope')} style={{ width: 54, height: 54, borderRadius: 27, border: `2px solid ${C.no}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: C.no, cursor: 'pointer' }}>✕</div>
          <span style={{ fontSize: 10.5, color: C.no, fontWeight: 600 }}>Нет</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div onClick={() => commit('discuss')} style={{ width: 54, height: 54, borderRadius: 27, border: `2px solid ${C.discuss}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: C.discuss, cursor: 'pointer' }}>💬</div>
          <span style={{ fontSize: 10.5, color: C.discuss, fontWeight: 600 }}>Обсудим</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div onClick={() => commit('like')} style={{ width: 64, height: 64, borderRadius: 32, background: C.like, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, color: '#0d0d1c', cursor: 'pointer', boxShadow: SHADOW.likeButton }}>♥</div>
          <span style={{ fontSize: 10.5, color: C.like, fontWeight: 600 }}>Да</span>
        </div>
      </div>
    </div>
  );
}
