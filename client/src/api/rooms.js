import { api } from './client.js'

export const listRooms = (activeOnly = false) => api.get(`/rooms${activeOnly ? '?active=1' : ''}`)
export const createRoom = (room) => api.post('/rooms', room)
export const updateRoom = (id, fields) => api.patch(`/rooms/${id}`, fields)
export const getRoomHistory = (id) => api.get(`/rooms/${id}/inspections`)
