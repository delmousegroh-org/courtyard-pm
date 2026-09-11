import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { getChecklistTemplate } from '../db/queries/checklist.queries.js'

export const checklistRouter = Router()
checklistRouter.use(requireAuth)

checklistRouter.get('/', (req, res) => {
  res.json(getChecklistTemplate())
})
