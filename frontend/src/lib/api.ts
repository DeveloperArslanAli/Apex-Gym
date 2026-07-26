export const API_BASE_URL = 'http://localhost:3001/api';
export const WS_BASE_URL = 'http://localhost:3001';

export function setToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('gym_token', token);
  }
}

export function getToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('gym_token');
  }
  return null;
}

export function setUser(user: any) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('gym_user', JSON.stringify(user));
  }
}

export function getUser() {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem('gym_user');
    return user ? JSON.parse(user) : null;
  }
  return null;
}

export function logout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('gym_token');
    localStorage.removeItem('gym_user');
  }
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      logout();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${response.status}`);
  }

  return response.json();
}
