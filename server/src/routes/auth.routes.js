import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { findUserByUsername, findUserById } from '../db/queries/users.queries.js'

export const authRouter = Router()

authRouter.post('/login', (req, res) => {
  const { username, password } = req.body || {}
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' })
  }

  const user = findUserByUsername(username)
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid username or password' })
  }

  req.session.userId = user.id
  res.json({ id: user.id, username: user.username, displayName: user.display_name })
})

authRouter.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid')
    res.json({ ok: true })
  })
})

authRouter.get('/me', (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const user = findUserById(req.session.userId)
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  res.json({ id: user.id, username: user.username, displayName: user.display_name })
})
