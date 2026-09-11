import { db } from '../db.js'

export function getChecklistTemplate() {
  const categories = db
    .prepare('SELECT * FROM checklist_categories ORDER BY sort_order')
    .all()
  const items = db.prepare('SELECT * FROM checklist_items ORDER BY sort_order').all()

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    items: items
      .filter((item) => item.category_id === category.id)
      .map((item) => ({ id: item.id, label: item.label })),
  }))
}

export function getAllChecklistItemIds() {
  return db.prepare('SELECT id FROM checklist_items').all().map((row) => row.id)
}
