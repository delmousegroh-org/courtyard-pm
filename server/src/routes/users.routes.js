import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { listUsers } from '../db/queries/users.queries.js'

export const usersRouter = Router()
usersRouter.use(requireAuth)

usersRouter.get('/', (req, res) => {
  res.json(listUsers())
})
