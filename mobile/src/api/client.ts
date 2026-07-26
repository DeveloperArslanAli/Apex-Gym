import axios from 'axios';

// 10.0.2.2 points to host localhost in Android Emulator. Modify this for local wifi testing.
export let API_BASE_URL = 'https://fair-papers-retire.loca.lt/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function updateBaseUrl(newUrl: string) {
  API_BASE_URL = newUrl;
  apiClient.defaults.baseURL = newUrl;
}

export function setAuthToken(token: string | null) {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
}
