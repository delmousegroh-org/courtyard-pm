import { db, transaction } from '../db.js'

const itemsForInspectionStmt = db.prepare(`
  SELECT ii.id, ii.checklist_item_id, ii.status, ii.repair_code, ii.note,
         ci.label, ci.category_id, cc.name AS category_name
  FROM inspection_items ii
  JOIN checklist_items ci ON ci.id = ii.checklist_item_id
  JOIN checklist_categories cc ON cc.id = ci.category_id
  WHERE ii.inspection_id = ?
  ORDER BY cc.sort_order, ci.sort_order
`)

const techniciansForInspectionStmt = db.prepare(`
  SELECT u.id, u.username, u.display_name
  FROM inspection_technicians it
  JOIN users u ON u.id = it.user_id
  WHERE it.inspection_id = ?
  ORDER BY u.display_name
`)

function attachItems(inspection) {
  if (!inspection) return null
  return {
    ...inspection,
    items: itemsForInspectionStmt.all(inspection.id),
    technicians: techniciansForInspectionStmt.all(inspection.id),
  }
}

export function getInspectionById(id) {
  const inspection = db.prepare('SELECT * FROM inspections WHERE id = ?').get(id)
  return attachItems(inspection)
}

export function getInspectionByRoomPeriod(roomId, year, trimester) {
  const inspection = db
    .prepare('SELECT * FROM inspections WHERE room_id = ? AND year = ? AND trimester = ?')
    .get(roomId, year, trimester)
  return attachItems(inspection)
}

export function listInspectionsForRoom(roomId) {
  return db
    .prepare('SELECT * FROM inspections WHERE room_id = ? ORDER BY year DESC, trimester DESC')
    .all(roomId)
    .map(attachItems)
}

const insertInspectionStmt = db.prepare(`
  INSERT INTO inspections (room_id, year, trimester, date_completed, is_quick_entry, overall_notes)
  VALUES (?, ?, ?, ?, ?, ?)
`)

const updateInspectionStmt = db.prepare(`
  UPDATE inspections
  SET date_completed = ?, is_quick_entry = ?, overall_notes = ?, updated_at = datetime('now')
  WHERE id = ?
`)

const deleteItemsStmt = db.prepare('DELETE FROM inspection_items WHERE inspection_id = ?')
const deleteTechniciansStmt = db.prepare('DELETE FROM inspection_technicians WHERE inspection_id = ?')
const insertTechnicianStmt = db.prepare(
  'INSERT OR IGNORE INTO inspection_technicians (inspection_id, user_id) VALUES (?, ?)'
)

function setTechnicians(inspectionId, technicianIds) {
  deleteTechniciansStmt.run(inspectionId)
  const ids = [...new Set((technicianIds || []).filter(Boolean))].slice(0, 2)
  for (const userId of ids) {
    insertTechnicianStmt.run(inspectionId, userId)
  }
}

const insertItemStmt = db.prepare(`
  INSERT INTO inspection_items (inspection_id, checklist_item_id, status, repair_code, note)
  VALUES (?, ?, ?, ?, ?)
`)

const findInspectionStmt = db.prepare(
  'SELECT id, is_quick_entry FROM inspections WHERE room_id = ? AND year = ? AND trimester = ?'
)

// Full create/replace: used by the room inspection form. Replaces the
// period's inspection (and all its items) if one already exists.
export function upsertFullInspection({ roomId, year, trimester, dateCompleted, overallNotes, technicianIds, items }) {
  return transaction(() => {
    const existing = findInspectionStmt.get(roomId, year, trimester)

    let inspectionId
    if (existing) {
      inspectionId = existing.id
      updateInspectionStmt.run(dateCompleted, 0, overallNotes ?? null, inspectionId)
      deleteItemsStmt.run(inspectionId)
    } else {
      const result = insertInspectionStmt.run(roomId, year, trimester, dateCompleted, 0, overallNotes ?? null)
      inspectionId = result.lastInsertRowid
    }

    setTechnicians(inspectionId, technicianIds)

    for (const item of items) {
      insertItemStmt.run(inspectionId, item.checklistItemId, item.status, item.repairCode ?? null, item.note ?? null)
    }

    return inspectionId
  })
}

