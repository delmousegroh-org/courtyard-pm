// Online backup of the SQLite database — safe to run while the server is up
// (uses SQLite's own backup API, which handles WAL correctly).
//
// Run with: npm run backup -w server
// Writes to server/backups/app-<timestamp>.db, keeping the last 14 by default.
import { backup } from 'node:sqlite'
import { db } from '../src/db/db.js'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const backupsDir = process.env.BACKUP_DIR || path.join(__dirname, '../backups')
const keepCount = Number(process.env.BACKUP_KEEP_COUNT || 14)

fs.mkdirSync(backupsDir, { recursive: true })

const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
const destPath = path.join(backupsDir, `app-${timestamp}.db`)

await backup(db, destPath)
console.log(`Backup written to ${destPath}`)

const backups = fs
  .readdirSync(backupsDir)
  .filter((f) => f.startsWith('app-') && f.endsWith('.db'))
  .sort()

for (const old of backups.slice(0, -keepCount)) {
  fs.unlinkSync(path.join(backupsDir, old))
  console.log(`Pruned old backup ${old}`)
}
