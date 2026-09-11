import { Form } from 'react-bootstrap'

const REPAIR_CODES = [
  { value: '', label: 'No repair code' },
  { value: '1', label: '1 - Repaired' },
  { value: '2', label: '2 - Replaced' },
  { value: '3', label: '3 - Caulking' },
  { value: '4', label: '4 - Painted' },
]

export default function ChecklistItemRow({ item, value, onChange }) {
  const status = value?.status ?? 'ok'
  const isRepair = status === 'needs_repair'

  return (
    <div className={`checklist-item-row ${isRepair ? 'checklist-item-row-repair' : ''}`}>
      <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap w-100">
        <span className="checklist-item-label">{item.label}</span>
        <Form.Select
          size="sm"
          className={`checklist-item-select ${isRepair ? 'checklist-item-select-repair' : 'checklist-item-select-ok'}`}
          value={status}
          onChange={(e) => onChange({ ...value, status: e.target.value })}
        >
          <option value="ok">OK</option>
          <option value="needs_repair">Needs Repair</option>
        </Form.Select>
      </div>

      {isRepair && (
        <div className="mt-2 d-flex flex-column flex-sm-row gap-2 w-100">
          <Form.Control
            type="text"
            placeholder="Note (optional)"
            size="sm"
            value={value?.note ?? ''}
            onChange={(e) => onChange({ ...value, note: e.target.value })}
          />
          <Form.Select
            size="sm"
            style={{ maxWidth: 200 }}
            value={value?.repairCode ?? ''}
            onChange={(e) => onChange({ ...value, repairCode: e.target.value || null })}
          >
            {REPAIR_CODES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Form.Select>
        </div>
      )}
    </div>
  )
}
