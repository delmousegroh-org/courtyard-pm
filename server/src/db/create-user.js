import bcrypt from 'bcryptjs'
import { db } from './db.js'

const [, , username, password, displayName] = process.argv

if (!username || !password) {
  console.error('Usage: node src/db/create-user.js <username> <password> [display name]')
  process.exit(1)
}

const passwordHash = bcrypt.hashSync(password, 12)

const insert = db.prepare(
  'INSERT INTO users (username, password_hash, display_name) VALUES (?, ?, ?) ' +
  'ON CONFLICT(username) DO UPDATE SET password_hash = excluded.password_hash, display_name = excluded.display_name'
)
insert.run(username, passwordHash, displayName || username)

console.log(`User ready: ${username}`)
