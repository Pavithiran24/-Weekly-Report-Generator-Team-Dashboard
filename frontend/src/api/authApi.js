import api from './axios'

export const loginUser = (credentials) => api.post('/auth/login', new URLSearchParams(credentials), {
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
})
export const registerUser = (data) => api.post('/auth/register', data)
export const getMe = () => api.get('/auth/profile')
