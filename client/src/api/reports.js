import { api } from './client.js'

export const getReportSummary = (year, trimester) => api.get(`/reports/summary?year=${year}&trimester=${trimester}`)
