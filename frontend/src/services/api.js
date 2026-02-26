import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000
});

//Interceptor to attach token to every request, if it exists
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

// Optional response safety
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error("API Error:", error.response.data);
    } else if (error.request) {
      console.error("No response from backend.");
    } else {
      console.error("Request setup error:", error.message);
    }
    return Promise.reject(error);
  }
);

export const gameApi = {
  //Auth Engines
  login: (credentials) => 
    apiClient.post('/auth/login', credentials),
    
  register: (userData) => 
    apiClient.post('/auth/register', userData),

  // Challenges
  getChallenges: (domain) =>
    apiClient.get(`/game/challenges/${domain}`),

  // alias used by os.jsx / dbms.jsx — returns challenges WITH mastery annotated
  getMasteryChallenges: (domain) =>
    apiClient.get(`/game/challenges/${domain}`),

  //Session Management
  startSession: (challengeSlug) =>
    apiClient.post('/game/session/start', { challenge_slug: challengeSlug }),

  submitAction: (sessionToken, action, params = {}) =>
    apiClient.post('/game/session/step', { sessionToken, action, params }),

  getSessionState: (token) =>
    apiClient.get(`/game/session/${token}/state`),

  endSession: (token) =>
    apiClient.post(`/game/session/${token}/end`),

  //User Data
  getUserProgress: () => 
    apiClient.get('/game/user/progress'),

  getNextRecommendation: () => 
    apiClient.get('/game/user/next'),
};

export default apiClient;