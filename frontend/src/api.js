const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Базовый fetch-хелпер с авторизацией
async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Ошибка сервера');
  }

  return data;
}

export const authApi = {
  register: (email, password) =>
    request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  login: (email, password) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
};

export const userApi = {
  me: () => request('/api/user/me'),
};

export const usageApi = {
  track: () =>
    request('/api/usage/track', { method: 'POST' }),

  today: () => request('/api/usage/today'),
};
