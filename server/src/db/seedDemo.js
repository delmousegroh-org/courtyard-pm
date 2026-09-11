// Demo/mock data seeder — NOT run automatically on server boot (see index.js).
// Populates the two real login users and a full trimester-by-trimester history
// of inspections from Jan 1 of the current year through today, so the
// dashboard/reports UI has something realistic to look at while we build it.
//
// Run with: npm run seed:demo
import bcrypt from 'bcryptjs'
import { db, transaction } from './db.js'
import { seed } from './seed.js'

// Deterministic PRNG so re-running produces the same mock data.
function mulberry32(seed) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(20260101)
const pick = (arr) => arr[Math.floor(rand() * arr.length)]
const chance = (p) => rand() < p

const REPAIR_NOTES = [
  'Filter dirty, replaced',
  'Bulb out, replaced',
  'Caulking cracked around tub',
  'Squeaky hinge, oiled',
  'Loose handle, tightened',
  'Remote batteries dead, replaced',
  'Carpet stain, spot cleaned',
  'Drape hem came loose, resewn',
  'Outlet cover cracked, replaced',
  'Faucet dripping, washer replaced',
  'Grout worn, needs recaulk next visit',
  'Fan noisy at high speed',
  'Paint scuff on door frame',
  'Lock sticking, lubricated',
]
const OVERALL_NOTES = [
  'General wear only, nothing urgent',
  'Room in great shape',
  'Recommend AC service next quarter',
  'Housekeeping flagged carpet for deep clean',
  'Ready for next occupancy',
  'Minor cosmetic touch-ups only',
  null,
  null,
  null,
]

const REPAIR_CODES = ['1', '2', '3', '4']

function randomDateInRange(start, end) {
  const t = start.getTime() + rand() * (end.getTime() - start.getTime())
  return new Date(t).toISOString().slice(0, 10)
}

function trimesterRange(year, trimester) {
  const starts = { 1: 0, 2: 4, 3: 8 }
  const start = new Date(year, starts[trimester], 1)
  const end = new Date(year, starts[trimester] + 4, 0) // last day of 4th month in range
  return { start, end }
}

function ensureUsers() {
  const upsert = db.prepare(
    `INSERT INTO users (username, password_hash, display_name) VALUES (?, ?, ?)
     ON CONFLICT(username) DO UPDATE SET password_hash = excluded.password_hash, display_name = excluded.display_name`
  )
  upsert.run('del', bcrypt.hashSync('open', 12), 'Del')
  upsert.run('gary', bcrypt.hashSync('open', 12), 'Gary')
  return {
    del: db.prepare('SELECT id FROM users WHERE username = ?').get('del').id,
    gary: db.prepare('SELECT id FROM users WHERE username = ?').get('gary').id,
  }
}

function pickTechnicians(userIds) {
  // ~30% of visits are done by both people together, otherwise a solo visit.
  if (chance(0.3)) return [userIds.del, userIds.gary]
  return [pick([userIds.del, userIds.gary])]
}

function clearInspections() {
  db.exec('DELETE FROM inspections') // cascades to inspection_items + inspection_technicians
}

function seedTrimester({ year, trimester, rooms, checklistItems, userIds, dateWindow, completionRate, quickEntryRate }) {
  const insertInspection = db.prepare(`
    INSERT INTO inspections (room_id, year, trimester, date_completed, is_quick_entry, overall_notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  const insertTechnician = db.prepare(
    'INSERT INTO inspection_technicians (inspection_id, user_id) VALUES (?, ?)'
  )
  const insertItem = db.prepare(`
    INSERT INTO inspection_items (inspection_id, checklist_item_id, status, repair_code, note)
    VALUES (?, ?, ?, ?, ?)
  `)

  let completedCount = 0
  for (const room of rooms) {
    if (!chance(completionRate)) continue
    completedCount += 1

    const dateCompleted = randomDateInRange(dateWindow.start, dateWindow.end)
    const isQuickEntry = chance(quickEntryRate)
    const overallNotes = isQuickEntry ? null : pick(OVERALL_NOTES)

    const result = insertInspection.run(room.id, year, trimester, dateCompleted, isQuickEntry ? 1 : 0, overallNotes)
    const inspectionId = result.lastInsertRowid

    for (const userId of pickTechnicians(userIds)) {
      insertTechnician.run(inspectionId, userId)
    }

    if (isQuickEntry) continue

    // ~15% of full inspections turn up one or more repair items.
    const roomHasIssues = chance(0.15)
    let issuesLeft = roomHasIssues ? 1 + Math.floor(rand() * 3) : 0

    for (const item of checklistItems) {
      const flagAsIssue = issuesLeft > 0 && chance(0.08)
      if (flagAsIssue) {
        issuesLeft -= 1
        insertItem.run(inspectionId, item.id, 'needs_repair', pick(REPAIR_CODES), pick(REPAIR_NOTES))
      } else {
        insertItem.run(inspectionId, item.id, 'ok', null, null)
      }
    }
  }
  return completedCount
}

export function seedDemo() {
  seed() // make sure checklist template + room list exist first

  const rooms = db.prepare('SELECT id FROM rooms WHERE is_active = 1 ORDER BY id').all()
  const checklistItems = db.prepare('SELECT id FROM checklist_items ORDER BY id').all()

  transaction(() => {
    const userIds = ensureUsers()
    clearInspections()

    const today = new Date()
    const year = today.getFullYear()

    // Trimester 1 (Jan-Apr) and 2 (May-Aug): fully in the past, essentially done.
    for (const trimester of [1, 2]) {
      const { start, end } = trimesterRange(year, trimester)
      const count = seedTrimester({
        year,
        trimester,
        rooms,
        checklistItems,
        userIds,
        dateWindow: { start, end: end > today ? today : end },
        completionRate: 0.97,
        quickEntryRate: 0.1,
      })
      console.log(`Trimester ${trimester} ${year}: ${count}/${rooms.length} rooms seeded`)
    }

    // Trimester 3 (Sep-Dec): in progress — only up through today, partially done.
    const { start } = trimesterRange(year, 3)
    if (today >= start) {
      const count = seedTrimester({
        year,
        trimester: 3,
        rooms,
        checklistItems,
        userIds,
        dateWindow: { start, end: today },
        completionRate: 0.22,
        quickEntryRate: 0.05,
      })
      console.log(`Trimester 3 ${year} (in progress, through ${today.toISOString().slice(0, 10)}): ${count}/${rooms.length} rooms seeded`)
    }
  })

  console.log('Demo users ready: del/open, gary/open')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedDemo()
}
