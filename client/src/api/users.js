import { api } from './client.js'

export const listUsers = () => api.get('/users')
