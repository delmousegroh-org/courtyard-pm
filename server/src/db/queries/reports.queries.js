import { db } from '../db.js'
import { getDashboardData } from './inspections.queries.js'

export function getReportSummary(year, trimester) {
  const dashboard = getDashboardData(year, trimester)

  const byFloorMap = new Map()
  for (const room of dashboard.rooms) {
    if (!byFloorMap.has(room.floor)) {
      byFloorMap.set(room.floor, { floor: room.floor, total: 0, ok: 0, needsRepair: 0, notStarted: 0 })
    }
    const bucket = byFloorMap.get(room.floor)
    bucket.total += 1
    if (room.status === 'ok') bucket.ok += 1
    else if (room.status === 'needs_repair') bucket.needsRepair += 1
    else bucket.notStarted += 1
  }
  const byFloor = [...byFloorMap.values()].sort((a, b) => a.floor - b.floor)

  const topCategories = db
    .prepare(
      `
    SELECT cc.id AS category_id, cc.name AS category_name,
           COUNT(*) AS needs_repair_count
    FROM inspection_items ii
    JOIN inspections i ON i.id = ii.inspection_id
    JOIN checklist_items ci ON ci.id = ii.checklist_item_id
    JOIN checklist_categories cc ON cc.id = ci.category_id
    WHERE i.year = ? AND i.trimester = ? AND ii.status = 'needs_repair'
    GROUP BY cc.id, cc.name
    ORDER BY needs_repair_count DESC
    LIMIT 8
  `
    )
    .all(year, trimester)

  const recentActivity = db
    .prepare(
      `
    SELECT i.id AS inspection_id, i.date_completed, i.is_quick_entry, i.updated_at, i.created_at,
           r.id AS room_id, r.room_number, r.floor, i.year, i.trimester,
           (SELECT COUNT(*) FROM inspection_items ii WHERE ii.inspection_id = i.id AND ii.status = 'needs_repair') AS needs_repair_count
    FROM inspections i
    JOIN rooms r ON r.id = i.room_id
    ORDER BY COALESCE(i.updated_at, i.created_at) DESC, i.id DESC
    LIMIT 12
  `
    )
    .all()

  const technicianStmt = db.prepare(`
    SELECT u.display_name
    FROM inspection_technicians it
    JOIN users u ON u.id = it.user_id
    WHERE it.inspection_id = ?
    ORDER BY u.display_name
  `)

  return {
    totals: {
      totalRooms: dashboard.totalRooms,
      completedRooms: dashboard.completedRooms,
      okRooms: dashboard.okRooms,
      needsRepairRooms: dashboard.needsRepairRooms,
      notStartedRooms: dashboard.notStartedRooms,
    },
    byFloor,
    topCategories: topCategories.map((c) => ({
      categoryId: c.category_id,
      categoryName: c.category_name,
      needsRepairCount: c.needs_repair_count,
    })),
    recentActivity: recentActivity.map((row) => ({
      inspectionId: row.inspection_id,
      roomId: row.room_id,
      roomNumber: row.room_number,
      floor: row.floor,
      year: row.year,
      trimester: row.trimester,
      dateCompleted: row.date_completed,
      isQuickEntry: !!row.is_quick_entry,
      needsRepairCount: row.needs_repair_count,
      technicians: technicianStmt.all(row.inspection_id).map((t) => t.display_name),
    })),
  }
}
