import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Form, Spinner } from 'react-bootstrap'
import PeriodSelector from '../components/layout/PeriodSelector.jsx'
import TechnicianPicker from '../components/inspection/TechnicianPicker.jsx'
import { useApi } from '../hooks/useApi.js'
import { useAuth } from '../context/AuthContext.jsx'
import { getDashboard } from '../api/dashboard.js'
import { bulkBackdate } from '../api/inspections.js'
import { listUsers } from '../api/users.js'
import { getCurrentPeriod } from '../utils/period.js'

export default function BulkBackdatePage() {
  const { user } = useAuth()
  const [period, setPeriodState] = useState(getCurrentPeriod())
  const setPeriod = (next) => {
    setPeriodState(next)
    setSavedCount(null)
  }
  const { data, loading, refetch } = useApi(() => getDashboard(period.year, period.trimester), [
    period.year,
    period.trimester,
  ])
  const { data: users } = useApi(() => listUsers(), [])

  const [dates, setDates] = useState({})
  const [technicianIds, setTechnicianIds] = useState(user ? [user.id] : [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [savedCount, setSavedCount] = useState(null)

  useEffect(() => {
    if (!data) return
    const initial = {}
    for (const room of data.rooms) {
      initial[room.roomId] = room.dateCompleted || ''
    }
    // Local editable state initialized from async server data — intentional
    // sync, not a derived-state anti-pattern (data only loads once per period).
    // eslint-disable-next-line courtyard-pm-hooks/set-state-in-effect
    setDates(initial)
  }, [data])

  const roomsByFloor = useMemo(() => {
    if (!data) return []
    const groups = new Map()
    for (const room of data.rooms) {
      if (!groups.has(room.floor)) groups.set(room.floor, [])
      groups.get(room.floor).push(room)
    }
    return [...groups.entries()].sort((a, b) => a[0] - b[0])
  }, [data])

  const handleSave = async () => {
    const entries = Object.entries(dates)
      .filter(([, date]) => date)
      .map(([roomId, date]) => ({ roomId: Number(roomId), dateCompleted: date }))

    if (entries.length === 0) return

    setSaving(true)
    setError(null)
    try {
      const result = await bulkBackdate({ year: period.year, trimester: period.trimester, entries, technicianIds })
      setSavedCount(result.count)
      refetch()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const filledCount = Object.values(dates).filter(Boolean).length

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-2 mb-2">
        <h1 className="h4 mb-0">Bulk backdate</h1>
        <PeriodSelector year={period.year} trimester={period.trimester} onChange={setPeriod} />
      </div>
      <p className="text-body-secondary small">
        Catch up historical dates for this period without filling out each room's full checklist. Leave a
        room blank to leave it not-started.
      </p>

      {users && (
        <div className="mb-3">
          <TechnicianPicker users={users} selectedIds={technicianIds} onChange={setTechnicianIds} />
        </div>
      )}

      {savedCount != null && (
        <Alert variant="success" onClose={() => setSavedCount(null)} dismissible>
          Saved {savedCount} room{savedCount === 1 ? '' : 's'} for this period.
        </Alert>
      )}
      {error && <Alert variant="danger">{error}</Alert>}

      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      )}

      {data &&
        roomsByFloor.map(([floor, rooms]) => (
          <div key={floor} className="mb-3">
            <div className="floor-heading mb-1">Floor {floor}</div>
            <div className="d-flex flex-column gap-1">
              {rooms.map((room) => (
                <div key={room.roomId} className="d-flex align-items-center gap-2 py-1 border-bottom">
                  <span style={{ width: 56 }} className="fw-semibold">
                    {room.roomNumber}
                  </span>
                  <Form.Control
                    type="date"
                    size="sm"
                    style={{ maxWidth: 180 }}
                    value={dates[room.roomId] || ''}
                    onChange={(e) => setDates((prev) => ({ ...prev, [room.roomId]: e.target.value }))}
                  />
                  {dates[room.roomId] && (
                    <Button
                      variant="link"
                      size="sm"
                      className="text-danger"
                      onClick={() => setDates((prev) => ({ ...prev, [room.roomId]: '' }))}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

      {data && (
        <div className="sticky-save-bar">
          <Button variant="success" size="lg" className="w-100" onClick={handleSave} disabled={saving || filledCount === 0}>
            {saving ? <Spinner animation="border" size="sm" /> : `Save ${filledCount} room${filledCount === 1 ? '' : 's'}`}
          </Button>
        </div>
      )}
    </div>
  )
}
