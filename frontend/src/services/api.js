import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10s timeout
});

// API Endpoints
export const api = {
  hcp: {
    search: (query = '') => client.get(`/api/hcp/search?query=${encodeURIComponent(query)}`),
    list: () => client.get('/api/hcp/list'),
    create: (data) => client.post('/api/hcp', data),
    get: (id) => client.get(`/api/hcp/${id}`),
    update: (id, data) => client.put(`/api/hcp/${id}`, data),
    delete: (id) => client.delete(`/api/hcp/${id}`),
  },
  interaction: {
    listProducts: () => client.get('/api/interaction/products'),
    listAll: () => client.get('/api/interaction'),
    create: (data) => client.post('/api/interaction', data),
    update: (id, data) => client.put(`/api/interaction/${id}`, data),
    get: (id) => client.get(`/api/interaction/${id}`),
    getHistory: (hcpId) => client.get(`/api/interaction/history/${hcpId}`),
    delete: (id) => client.delete(`/api/interaction/${id}`),
  },
  chat: {
    sendMessage: (message, sessionId = null, currentFormState = {}) => 
      client.post('/api/chat', { 
        message, 
        session_id: sessionId, 
        current_form_state: currentFormState 
      }),
  }
};

export default client;
