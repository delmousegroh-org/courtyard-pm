import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import {
  getInspectionById,
  upsertFullInspection,
  upsertQuickInspection,
  bulkQuickUpsert,
  updateInspectionFields,
  deleteInspection,
} from '../db/queries/inspections.queries.js'
import { getAllChecklistItemIds } from '../db/queries/checklist.queries.js'
import { getRoomById } from '../db/queries/rooms.queries.js'

export const inspectionsRouter = Router()
inspectionsRouter.use(requireAuth)

function validTrimester(t) {
  return [1, 2, 3].includes(Number(t))
}

// Technicians credited for a visit: 1 or 2 people. Defaults to whoever is
// logged in if the client doesn't specify (e.g. quick-mark from the dashboard).
function resolveTechnicianIds(req, technicianIds) {
  if (Array.isArray(technicianIds) && technicianIds.length > 0) {
    return technicianIds.map(Number).filter(Boolean).slice(0, 2)
  }
  return [req.session.userId]
}

inspectionsRouter.get('/:id', (req, res) => {
  const inspection = getInspectionById(Number(req.params.id))
  if (!inspection) return res.status(404).json({ error: 'Inspection not found' })
  res.json(inspection)
})

inspectionsRouter.post('/', (req, res, next) => {
  try {
    const { roomId, year, trimester, dateCompleted, overallNotes, technicianIds, items } = req.body || {}
    if (!roomId || !year || !validTrimester(trimester) || !dateCompleted || !Array.isArray(items)) {
      return res.status(400).json({
        error: 'roomId, year, trimester (1-3), dateCompleted and items[] are required',
      })
    }
    if (!getRoomById(roomId)) return res.status(404).json({ error: 'Room not found' })

    const validItemIds = new Set(getAllChecklistItemIds())
    for (const item of items) {
      if (!validItemIds.has(item.checklistItemId)) {
        return res.status(400).json({ error: `Unknown checklistItemId ${item.checklistItemId}` })
      }
      if (!['ok', 'needs_repair'].includes(item.status)) {
        return res.status(400).json({ error: `Invalid status for item ${item.checklistItemId}` })
      }
    }

    const inspectionId = upsertFullInspection({
      roomId,
      year: Number(year),
      trimester: Number(trimester),
      dateCompleted,
      overallNotes,
      technicianIds: resolveTechnicianIds(req, technicianIds),
      items,
    })
    res.status(201).json(getInspectionById(inspectionId))
  } catch (err) {
    next(err)
  }
})

inspectionsRouter.patch('/:id', (req, res) => {
  const { dateCompleted, overallNotes } = req.body || {}
  const inspection = updateInspectionFields(Number(req.params.id), { dateCompleted, overallNotes })
  if (!inspection) return res.status(404).json({ error: 'Inspection not found' })
  res.json(inspection)
})

inspectionsRouter.delete('/:id', (req, res) => {
  deleteInspection(Number(req.params.id))
  res.status(204).end()
})

inspectionsRouter.post('/quick', (req, res, next) => {
  try {
    const { roomId, year, trimester, dateCompleted, technicianIds } = req.body || {}
    if (!roomId || !year || !validTrimester(trimester) || !dateCompleted) {
      return res.status(400).json({ error: 'roomId, year, trimester (1-3) and dateCompleted are required' })
    }
    if (!getRoomById(roomId)) return res.status(404).json({ error: 'Room not found' })

    const inspectionId = upsertQuickInspection({
      roomId,
      year: Number(year),
      trimester: Number(trimester),
      dateCompleted,
      technicianIds: resolveTechnicianIds(req, technicianIds),
    })
    res.status(201).json(getInspectionById(inspectionId))
  } catch (err) {
    next(err)
  }
})

inspectionsRouter.post('/bulk-quick', (req, res, next) => {
  try {
    const { year, trimester, entries, technicianIds } = req.body || {}
    if (!year || !validTrimester(trimester) || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: 'year, trimester (1-3) and a non-empty entries[] are required' })
    }
    for (const entry of entries) {
      if (!entry.roomId || !entry.dateCompleted) {
        return res.status(400).json({ error: 'Each entry needs roomId and dateCompleted' })
      }
    }

    const ids = bulkQuickUpsert(Number(year), Number(trimester), entries, resolveTechnicianIds(req, technicianIds))
    res.status(201).json({ count: ids.length })
  } catch (err) {
    next(err)
  }
})
