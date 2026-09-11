import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { getReportSummary } from '../db/queries/reports.queries.js'
import { parsePeriodQuery, periodLabel } from '../utils/period.js'

export const reportsRouter = Router()
reportsRouter.use(requireAuth)

reportsRouter.get('/summary', (req, res, next) => {
  try {
    const { year, trimester } = parsePeriodQuery(req.query)
    const data = getReportSummary(year, trimester)
    res.json({ year, trimester, periodLabel: periodLabel(year, trimester), ...data })
  } catch (err) {
    next(err)
  }
})
