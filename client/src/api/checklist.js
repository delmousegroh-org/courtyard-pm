import { api } from './client.js'

export const getChecklistTemplate = () => api.get('/checklist-template')
