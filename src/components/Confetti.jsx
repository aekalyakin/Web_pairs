import React, { useMemo } from 'react';

const COLORS = ['#a855f7', '#7c3aed', '#4ade80', '#fbbf24', '#f87171', '#ECECF5'];

export default function Confetti({ count = 36 }) {
  const pieces = useMemo(() => Array.from({ length: count }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 1.4,
    duration: 2.4 + Math.random() * 1.6,
    size: 6 + Math.random() * 6,
    color: COLORS[i % COLORS.length],
    round: Math.random() > 0.5,
    rotate: Math.random() * 360,
  })), [count]);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 5 }}>
      {pieces.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute', top: -20, left: `${p.left}%`,
            width: p.size, height: p.size, background: p.color,
            borderRadius: p.round ? '50%' : 3,
            opacity: 0.85,
            animation: `confettiFall ${p.duration}s linear ${p.delay}s infinite`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: .9; }
          85%  { opacity: .5; }
          100% { transform: translateY(640px) rotate(340deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
