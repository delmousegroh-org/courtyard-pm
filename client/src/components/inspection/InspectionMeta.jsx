import { Form } from 'react-bootstrap'
import TechnicianPicker from './TechnicianPicker.jsx'

export default function InspectionMeta({
  date,
  onDateChange,
  overallNotes,
  onNotesChange,
  users,
  technicianIds,
  onTechnicianIdsChange,
}) {
  return (
    <div className="mb-3">
      <div className="d-flex flex-column flex-sm-row gap-2 mb-2">
        <Form.Group controlId="inspection-date" style={{ maxWidth: 200 }}>
          <Form.Label className="small mb-1">Date completed</Form.Label>
          <Form.Control type="date" value={date} onChange={(e) => onDateChange(e.target.value)} />
        </Form.Group>
        <Form.Group controlId="inspection-notes" className="flex-grow-1">
          <Form.Label className="small mb-1">Overall notes (optional)</Form.Label>
          <Form.Control
            as="textarea"
            rows={1}
            value={overallNotes}
            onChange={(e) => onNotesChange(e.target.value)}
          />
        </Form.Group>
      </div>
      {users && (
        <TechnicianPicker users={users} selectedIds={technicianIds} onChange={onTechnicianIdsChange} />
      )}
    </div>
  )
}
