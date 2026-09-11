import session from 'express-session'
import { db } from './db.js'

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

const upsertStmt = db.prepare(
  'INSERT INTO sessions (sid, expires, data) VALUES (?, ?, ?) ' +
  'ON CONFLICT(sid) DO UPDATE SET expires = excluded.expires, data = excluded.data'
)
const getStmt = db.prepare('SELECT expires, data FROM sessions WHERE sid = ?')
const destroyStmt = db.prepare('DELETE FROM sessions WHERE sid = ?')
const clearExpiredStmt = db.prepare('DELETE FROM sessions WHERE expires < ?')

// Minimal express-session Store backed directly by the app's SQLite file, so
// sessions survive process restarts on free-tier hosts that sleep/redeploy.
export class SQLiteSessionStore extends session.Store {
  get(sid, callback) {
    try {
      const row = getStmt.get(sid)
      if (!row || row.expires < Date.now()) return callback(null, null)
      callback(null, JSON.parse(row.data))
    } catch (err) {
      callback(err)
    }
  }

  set(sid, sessionData, callback) {
    try {
      const maxAge = sessionData.cookie?.maxAge ?? SESSION_TTL_MS
      const expires = Date.now() + maxAge
      upsertStmt.run(sid, expires, JSON.stringify(sessionData))
      callback?.(null)
    } catch (err) {
      callback?.(err)
    }
  }

  destroy(sid, callback) {
    try {
      destroyStmt.run(sid)
      callback?.(null)
    } catch (err) {
      callback?.(err)
    }
  }

  touch(sid, sessionData, callback) {
    this.set(sid, sessionData, callback)
  }
}

// Periodically sweep expired sessions.
setInterval(() => clearExpiredStmt.run(Date.now()), 60 * 60 * 1000).unref()
