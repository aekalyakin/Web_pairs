import React from 'react';
import { C } from '../theme/tokens';
import { PrimaryBtn, SecondaryBtn } from '../components/UI';
import Confetti from '../components/Confetti';

export default function MatchOverlay({ matchCard, dismissMatch, activePoll }) {
  if (!matchCard) return null;

  const participants = activePoll?.participants || [];

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'rgba(13,13,28,.92)', backdropFilter: 'blur(4px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px', overflow: 'hidden',
    }}>
      <Confetti count={40} />

      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', width: '100%', animation: 'matchPop .4s cubic-bezier(.2,1.4,.4,1)' }}>
        <div style={{ fontSize: 12, color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10, fontWeight: 600 }}>Совпадение мнений</div>
        <div style={{ fontSize: 32, fontWeight: 700, color: '#fff', marginBottom: 28 }}>Мэтч! 🎉</div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 10, position: 'relative', height: 64 }}>
          {participants.slice(0, 2).map((p, i) => (
            p.photoUrl ? (
              <img key={p._id || i} src={p.photoUrl} style={{ width: 56, height: 56, borderRadius: 28, border: '3px solid #0d0d1c', objectFit: 'cover', marginLeft: i > 0 ? -14 : 0, zIndex: 1 }} alt="" />
            ) : (
              <div key={p._id || i} style={{ width: 56, height: 56, borderRadius: 28, background: i === 0 ? C.accent : 'linear-gradient(135deg,#f472b6,#ec4899)', border: '3px solid #0d0d1c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#fff', fontWeight: 600, marginLeft: i > 0 ? -14 : 0, zIndex: 1 }}>
                {(p.name || '?')[0].toUpperCase()}
              </div>
            )
          ))}
          <div style={{ position: 'absolute', width: 26, height: 26, borderRadius: 13, background: C.like, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, zIndex: 2, boxShadow: '0 4px 10px rgba(0,0,0,.3)' }}>♥</div>
        </div>
        <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 24 }}>Вы оба выбрали</div>

        <div style={{ background: C.card, border: `1px solid ${C.cardBorderStrong}`, borderRadius: 22, padding: 16, marginBottom: 28, display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left' }}>
          {matchCard.imageBase64 ? (
            <img src={`data:image/jpeg;base64,${matchCard.imageBase64}`} style={{ width: 60, height: 60, borderRadius: 16, objectFit: 'cover', flexShrink: 0 }} alt="" />
          ) : (
            <div style={{ width: 60, height: 60, borderRadius: 16, background: 'linear-gradient(160deg,#2a1f5c,#1a1a2e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: 'rgba(255,255,255,.3)', flexShrink: 0 }}>
              {matchCard.title?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 3 }}>{matchCard.title}</div>
            <div style={{ fontSize: 12, color: C.like }}>♥ Совпало у всех участников</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <PrimaryBtn onClick={() => dismissMatch(true)}>Смотреть результаты</PrimaryBtn>
          <SecondaryBtn onClick={() => dismissMatch(false)}>Продолжить голосование</SecondaryBtn>
        </div>
      </div>

      <style>{`
        @keyframes matchPop {
          0%   { transform: scale(.85); }
          60%  { transform: scale(1.03); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
