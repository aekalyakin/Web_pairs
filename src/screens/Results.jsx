import React from 'react';
import { C } from '../theme/tokens';
import { PrimaryBtn, SegmentedBar, TabBar } from '../components/UI';

export default function Results({ activePoll, results, navigate }) {
  if (!results) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bgGradient }}>
        <div style={{ color: C.textMuted, fontSize: 14 }}>Загрузка результатов...</div>
      </div>
    );
  }

  const items = results.results || [];
  const winner = items[0]; // сервер отдаёт отсортированным по проценту

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bgGradient, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 6px' }}>
        <div onClick={() => navigate('home')} style={{ fontSize: 20, color: C.textSecondary, cursor: 'pointer' }}>←</div>
        <div style={{ fontSize: 17, fontWeight: 600, color: C.textPrimary }}>Результаты</div>
        <div style={{ width: 20 }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 20px 20px' }}>

        {winner && (
          <div style={{ background: C.card, border: `1px solid ${C.cardBorderStrong}`, borderRadius: 24, overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ height: 140, background: winner.imageBase64 ? undefined : 'linear-gradient(160deg,#2a1f5c,#1a1a2e)', position: 'relative', overflow: 'hidden' }}>
              {winner.imageBase64 ? (
                <img src={`data:image/jpeg;base64,${winner.imageBase64}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 700, color: 'rgba(255,255,255,.2)' }}>{winner.title?.[0]}</div>
              )}
              <div style={{ position: 'absolute', top: 12, left: 12, fontSize: 11, fontWeight: 600, background: 'rgba(251,191,36,.9)', color: '#1a1200', padding: '5px 12px', borderRadius: 999 }}>🏆 Победитель</div>
            </div>
            <div style={{ padding: 18 }}>
              <div style={{ fontSize: 19, fontWeight: 600, color: C.textPrimary, marginBottom: 6 }}>{winner.title}</div>
              <div style={{ fontSize: 13, color: C.like, fontWeight: 500 }}>♥ {winner.yes} из {winner.total} голосов ({winner.percent}%)</div>
            </div>
          </div>
        )}

        <div style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, marginBottom: 12 }}>Рейтинг вариантов</div>
        {items.map(r => (
          <div key={r.cardId} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: C.textPrimary }}>{r.title}</span>
              <span style={{ fontSize: 12, color: C.textMuted }}>{r.percent}% · {r.total}/{r.participants}</span>
            </div>
            <SegmentedBar like={r.yes} discuss={r.maybe || 0} nope={r.no} />
          </div>
        ))}

        {items.length === 0 && (
          <div style={{ textAlign: 'center', color: C.textMuted, fontSize: 13, padding: '40px 0' }}>Пока никто не проголосовал</div>
        )}
      </div>

      <TabBar active="results" onNav={navigate} />
    </div>
  );
}
