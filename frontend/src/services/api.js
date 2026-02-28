import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000
});

// Attach auth token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) console.error("API Error:", error.response.data);
    else if (error.request) console.error("No response from backend.");
    else console.error("Request setup error:", error.message);
    return Promise.reject(error);
  }
);

export const gameApi = {
  // Auth
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),

  // Challenges
  getChallenges: (domain) => apiClient.get(`/game/challenges/${domain}`),
  getMasteryChallenges: (domain) => apiClient.get(`/game/challenges/${domain}`),

  // Session Management
  startSession: (challengeSlug) =>
    apiClient.post('/game/session/start', { challenge_slug: challengeSlug }),
  submitAction: (sessionToken, action, params = {}) =>
    apiClient.post('/game/session/step', { sessionToken, action, params }),
  getSessionState: (token) => apiClient.get(`/game/session/${token}/state`),
  endSession: (token) => apiClient.post(`/game/session/${token}/end`),

  // User Data
  getUserProgress: () => apiClient.get('/game/user/progress'),
  getNextRecommendation: () => apiClient.get('/game/user/next'),

  // ── Adaptive AI ─────────────────────────────────────────────────────────

  // Get AI hint based on current session performance
  getAdaptiveHint: (sessionToken, challengeSlug, hintLevel = 0) =>
    apiClient.get('/game/adaptive/hint', {
      params: { session_token: sessionToken, challenge_slug: challengeSlug, hint_level: hintLevel },
    }),

  // Gemini 2.5 Flash feedback after 2-3 consecutive failures
  getFailureFeedback: (challengeSlug, recentFailures, simState = {}, goal = {}) =>
    apiClient.post('/game/feedback/failures', {
      challenge_slug: challengeSlug,
      recent_failures: recentFailures,
      sim_state: simState,
      goal,
    }),

  // Recommended difficulty for a competency (from BKT mastery)
  getAdaptiveDifficulty: (competencySlug) =>
    apiClient.get(`/game/adaptive/difficulty/${competencySlug}`),

  // Recommended challenge type (mcq / simulator / visual / debug)
  getAdaptiveChallengeType: (competencySlug) =>
    apiClient.get(`/game/adaptive/challenge-type/${competencySlug}`),

  // Post-session weak-spot analysis
  analyzeSession: (sessionToken) =>
    apiClient.post('/game/adaptive/analyze', { session_token: sessionToken }),
};

export default apiClient;
