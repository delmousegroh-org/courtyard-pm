import 'dotenv/config'
import { app } from './app.js'
import { seed } from './db/seed.js'

seed()

const port = process.env.PORT || 3001
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`)
})
