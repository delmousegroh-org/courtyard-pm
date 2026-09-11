import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { getDashboardData } from '../db/queries/inspections.queries.js'
import { parsePeriodQuery, periodLabel } from '../utils/period.js'

export const dashboardRouter = Router()
dashboardRouter.use(requireAuth)

dashboardRouter.get('/', (req, res, next) => {
  try {
    const { year, trimester } = parsePeriodQuery(req.query)
    const data = getDashboardData(year, trimester)
    res.json({ year, trimester, periodLabel: periodLabel(year, trimester), ...data })
  } catch (err) {
    next(err)
  }
})
