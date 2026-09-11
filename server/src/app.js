import express from 'express'
import session from 'express-session'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { SQLiteSessionStore } from './db/sessionStore.js'
import { authRouter } from './routes/auth.routes.js'
import { roomsRouter } from './routes/rooms.routes.js'
import { checklistRouter } from './routes/checklist.routes.js'
import { dashboardRouter } from './routes/dashboard.routes.js'
import { inspectionsRouter } from './routes/inspections.routes.js'
import { reportsRouter } from './routes/reports.routes.js'
import { usersRouter } from './routes/users.routes.js'
import { errorHandler } from './middleware/errorHandler.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isProd = process.env.NODE_ENV === 'production'

export const app = express()
app.set('trust proxy', 1)
app.use(express.json())

app.use(
  session({
    store: new SQLiteSessionStore(),
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    },
  })
)

app.use('/api/auth', authRouter)
app.use('/api/rooms', roomsRouter)
app.use('/api/checklist-template', checklistRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/inspections', inspectionsRouter)
app.use('/api/reports', reportsRouter)
app.use('/api/users', usersRouter)

const clientDist = path.join(__dirname, '../../client/dist')
if (isProd && fs.existsSync(clientDist)) {
  app.use(express.static(clientDist))
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}

app.use(errorHandler)
