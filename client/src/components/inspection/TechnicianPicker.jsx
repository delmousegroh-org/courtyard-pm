import { Form } from 'react-bootstrap'

// Credits 1 or 2 people for a PM visit.
export default function TechnicianPicker({ users, selectedIds, onChange, label = 'Done by' }) {
  const toggle = (userId) => {
    if (selectedIds.includes(userId)) {
      onChange(selectedIds.filter((id) => id !== userId))
    } else if (selectedIds.length < 2) {
      onChange([...selectedIds, userId])
    }
  }

  return (
    <Form.Group>
      <Form.Label className="small mb-1">{label}</Form.Label>
      <div className="d-flex gap-3">
        {users.map((user) => (
          <Form.Check
            key={user.id}
            type="checkbox"
            id={`technician-${user.id}`}
            label={user.display_name}
            checked={selectedIds.includes(user.id)}
            disabled={!selectedIds.includes(user.id) && selectedIds.length >= 2}
            onChange={() => toggle(user.id)}
          />
        ))}
      </div>
    </Form.Group>
  )
}
