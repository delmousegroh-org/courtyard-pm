import { useState } from 'react'
import { Alert, Button, Form, Spinner, Table } from 'react-bootstrap'
import { useApi } from '../hooks/useApi.js'
import { listRooms, createRoom, updateRoom } from '../api/rooms.js'

function RoomRow({ room, onSaved }) {
  const [roomNumber, setRoomNumber] = useState(room.room_number)
  const [floor, setFloor] = useState(room.floor)
  const [notes, setNotes] = useState(room.notes || '')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await updateRoom(room.id, { roomNumber, floor: Number(floor), notes: notes || null })
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async () => {
    setSaving(true)
    try {
      await updateRoom(room.id, { isActive: !room.is_active })
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <tr className={room.is_active ? '' : 'text-body-secondary'}>
      <td style={{ width: 100 }}>
        <Form.Control size="sm" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} />
      </td>
      <td style={{ width: 80 }}>
        <Form.Control size="sm" type="number" value={floor} onChange={(e) => setFloor(e.target.value)} />
      </td>
      <td>
        <Form.Control size="sm" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" />
      </td>
      <td className="text-nowrap">
        <Button size="sm" variant="outline-primary" onClick={save} disabled={saving} className="me-2">
          Save
        </Button>
        <Button size="sm" variant={room.is_active ? 'outline-danger' : 'outline-success'} onClick={toggleActive} disabled={saving}>
          {room.is_active ? 'Deactivate' : 'Activate'}
        </Button>
      </td>
    </tr>
  )
}

function AddRoomForm({ onAdded }) {
  const [roomNumber, setRoomNumber] = useState('')
  const [floor, setFloor] = useState('')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await createRoom({ roomNumber, floor: Number(floor) })
      setRoomNumber('')
      setFloor('')
      onAdded()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Form onSubmit={handleSubmit} className="d-flex flex-wrap gap-2 align-items-end mb-3">
      <Form.Group>
        <Form.Label className="small mb-1">Room number</Form.Label>
        <Form.Control size="sm" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} required />
      </Form.Group>
      <Form.Group>
        <Form.Label className="small mb-1">Floor</Form.Label>
        <Form.Control size="sm" type="number" value={floor} onChange={(e) => setFloor(e.target.value)} required />
      </Form.Group>
      <Button type="submit" size="sm" variant="primary" disabled={saving}>
        Add room
      </Button>
      {error && <span className="text-danger small">{error}</span>}
    </Form>
  )
}

export default function SettingsRoomsPage() {
  const { data, loading, error, refetch } = useApi(() => listRooms(false), [])
  const [dismissedWarning, setDismissedWarning] = useState(false)

  return (
    <div>
      <h1 className="h4 mt-2 mb-3">Rooms</h1>

      {!dismissedWarning && (
        <Alert variant="warning" onClose={() => setDismissedWarning(true)} dismissible>
          This room list was reconstructed from paper records and may be incomplete or incorrect. Please verify
          against the building and correct it here.
        </Alert>
      )}

      <AddRoomForm onAdded={refetch} />

      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      )}
      {error && <p className="text-danger">{error.message}</p>}

      {data && (
        <div className="table-responsive">
          <Table size="sm" hover>
            <thead>
              <tr>
                <th>Room</th>
                <th>Floor</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.map((room) => (
                <RoomRow key={room.id} room={room} onSaved={refetch} />
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  )
}
