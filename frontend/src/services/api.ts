import axios from 'axios';
import { useSettingsStore } from '../stores/useSettingsStore';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Update baseURL when backendUrl changes
useSettingsStore.subscribe((state) => {
  const url = state.backendUrl;
  if (url && url !== 'http://localhost:8000') {
    api.defaults.baseURL = `${url}/api/v1`;
  } else {
    api.defaults.baseURL = '/api/v1';
  }
});

api.interceptors.request.use((config) => {
  const apiKey = useSettingsStore.getState().geminiApiKey;
  if (apiKey) {
    config.headers['x-gemini-api-key'] = apiKey;
  }
  return config;
});

export default api;
