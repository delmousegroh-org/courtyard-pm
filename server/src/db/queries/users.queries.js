import { db } from '../db.js'

export function findUserByUsername(username) {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username)
}

export function findUserById(id) {
  return db.prepare('SELECT id, username, display_name FROM users WHERE id = ?').get(id)
}

export function listUsers() {
  return db.prepare('SELECT id, username, display_name FROM users ORDER BY display_name').all()
}
