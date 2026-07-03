const API_URL = 'https://webpairs2-production.up.railway.app/api';

function getToken() {
  return localStorage.getItem('authToken');
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(API_URL + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
    }
    throw new Error(data.error || 'Ошибка сервера');
  }

  return data;
}

export const api = {
  // Auth
  loginTelegram: (initData) => request('/auth/telegram', { method: 'POST', body: { initData }, auth: false }),
  loginPhone:    (phone, password) => request('/auth/login', { method: 'POST', body: { phone, password }, auth: false }),
  registerPhone: (phone, name, password) => request('/auth/register', { method: 'POST', body: { phone, name, password }, auth: false }),
  profile:       () => request('/auth/profile'),

  // Polls
  myPolls:     () => request('/polls/mine'),
  createPoll:  (title, category, scenario, participants = []) =>
    request('/polls/create', { method: 'POST', body: { title, category, scenario, participants } }),
  joinPoll:    (sessionCode) => request('/polls/join', { method: 'POST', body: { sessionCode } }),
  getPoll:     (pollId) => request(`/polls/${pollId}`),
  addCard:     (pollId, title, description, imageBase64, links) =>
    request(`/polls/${pollId}/cards`, { method: 'POST', body: { title, description, imageBase64, links } }),
  deleteCard:  (pollId, cardId) => request(`/polls/${pollId}/cards/${cardId}`, { method: 'DELETE' }),
  startVoting: (pollId) => request(`/polls/${pollId}/start-voting`, { method: 'POST' }),

  // Votes
  submitVote: (pollId, cardId, vote) => request('/votes/vote', { method: 'POST', body: { pollId, cardId, vote } }),
  results:    (pollId) => request(`/votes/results/${pollId}`),
  myVotes:    (pollId) => request(`/votes/user-votes/${pollId}`),
};

export { API_URL };
