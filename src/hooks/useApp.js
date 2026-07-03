import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { initTelegram, getInitData, getTelegramUserUnsafe, getStartParam, isInTelegram } from './useTelegram';

export function useApp() {
  const [screen, setScreen] = useState('loading');
  const [onboardIdx, setOnboardIdx] = useState(0);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [myPolls, setMyPolls] = useState([]);
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
  const loadMyPolls = useCallback(async () => {
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

  useEffect(() => {
    if (screen === 'home') loadMyPolls();
  }, [screen, loadMyPolls]);

  const createPoll = useCallback(async (title, category, scenario) => {
    try {
      const res = await api.createPoll(title, category, scenario);
      setActivePoll(res.poll);
      return res.poll;
    } catch (e) {
      showToast(e.message);
      return null;
    }
  }, [showToast]);

  const addCardToPoll = useCallback(async (pollId, title, description, imageBase64, links) => {
    try {
      await api.addCard(pollId, title, description, imageBase64, links);
      const updated = await api.getPoll(pollId);
      setActivePoll(updated);
      return true;
    } catch (e) {
      showToast(e.message);
      return false;
    }
  }, [showToast]);

  const openPoll = useCallback(async (pollId) => {
    setPollLoading(true);
    try {
      const poll = await api.getPoll(pollId);
      setActivePoll(poll);
      setCardIdx(0);
      setVotes({});
      setMatchCard(null);
      setScreen('voting');
    } catch (e) {
      showToast('Опрос не найден');
    } finally {
      setPollLoading(false);
    }
  }, [showToast]);

  const joinByCode = useCallback(async (code) => {
    try {
      const res = await api.joinPoll(code);
      setActivePoll(res.poll);
      setCardIdx(0);
      setVotes({});
      setScreen('voting');
      showToast('Вы присоединились к опросу');
    } catch (e) {
      showToast(e.message || 'Код не найден');
    }
  }, [showToast]);

  const startVoting = useCallback(async () => {
    if (!activePoll) return;
    try {
      await api.startVoting(activePoll._id);
      setCardIdx(0);
      setVotes({});
      setMatchCard(null);
      setScreen('voting');
    } catch (e) {
      showToast(e.message);
    }
  }, [activePoll, showToast]);

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
    myPolls, pollsLoading, loadMyPolls,
    pollDraft, setPollDraft,
    activePoll, setActivePoll, pollLoading, createPoll, addCardToPoll, openPoll, joinByCode, startVoting,
    cardIdx, setCardIdx, votes, castVote, nextCard,
    matchCard, dismissMatch,
    results,
    billing, setBilling,
    toast, showToast,
    isInTelegram,
  };
}
