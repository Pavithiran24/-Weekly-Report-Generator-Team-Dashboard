import api from './axios'

export const assistantApi = {
  chat: (data) => api.post('/assistant/chat', data),
}