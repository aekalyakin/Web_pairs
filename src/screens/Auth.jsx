import React, { useState } from 'react';
import { C, FONT } from '../theme/tokens';
import { PrimaryBtn, Field } from '../components/UI';

export default function Auth({ login, register, authLoading, showToast }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [pass, setPass] = useState('');

  const submit = () => {
    if (!phone || !pass || (mode === 'register' && !name)) {
      showToast('Заполните все поля');
      return;
    }
    if (mode === 'login') login(phone, pass);
    else register(phone, name, pass);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bgGradient, padding: '40px 24px 28px', overflowY: 'auto' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 88, height: 88, borderRadius: 40, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, marginBottom: 20, boxShadow: '0 16px 32px rgba(124,58,237,.3)' }}>🤝</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: C.textPrimary, marginBottom: 6 }}>Pair Decisions</div>
        <div style={{ fontSize: 14, color: C.textSecondary, marginBottom: 12 }}>Договаривайтесь вместе</div>
        <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 32, textAlign: 'center', lineHeight: 1.5 }}>
          Откройте в Telegram — войдёте автоматически.<br />Или войдите по номеру телефона:
        </div>

        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,.05)', borderRadius: 14, padding: 4, marginBottom: 20 }}>
            {['login', 'register'].map(m => (
              <div key={m} onClick={() => setMode(m)} style={{
                flex: 1, textAlign: 'center', padding: '9px', borderRadius: 10, cursor: 'pointer',
                background: mode === m ? C.accent : 'transparent',
                color: mode === m ? '#fff' : C.textSecondary, fontSize: 13, fontWeight: 600,
              }}>{m === 'login' ? 'Вход' : 'Регистрация'}</div>
            ))}
          </div>

          <Field label="Номер телефона" value={phone} onChange={setPhone} placeholder="+7 (999) 000-00-00" type="tel" />
          {mode === 'register' && <Field label="Ваше имя" value={name} onChange={setName} placeholder="Алексей" />}
          <Field label="Пароль" value={pass} onChange={setPass} placeholder="••••••••" type="password" />

          <PrimaryBtn onClick={submit} disabled={authLoading}>
            {authLoading ? 'Подождите...' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </PrimaryBtn>
        </div>
      </div>
    </div>
  );
}
