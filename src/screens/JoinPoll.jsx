import React, { useState } from 'react';
import { C } from '../theme/tokens';
import { PrimaryBtn, Field } from '../components/UI';

export default function JoinPoll({ navigate, joinByCode }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!code.trim()) return;
    setLoading(true);
    await joinByCode(code.trim().toUpperCase());
    setLoading(false);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bgGradient }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 20px 8px' }}>
        <div onClick={() => navigate('home')} style={{ fontSize: 20, color: C.textSecondary, cursor: 'pointer' }}>←</div>
        <div style={{ fontSize: 17, fontWeight: 600, color: C.textPrimary }}>Присоединиться</div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 24px' }}>
        <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 20 }}>🔗</div>
        <div style={{ fontSize: 13, color: C.textSecondary, textAlign: 'center', marginBottom: 24 }}>
          Введите код сессии, который прислал вам организатор опроса
        </div>
        <Field value={code} onChange={v => setCode(v.toUpperCase())} placeholder="Например: PX7K2A" />
        <PrimaryBtn onClick={submit} disabled={!code.trim() || loading}>
          {loading ? 'Ищем опрос...' : 'Присоединиться'}
        </PrimaryBtn>
      </div>
    </div>
  );
}
