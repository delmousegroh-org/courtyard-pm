import { useMemo, useState } from 'react'
import { Badge, Button, Form, Modal, ProgressBar, Row, Col, Spinner } from 'react-bootstrap'
import { Buildings, CheckCircleFill, Circle, ExclamationTriangleFill } from 'react-bootstrap-icons'
import PeriodSelector from '../components/layout/PeriodSelector.jsx'
import StatCard from '../components/dashboard/StatCard.jsx'
import RoomStatusTile from '../components/rooms/RoomStatusTile.jsx'
import TechnicianPicker from '../components/inspection/TechnicianPicker.jsx'
import { useApi } from '../hooks/useApi.js'
import { getDashboard } from '../api/dashboard.js'
import { quickBackdate } from '../api/inspections.js'
import { listUsers } from '../api/users.js'
import { getCurrentPeriod, periodLabel } from '../utils/period.js'

function QuickMarkModal({ room, year, trimester, users, onClose, onSaved }) {
  const [date, setDate] = useState(room.dateCompleted || new Date().toISOString().slice(0, 10))
  const [technicianIds, setTechnicianIds] = useState(
    room.technicians?.length ? room.technicians.map((t) => t.id) : []
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await quickBackdate({ roomId: room.roomId, year, trimester, dateCompleted: date, technicianIds })
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal show onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Quick mark room {room.roomNumber}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <p className="text-danger">{error}</p>}
        <Form.Group controlId="quick-date" className="mb-3">
          <Form.Label className="small mb-1">Date completed</Form.Label>
          <Form.Control type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Form.Group>
        {users && (
          <TechnicianPicker users={users} selectedIds={technicianIds} onChange={setTechnicianIds} />
        )}
        <p className="text-body-secondary small mt-3 mb-0">
          Logs this room as done for the period without filling out the full checklist. You can
          add checklist detail later from the room's history page.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="success" onClick={handleSave} disabled={saving}>
          {saving ? <Spinner animation="border" size="sm" /> : 'Save'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default function DashboardPage() {
  const [period, setPeriod] = useState(getCurrentPeriod())
  const [quickMarkRoom, setQuickMarkRoom] = useState(null)

  const { data, loading, error, refetch } = useApi(
    () => getDashboard(period.year, period.trimester),
    [period.year, period.trimester]
  )
  const { data: users } = useApi(() => listUsers(), [])

  const roomsByFloor = useMemo(() => {
    if (!data) return []
    const groups = new Map()
    for (const room of data.rooms) {
      if (!groups.has(room.floor)) groups.set(room.floor, [])
      groups.get(room.floor).push(room)
    }
    return [...groups.entries()].sort((a, b) => a[0] - b[0])
  }, [data])

  const percentComplete = data && data.totalRooms > 0 ? Math.round((data.completedRooms / data.totalRooms) * 100) : 0

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-2 mb-3">
        <h1 className="h4 mb-0">{data ? data.periodLabel : periodLabel(period.year, period.trimester)}</h1>
        <PeriodSelector year={period.year} trimester={period.trimester} onChange={setPeriod} />
      </div>

      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      )}
      {error && <p className="text-danger">{error.message}</p>}

      {data && (
        <>
          <Row className="g-2 mb-3">
            <Col xs={6} md={3}>
              <StatCard icon={Buildings} value={data.totalRooms} label="Total rooms" tone="total" />
            </Col>
            <Col xs={6} md={3}>
              <StatCard icon={CheckCircleFill} value={data.okRooms} label="All good" tone="ok" />
            </Col>
            <Col xs={6} md={3}>
              <StatCard
                icon={ExclamationTriangleFill}
                value={data.needsRepairRooms}
                label="Needs repair"
                tone="repair"
              />
            </Col>
            <Col xs={6} md={3}>
              <StatCard icon={Circle} value={data.notStartedRooms} label="Not started" tone="pending" />
            </Col>
          </Row>

          <div className="d-flex align-items-center gap-2 mb-4">
            <ProgressBar
              now={percentComplete}
              variant={percentComplete === 100 ? 'success' : 'primary'}
              className="flex-grow-1"
              style={{ height: 10 }}
            />
            <Badge bg={percentComplete === 100 ? 'success' : 'primary'} className="fs-6">
              {percentComplete}%
            </Badge>
          </div>

          {roomsByFloor.map(([floor, rooms]) => (
            <div key={floor} className="mb-4">
              <div className="floor-heading mb-2">Floor {floor}</div>
              <div className="room-tile-grid">
                {rooms.map((room) => (
                  <div key={room.roomId} className="position-relative">
                    <RoomStatusTile room={room} to={`/rooms/${room.roomId}?year=${period.year}&trimester=${period.trimester}`} />
                    {room.status === 'not_started' && (
                      <Button
                        size="sm"
                        variant="light"
                        className="border p-0 position-absolute top-0 start-100 translate-middle rounded-circle"
                        style={{ width: 22, height: 22, fontSize: '0.65rem', lineHeight: 1 }}
                        title="Quick mark done"
                        onClick={(e) => {
                          e.preventDefault()
                          setQuickMarkRoom(room)
                        }}
                      >
                        +
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {quickMarkRoom && (
        <QuickMarkModal
          room={quickMarkRoom}
          year={period.year}
          trimester={period.trimester}
          users={users}
          onClose={() => setQuickMarkRoom(null)}
          onSaved={() => {
            setQuickMarkRoom(null)
            refetch()
          }}
        />
      )}
    </div>
  )
}
