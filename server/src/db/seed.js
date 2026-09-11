import { db, transaction } from './db.js'
import { CHECKLIST_TEMPLATE, SEED_ROOMS } from './checklistTemplate.js'

function seedChecklist() {
  const insertCategory = db.prepare(
    'INSERT OR IGNORE INTO checklist_categories (name, sort_order) VALUES (?, ?)'
  )
  const getCategoryId = db.prepare('SELECT id FROM checklist_categories WHERE name = ?')
  const insertItem = db.prepare(
    'INSERT OR IGNORE INTO checklist_items (category_id, label, sort_order) VALUES (?, ?, ?)'
  )

  CHECKLIST_TEMPLATE.forEach((category, categoryIndex) => {
    insertCategory.run(category.name, categoryIndex)
    const { id: categoryId } = getCategoryId.get(category.name)
    category.items.forEach((label, itemIndex) => {
      insertItem.run(categoryId, label, itemIndex)
    })
  })
}

function seedRooms() {
  const insertRoom = db.prepare(
    'INSERT OR IGNORE INTO rooms (room_number, floor, sort_order) VALUES (?, ?, ?)'
  )
  SEED_ROOMS.forEach((room, index) => {
    insertRoom.run(room.roomNumber, room.floor, index)
  })
}

export function seed() {
  transaction(() => {
    seedChecklist()
    seedRooms()
  })
}

// Allow running directly: `node src/db/seed.js`
if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
  console.log(`Seeded ${SEED_ROOMS.length} rooms and checklist template.`)
}
