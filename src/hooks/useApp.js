import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/client';
import { initTelegram, getInitData, getTelegramUserUnsafe, getStartParam, isInTelegram } from './useTelegram';

export function useApp() {
  const [screen, setScreen] = useState('loading');
  const [onboardIdx, setOnboardIdx] = useState(0);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [myPolls, setMyPolls] = useState([]);
  const lastPollsLoadRef = useRef(0);
  const [pollsLoading, setPollsLoading] = useState(false);

  const [pollDraft, setPollDraft] = useState({ scenario: null, title: '', category: null, step: 1 });
  const [activePoll, setActivePoll] = useState(null); // { _id, title, category, cards, sessionCode }
  const [pollLoading, setPollLoading] = useState(false);

  const [cardIdx, setCardIdx] = useState(0);
  const [votes, setVotes] = useState({});
  const [matchCard, setMatchCard] = useState(null);
  const [results, setResults] = useState(null);
  const [billing, setBilling] = useState('year');

  const [toast, setToast] = useState(null);
  const showToast = useCallback((msg, ms = 2500) => { setToast(msg); setTimeout(() => setToast(null), ms); }, []);

  // ── Инициализация: пробуем авто-вход через Telegram, иначе — сохранённый токен ──
  useEffect(() => {
    initTelegram();
    boot();
  }, []);

  const boot = async () => {
    const savedToken = localStorage.getItem('authToken');
    const initData = getInitData();

    if (initData) {
      // Есть Telegram initData — авторизуемся/регистрируемся автоматически
      try {
        setAuthLoading(true);
        const res = await api.loginTelegram(initData);
        applySession(res.token, res.user);
        setScreen('home');
      } catch (e) {
        showToast('Не удалось войти через Telegram');
        setScreen('auth');
      } finally {
        setAuthLoading(false);
      }
    } else if (savedToken) {
      // Обычный веб — есть сохранённый токен
      try {
        const profile = await api.profile();
        setUser(profile);
        setScreen('home');
      } catch {
        setScreen('auth');
      }
    } else {
      setScreen('onboarding');
    }

    const startParam = getStartParam();
    if (startParam) localStorage.setItem('pendingJoinCode', startParam);
  };

  const applySession = (token, userData) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userId', userData.id);
    localStorage.setItem('userName', userData.name);
    setUser(userData);
  };

  const login = useCallback(async (phone, password) => {
    setAuthLoading(true);
    try {
      const res = await api.loginPhone(phone, password);
      applySession(res.token, res.user);
      setScreen('home');
    } catch (e) {
      showToast(e.message);
    } finally {
      setAuthLoading(false);
    }
  }, [showToast]);

  const register = useCallback(async (phone, name, password) => {
    setAuthLoading(true);
    try {
      const res = await api.registerPhone(phone, name, password);
      applySession(res.token, res.user);
      setScreen('home');
    } catch (e) {
      showToast(e.message);
    } finally {
      setAuthLoading(false);
    }
  }, [showToast]);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    setUser(null);
    setScreen('auth');
  }, []);

  const navigate = useCallback((to) => setScreen(to), []);

  // ── Опросы ──────────────────────────────────────────────────────
  const loadMyPolls = useCallback(async (force = false) => {
    // Не дёргаем сервер заново, если список уже свежий (загружен < 8 сек назад) —
    // это убирает лишний round-trip при каждом возврате на главную
    if (!force && Date.now() - lastPollsLoadRef.current < 8000) return;
    lastPollsLoadRef.current = Date.now();
    setPollsLoading(true);
    try {
      const polls = await api.myPolls();
      setMyPolls(polls);
    } catch (e) {
      showToast('Не удалось загрузить опросы');
    } finally {
      setPollsLoading(false);
    }
  }, [showToast]);

  // Удаляем из своего списка — сразу убираем из UI, не дожидаясь перезагрузки
  const deletePollFromList = useCallback(async (pollId) => {
    try {
      await api.deletePoll(pollId);
      setMyPolls(prev => prev.filter(p => p._id !== pollId));
      showToast('Опрос удалён');
    } catch (e) {
      showToast(e.message || 'Не удалось удалить опрос');
    }
  }, [showToast]);

  // Быстрое редактирование названия/категории — доступно, пока нет ни одного голоса
  const updatePollQuick = useCallback(async (pollId, data) => {
    try {
      const res = await api.updatePoll(pollId, data);
      setMyPolls(prev => prev.map(p => p._id === pollId ? { ...p, ...data } : p));
      return true;
    } catch (e) {
      showToast(e.message || 'Не удалось изменить опрос');
      return false;
    }
  }, [showToast]);

  // Открываем опрос организатора для управления вариантами (только пока нет голосов) —
  // ведём в тот же визард создания, сразу на шаг с карточками
  const openPollForEdit = useCallback(async (pollId) => {
    try {
      const poll = await api.getPoll(pollId);
      setActivePoll(poll);
      setPollDraft({
        scenario: poll.scenario,
        title: poll.title,
        category: poll.category,
        step: 3,
        votingDuration: poll.votingDurationMinutes,
        targetParticipants: poll.targetParticipants,
      });
      setScreen('create');
    } catch (e) {
      showToast('Не удалось открыть опрос для редактирования');
    }
  }, [showToast]);

  useEffect(() => {
    if (screen === 'home') loadMyPolls();
  }, [screen, loadMyPolls]);

  const createPoll = useCallback(async (title, category, scenario, targetParticipants = 2) => {
    try {
      const res = await api.createPoll(title, category, scenario, targetParticipants);
      setActivePoll(res.poll);
      setMyPolls(prev => [{
        _id: res.poll._id, title: res.poll.title, category: res.poll.category,
        status: 'draft', cardsCount: 0, participantsCount: res.poll.participants.length,
        targetParticipants, progress: 0, votesCount: 0,
        sessionCode: res.poll.sessionCode, createdBy: res.poll.createdBy,
        createdAt: res.poll.createdAt, votingEndsAt: null,
      }, ...prev]);
      return res.poll;
    } catch (e) {
      showToast(e.message);
      return null;
    }
  }, [showToast]);

  const addCardToPoll = useCallback(async (pollId, title, description, imageBase64, links) => {
    try {
      const res = await api.addCard(pollId, title, description, imageBase64, links);
      // Сервер уже вернул добавленную карточку — не делаем второй запрос за всем опросом целиком,
      // просто дописываем карточку в уже имеющиеся данные
      setActivePoll(prev => prev ? { ...prev, cards: [...prev.cards, res.card] } : prev);
      return true;
    } catch (e) {
      showToast(e.message);
      return false;
    }
  }, [showToast]);

  const openPoll = useCallback(async (pollId) => {
    setPollLoading(true);
    try {
      // Запрашиваем опрос и свои голоса параллельно, а не по очереди —
      // они не зависят друг от друга, экономим один полный round-trip
      const [poll, myVotes] = await Promise.all([
        api.getPoll(pollId),
        api.myVotes(pollId).catch(() => []),
      ]);
      setActivePoll(poll);
      setMatchCard(null);

      if (poll.status === 'completed') {
        const res = await api.results(pollId);
        setResults(res);
        setScreen('results');
      } else if (poll.status !== 'active') {
        // Опрос ещё не запущен — ведём добавлять/дополнять варианты,
        // доступно и организатору, и присоединившимся участникам (совместный сценарий)
        setPollDraft({
          scenario: poll.scenario,
          title: poll.title,
          category: poll.category,
          step: 3,
          votingDuration: poll.votingDurationMinutes,
          targetParticipants: poll.targetParticipants,
        });
        setScreen('create');
      } else {
        // Голосование уже идёт — не начинаем заново, а продолжаем
        // с первой карточки, за которую ещё не проголосовали
        const votedCardIds = new Set(myVotes.map(v => String(v.cardId)));
        const nextIdx = poll.cards.findIndex(c => !votedCardIds.has(String(c._id)));

        if (nextIdx === -1) {
          // Уже проголосовали за все карточки — смотрим текущие результаты
          const res = await api.results(pollId);
          setResults(res);
          setScreen('results');
        } else {
          setCardIdx(nextIdx);
          setVotes({});
          setScreen('voting');
        }
      }
    } catch (e) {
      showToast('Опрос не найден');
    } finally {
      setPollLoading(false);
    }
  }, [showToast]);

  const joinByCode = useCallback(async (code) => {
    try {
      const res = await api.joinPoll(code);
      const poll = res.poll;
      setActivePoll(poll);
      showToast('Вы присоединились к опросу');

      if (poll.status === 'completed') {
        const r = await api.results(poll._id);
        setResults(r);
        setScreen('results');
      } else if (poll.status !== 'active') {
        // Опрос ещё не запущен (совместный сценарий) — присоединившийся
        // тоже может сразу добавлять свои варианты
        setPollDraft({
          scenario: poll.scenario,
          title: poll.title,
          category: poll.category,
          step: 3,
          votingDuration: poll.votingDurationMinutes,
          targetParticipants: poll.targetParticipants,
        });
        setScreen('create');
      } else {
        const myVotes = await api.myVotes(poll._id);
        const votedCardIds = new Set(myVotes.map(v => String(v.cardId)));
        const nextIdx = poll.cards.findIndex(c => !votedCardIds.has(String(c._id)));
        if (nextIdx === -1) {
          const r = await api.results(poll._id);
          setResults(r);
          setScreen('results');
        } else {
          setCardIdx(nextIdx);
          setVotes({});
          setScreen('voting');
        }
      }
    } catch (e) {
      showToast(e.message || 'Код не найден');
    }
  }, [showToast]);

  const enterVoting = useCallback(() => {
    setCardIdx(0);
    setVotes({});
    setMatchCard(null);
    setScreen('voting');
  }, []);

  const startVoting = useCallback(async (durationMinutes = 60) => {
    if (!activePoll) return;
    try {
      await api.startVoting(activePoll._id, durationMinutes);
      enterVoting();
    } catch (e) {
      showToast(e.message);
    }
  }, [activePoll, showToast, enterVoting]);

  const castVote = useCallback(async (cardId, vote) => {
    if (!activePoll) return 'advance';
    setVotes(v => ({ ...v, [cardId]: vote }));
    try {
      const res = await api.submitVote(activePoll._id, cardId, vote === 'like' ? true : vote === 'discuss' ? 'maybe' : false);
      // Мэтч определяем по ответу сервера (если реализовано) — иначе просто advance
      if (res?.isMatch) {
        const card = activePoll.cards.find(c => c._id === cardId);
        setMatchCard(card);
        return 'match';
      }
    } catch (e) {
      showToast('Голос не сохранён — нет сети');
    }
    return 'advance';
  }, [activePoll, showToast]);

  const nextCard = useCallback(() => {
    if (!activePoll) return;
    if (cardIdx + 1 >= activePoll.cards.length) {
      loadResults();
      setScreen('results');
    } else {
      setCardIdx(i => i + 1);
    }
  }, [cardIdx, activePoll]);

  const dismissMatch = useCallback((goToResults) => {
    setMatchCard(null);
    if (goToResults) { loadResults(); setScreen('results'); }
    else nextCard();
  }, [nextCard]);

  const loadResults = useCallback(async () => {
    if (!activePoll) return;
    try {
      const res = await api.results(activePoll._id);
      setResults(res);
    } catch (e) {
      showToast('Не удалось загрузить результаты');
    }
  }, [activePoll, showToast]);

  return {
    screen, setScreen, navigate,
    onboardIdx, setOnboardIdx,
    user, login, register, logout, authLoading,
    myPolls, pollsLoading, loadMyPolls, deletePollFromList, updatePollQuick, openPollForEdit,
    pollDraft, setPollDraft,
    activePoll, setActivePoll, pollLoading, createPoll, addCardToPoll, openPoll, joinByCode, startVoting, enterVoting,
    cardIdx, setCardIdx, votes, castVote, nextCard,
    matchCard, dismissMatch,
    results,
    billing, setBilling,
    toast, showToast,
    isInTelegram,
  };
}
