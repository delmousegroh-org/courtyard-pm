import { api } from './client.js'

export const getInspection = (id) => api.get(`/inspections/${id}`)
export const saveInspection = (payload) => api.post('/inspections', payload)
export const updateInspection = (id, fields) => api.patch(`/inspections/${id}`, fields)
export const deleteInspection = (id) => api.delete(`/inspections/${id}`)
export const quickBackdate = (payload) => api.post('/inspections/quick', payload)
export const bulkBackdate = (payload) => api.post('/inspections/bulk-quick', payload)
