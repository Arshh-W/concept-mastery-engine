import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

// --- THE INTERCEPTOR ---
// This runs BEFORE every request is sent
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token'); 
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const gameApi = {
  // --- AUTH ENTRIES ---
  login: (credentials) => 
    apiClient.post('/auth/login', credentials),
    
  register: (userData) => 
    apiClient.post('/auth/register', userData),

  // --- CHALLENGES ---
  getChallenges: (domain) => 
    apiClient.get(`/game/challenges/${domain}`),

  getMasteryChallenges: (domain) => 
    apiClient.get(`/game/challenges/${domain}/mastery`),

  // --- SESSION MANAGEMENT ---
  startSession: (domain, challengeId) => 
    apiClient.post('/game/session/start', { domain, challenge_id: challengeId }),

  submitAction: (token, action, value) => 
    apiClient.post('/game/session/step', { token, action, value }),

  getSessionState: (token) => 
    apiClient.get(`/game/session/${token}/state`),

  endSession: (token) => 
    apiClient.post(`/game/session/${token}/end`),

  // --- USER DATA ---
  getUserProgress: () => 
    apiClient.get('/game/user/progress'),

  getNextRecommendation: () => 
    apiClient.get('/game/user/next'),
};