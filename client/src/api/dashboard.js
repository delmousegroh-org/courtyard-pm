import { api } from './client.js'

export const getDashboard = (year, trimester) => api.get(`/dashboard?year=${year}&trimester=${trimester}`)
