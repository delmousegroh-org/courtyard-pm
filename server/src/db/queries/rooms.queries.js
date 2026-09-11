import { db } from '../db.js'

export function listRooms({ activeOnly = false } = {}) {
  const sql = activeOnly
    ? 'SELECT * FROM rooms WHERE is_active = 1 ORDER BY floor, sort_order, room_number'
    : 'SELECT * FROM rooms ORDER BY floor, sort_order, room_number'
  return db.prepare(sql).all()
}

export function getRoomById(id) {
  return db.prepare('SELECT * FROM rooms WHERE id = ?').get(id)
}

export function createRoom({ roomNumber, floor, notes }) {
  const result = db
    .prepare('INSERT INTO rooms (room_number, floor, notes) VALUES (?, ?, ?)')
    .run(roomNumber, floor, notes ?? null)
  return getRoomById(result.lastInsertRowid)
}

export function updateRoom(id, { roomNumber, floor, notes, isActive }) {
  const existing = getRoomById(id)
  if (!existing) return null
  db.prepare(
    'UPDATE rooms SET room_number = ?, floor = ?, notes = ?, is_active = ? WHERE id = ?'
  ).run(
    roomNumber ?? existing.room_number,
    floor ?? existing.floor,
    notes !== undefined ? notes : existing.notes,
    isActive !== undefined ? (isActive ? 1 : 0) : existing.is_active,
    id
  )
  return getRoomById(id)
}
