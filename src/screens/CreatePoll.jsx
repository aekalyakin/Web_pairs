import React, { useState, useRef } from 'react';
import { C } from '../theme/tokens';
import { PrimaryBtn, Chip, Field } from '../components/UI';
import { tgShare, haptics } from '../hooks/useTelegram';
import { compressImage } from '../utils/imageCompress';
import { CATEGORIES } from '../theme/tokens';

const StepBar = ({ step, total }) => (
  <div style={{ display: 'flex', gap: 6, padding: '0 20px 20px' }}>
    {Array.from({ length: total }, (_, i) => i + 1).map(i => (
      <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? C.accentTo : 'rgba(255,255,255,.1)' }} />
    ))}
  </div>
);

const Header = ({ title, onBack }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 20px 8px' }}>
    <div onClick={onBack} style={{ fontSize: 20, color: C.textSecondary, cursor: 'pointer' }}>←</div>
    <div style={{ fontSize: 17, fontWeight: 600, color: C.textPrimary }}>{title}</div>
  </div>
);

export default function CreatePoll({ pollDraft, setPollDraft, activePoll, navigate, createPoll, addCardToPoll, startVoting, showToast }) {
  const [scenario, setScenario] = useState(pollDraft.scenario);
  const [title, setTitle] = useState(pollDraft.title);
  const [cat, setCat] = useState(pollDraft.category);
  const [step, setStep] = useState(pollDraft.step || 1);
  const [creating, setCreating] = useState(false);

  // Шаг 3 — добавление карточек (для личного сценария)
  const [cardTitle, setCardTitle] = useState('');
  const [cardDesc, setCardDesc] = useState('');
  const [cardImage, setCardImage] = useState(null); // base64
  const [cardImagePreview, setCardImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [addingCard, setAddingCard] = useState(false);
  const fileInputRef = useRef(null);

  const totalSteps = scenario === 'personal' ? 4 : 3;

  const goStep = (s) => { setPollDraft(d => ({ ...d, scenario, title, category: cat, step: s })); setStep(s); };

  const handleStep2Next = async () => {
    if (!title || !cat) return;
    setCreating(true);
    const poll = await createPoll(title, cat, scenario);
    setCreating(false);
    if (poll) goStep(3);
  };

  const handleImagePick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const base64 = await compressImage(file);
      setCardImage(base64);
      setCardImagePreview(URL.createObjectURL(file));
    } catch (err) {
      showToast('Не удалось загрузить фото');
    } finally {
      setUploading(false);
    }
  };

  const handleAddCard = async () => {
    if (!cardTitle.trim() || !activePoll) return;
    setAddingCard(true);
    const ok = await addCardToPoll(activePoll._id, cardTitle.trim(), cardDesc.trim(), cardImage, []);
    setAddingCard(false);
    if (ok) {
      setCardTitle(''); setCardDesc(''); setCardImage(null); setCardImagePreview(null);
      haptics.light();
    }
  };

  const handleFinish = async () => {
    if (scenario === 'personal' && (!activePoll?.cards || activePoll.cards.length < 2)) {
      showToast('Добавьте хотя бы 2 варианта');
      return;
    }
    await startVoting();
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bgGradient, overflow: 'hidden' }}>
      <Header title="Новый опрос" onBack={() => step === 1 ? navigate('home') : goStep(step - 1)} />
      <StepBar step={step} total={totalSteps} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 28px' }}>

        {step === 1 && (
          <>
            <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 18 }}>Кто готовит варианты?</div>
            {[
              { id: 'personal', icon: '👤', title: 'Личный', desc: 'Вы сами подбираете варианты с фото' },
              { id: 'shared', icon: '👥', title: 'Совместный', desc: 'Все участники добавляют идеи' },
            ].map(opt => (
              <div
                key={opt.id}
                onClick={() => { haptics.light(); setScenario(opt.id); }}
                style={{
                  padding: 18, borderRadius: 22, marginBottom: 12, cursor: 'pointer',
                  background: scenario === opt.id ? 'rgba(168,85,247,.1)' : C.card,
                  border: `1.5px solid ${scenario === opt.id ? C.accentTo : C.borderSoft}`,
                }}
              >
                <div style={{ fontSize: 26, marginBottom: 8 }}>{opt.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.textPrimary, marginBottom: 4 }}>{opt.title}</div>
                <div style={{ fontSize: 12.5, color: C.textSecondary }}>{opt.desc}</div>
              </div>
            ))}
            <div style={{ marginTop: 16 }}>
              <PrimaryBtn onClick={() => scenario && goStep(2)} disabled={!scenario}>Далее</PrimaryBtn>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <Field label="Название опроса" value={title} onChange={setTitle} placeholder="Например: Куда сходим вечером?" />
            <div style={{ fontSize: 11, color: C.textMuted, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 10, fontWeight: 500 }}>Категория</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {CATEGORIES.map(c => <Chip key={c.id} label={c.label} emoji={c.emoji} active={cat === c.id} onClick={() => setCat(c.id)} />)}
            </div>
            <PrimaryBtn onClick={handleStep2Next} disabled={!title || !cat || creating}>
              {creating ? 'Создаём...' : 'Далее'}
            </PrimaryBtn>
          </>
        )}

        {step === 3 && scenario === 'personal' && (
          <>
            <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 16 }}>
              Добавьте варианты — минимум 2. Фото не обязательно, но с ним нагляднее.
            </div>

            {/* Список уже добавленных карточек */}
            {activePoll?.cards?.map(card => (
              <div key={card._id} style={{ display: 'flex', gap: 12, alignItems: 'center', background: C.card, border: `1px solid ${C.borderSoft}`, borderRadius: 16, padding: 10, marginBottom: 8 }}>
                {card.imageBase64 ? (
                  <img src={`data:image/jpeg;base64,${card.imageBase64}`} style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} alt="" />
                ) : (
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(168,85,247,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{card.title[0]}</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: C.textPrimary }}>{card.title}</div>
                  {card.description && <div style={{ fontSize: 11, color: C.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.description}</div>}
                </div>
              </div>
            ))}

            {/* Форма добавления новой карточки */}
            <div style={{ background: 'rgba(255,255,255,.03)', border: `1px dashed ${C.borderSoft}`, borderRadius: 18, padding: 14, marginTop: activePoll?.cards?.length ? 14 : 0, marginBottom: 16 }}>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImagePick} style={{ display: 'none' }} />

              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  height: 100, borderRadius: 14, marginBottom: 12, cursor: 'pointer',
                  background: cardImagePreview ? `url(${cardImagePreview}) center/cover` : 'rgba(255,255,255,.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${C.borderSoft}`,
                }}
              >
                {!cardImagePreview && (
                  <div style={{ textAlign: 'center', color: C.textMuted, fontSize: 12 }}>
                    {uploading ? 'Загрузка...' : '📷 Добавить фото'}
                  </div>
                )}
              </div>

              <Field value={cardTitle} onChange={setCardTitle} placeholder="Название варианта" />
              <Field value={cardDesc} onChange={setCardDesc} placeholder="Короткое описание (необязательно)" />

              <div
                onClick={handleAddCard}
                style={{
                  textAlign: 'center', padding: '11px', borderRadius: 12,
                  background: cardTitle.trim() ? 'rgba(168,85,247,.15)' : 'rgba(255,255,255,.03)',
                  color: cardTitle.trim() ? '#c4b5fd' : C.textMuted,
                  fontSize: 13, fontWeight: 600, cursor: cardTitle.trim() ? 'pointer' : 'default',
                }}
              >{addingCard ? 'Добавляем...' : '+ Добавить вариант'}</div>
            </div>

            <PrimaryBtn onClick={() => goStep(4)} disabled={!activePoll?.cards || activePoll.cards.length < 2}>
              Далее ({activePoll?.cards?.length || 0} из мин. 2)
            </PrimaryBtn>
          </>
        )}

        {((step === 3 && scenario !== 'personal') || step === 4) && (
          <>
            <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 18 }}>Пригласите участников</div>
            <div style={{
              border: `2px dashed ${C.cardBorder}`, borderRadius: 22, padding: '24px 20px',
              textAlign: 'center', marginBottom: 20, background: 'rgba(168,85,247,.05)',
            }}>
              <div style={{ fontSize: 11, color: C.textMuted, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Код сессии</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: C.textPrimary, letterSpacing: 4 }}>{activePoll?.sessionCode || '······'}</div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
              {[
                { icon: '✈️', label: 'Telegram', action: () => tgShare(`https://t.me/PairDecisionsBot/app?startapp=${activePoll?.sessionCode}`, `Присоединяйся к опросу «${title}»!`) },
                { icon: '💬', label: 'WhatsApp', action: () => window.open(`https://wa.me/?text=${encodeURIComponent('Присоединяйся! Код: ' + activePoll?.sessionCode)}`, '_blank') },
                { icon: '🔗', label: 'Скопировать', action: () => { navigator.clipboard?.writeText(activePoll?.sessionCode || ''); showToast('Код скопирован'); } },
              ].map(s => (
                <div key={s.label} onClick={s.action} style={{ flex: 1, padding: '12px 8px', borderRadius: 14, background: C.card, border: `1px solid ${C.borderSoft}`, textAlign: 'center', cursor: 'pointer' }}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontSize: 10, color: C.textSecondary }}>{s.label}</div>
                </div>
              ))}
            </div>

            <PrimaryBtn onClick={handleFinish}>
              {scenario === 'personal' ? 'Начать голосование' : 'Создать и пригласить'}
            </PrimaryBtn>
          </>
        )}
      </div>
    </div>
  );
}