// Fast backdate entry: room + date only, no item detail. Leaves an existing
// full inspection's items untouched if one is already there.
export function upsertQuickInspection({ roomId, year, trimester, dateCompleted, technicianIds }) {
  return transaction(() => upsertQuickInspectionUnwrapped({ roomId, year, trimester, dateCompleted, technicianIds }))
}

export function bulkQuickUpsert(year, trimester, entries, technicianIds) {
  return transaction(() =>
    entries.map((entry) =>
      upsertQuickInspectionUnwrapped({
        roomId: entry.roomId,
        year,
        trimester,
        dateCompleted: entry.dateCompleted,
        technicianIds,
      })
    )
  )
}

// Same logic as upsertQuickInspection but without its own nested transaction,
// since bulkQuickUpsert already wraps every entry in one.
function upsertQuickInspectionUnwrapped({ roomId, year, trimester, dateCompleted, technicianIds }) {
  const existing = findInspectionStmt.get(roomId, year, trimester)

  let inspectionId
  if (existing) {
    updateInspectionStmt.run(dateCompleted, existing.is_quick_entry, null, existing.id)
    inspectionId = existing.id
  } else {
    const result = insertInspectionStmt.run(roomId, year, trimester, dateCompleted, 1, null)
    inspectionId = result.lastInsertRowid
  }

  setTechnicians(inspectionId, technicianIds)
  return inspectionId
}

export function updateInspectionFields(id, { dateCompleted, overallNotes }) {
  const existing = db.prepare('SELECT * FROM inspections WHERE id = ?').get(id)
  if (!existing) return null
  updateInspectionStmt.run(
    dateCompleted ?? existing.date_completed,
    existing.is_quick_entry,
    overallNotes !== undefined ? overallNotes : existing.overall_notes,
    id
  )
  return getInspectionById(id)
}

export function deleteInspection(id) {
  return db.prepare('DELETE FROM inspections WHERE id = ?').run(id)
}

export function getDashboardData(year, trimester) {
  const rows = db
    .prepare(
      `
    SELECT r.id AS room_id, r.room_number, r.floor,
           i.id AS inspection_id, i.date_completed, i.is_quick_entry, i.overall_notes,
           (SELECT COUNT(*) FROM inspection_items ii WHERE ii.inspection_id = i.id AND ii.status = 'needs_repair') AS needs_repair_count,
           (SELECT COUNT(*) FROM inspection_items ii WHERE ii.inspection_id = i.id) AS item_count
    FROM rooms r
    LEFT JOIN inspections i ON i.room_id = r.id AND i.year = ? AND i.trimester = ?
    WHERE r.is_active = 1
    ORDER BY r.floor, r.sort_order, r.room_number
  `
    )
    .all(year, trimester)

  const rooms = rows.map((row) => {
    const needsRepairCount = row.needs_repair_count || 0
    let status = 'not_started'
    if (row.inspection_id) {
      status = needsRepairCount > 0 ? 'needs_repair' : 'ok'
    }
    const issues =
      needsRepairCount > 0
        ? itemsForInspectionStmt
            .all(row.inspection_id)
            .filter((item) => item.status === 'needs_repair')
            .map((item) => ({
              label: item.label,
              categoryId: item.category_id,
              categoryName: item.category_name,
              note: item.note,
              repairCode: item.repair_code,
            }))
        : []

    return {
      roomId: row.room_id,
      roomNumber: row.room_number,
      floor: row.floor,
      status,
      dateCompleted: row.date_completed,
      isQuickEntry: !!row.is_quick_entry,
      overallNotes: row.overall_notes,
      technicians: row.inspection_id ? techniciansForInspectionStmt.all(row.inspection_id) : [],
      needsRepairCount,
      itemCount: row.item_count || 0,
      issues,
    }
  })

  return {
    totalRooms: rooms.length,
    completedRooms: rooms.filter((r) => r.status !== 'not_started').length,
    okRooms: rooms.filter((r) => r.status === 'ok').length,
    needsRepairRooms: rooms.filter((r) => r.status === 'needs_repair').length,
    notStartedRooms: rooms.filter((r) => r.status === 'not_started').length,
    rooms,
  }
}
