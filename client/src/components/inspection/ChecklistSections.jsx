import { ExclamationTriangleFill } from 'react-bootstrap-icons'
import ChecklistItemRow from './ChecklistItemRow.jsx'

export default function ChecklistSections({ categories, values, onItemChange }) {
  return (
    <div>
      {categories.map((category) => {
        const needsRepairCount = category.items.filter(
          (item) => values[item.id]?.status === 'needs_repair'
        ).length

        return (
          <section key={category.id} className="checklist-section">
            <div className="checklist-section-header">
              <h2 className="checklist-section-title">{category.name}</h2>
              {needsRepairCount > 0 && (
                <span className="status-chip status-chip-repair">
                  <ExclamationTriangleFill /> {needsRepairCount}
                </span>
              )}
            </div>
            <hr className="checklist-section-rule" />
            <div>
              {category.items.map((item) => (
                <ChecklistItemRow
                  key={item.id}
                  item={item}
                  value={values[item.id]}
                  onChange={(val) => onItemChange(item.id, val)}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
