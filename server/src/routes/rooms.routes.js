import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { listRooms, createRoom, updateRoom, getRoomById } from '../db/queries/rooms.queries.js'
import { listInspectionsForRoom } from '../db/queries/inspections.queries.js'

export const roomsRouter = Router()
roomsRouter.use(requireAuth)

roomsRouter.get('/', (req, res) => {
  const activeOnly = req.query.active === '1'
  res.json(listRooms({ activeOnly }))
})

roomsRouter.post('/', (req, res) => {
  const { roomNumber, floor, notes } = req.body || {}
  if (!roomNumber || !floor) {
    return res.status(400).json({ error: 'roomNumber and floor are required' })
  }
  res.status(201).json(createRoom({ roomNumber, floor, notes }))
})

roomsRouter.patch('/:id', (req, res) => {
  const room = updateRoom(Number(req.params.id), req.body || {})
  if (!room) return res.status(404).json({ error: 'Room not found' })
  res.json(room)
})

roomsRouter.get('/:id/inspections', (req, res) => {
  const room = getRoomById(Number(req.params.id))
  if (!room) return res.status(404).json({ error: 'Room not found' })
  res.json({ room, inspections: listInspectionsForRoom(room.id) })
})
