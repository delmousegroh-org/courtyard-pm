import { Link, useParams } from 'react-router-dom'
import { ListGroup, Spinner } from 'react-bootstrap'
import { PersonFill, PeopleFill } from 'react-bootstrap-icons'
import { useApi } from '../hooks/useApi.js'
import { getRoomHistory } from '../api/rooms.js'
import { periodLabel } from '../utils/period.js'
import RoomStatusChip from '../components/common/RoomStatusChip.jsx'

function TechnicianBadge({ technicians }) {
  if (!technicians || technicians.length === 0) return null
  const Icon = technicians.length > 1 ? PeopleFill : PersonFill
  return (
    <span className="small text-body-secondary d-inline-flex align-items-center gap-1">
      <Icon /> {technicians.map((t) => t.display_name).join(' & ')}
    </span>
  )
}

export default function RoomHistoryPage() {
  const { roomId } = useParams()
  const { data, loading, error } = useApi(() => getRoomHistory(roomId), [roomId])

  return (
    <div>
      <div className="mt-2 mb-3">
        <h1 className="h4 mb-0">Room {data?.room?.room_number || roomId} history</h1>
        <Link to={`/rooms/${roomId}`} className="small">
          Back to current inspection
        </Link>
      </div>

      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      )}
      {error && <p className="text-danger">{error.message}</p>}

      {data && data.inspections.length === 0 && <p className="text-body-secondary">No inspections logged yet.</p>}

      {data && data.inspections.length > 0 && (
        <ListGroup>
          {data.inspections.map((inspection) => {
            const needsRepairCount = inspection.items.filter((i) => i.status === 'needs_repair').length
            return (
              <ListGroup.Item key={inspection.id} className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                  <div className="fw-semibold">
                    {periodLabel(inspection.year, inspection.trimester)}
                  </div>
                  <div className="small text-body-secondary">
                    {inspection.date_completed}
                    {inspection.overall_notes ? ` — ${inspection.overall_notes}` : ''}
                  </div>
                  <TechnicianBadge technicians={inspection.technicians} />
                </div>
                <div className="d-flex align-items-center gap-2">
                  {inspection.is_quick_entry ? (
                    <>
                      <span className="status-chip status-chip-pending">Quick entry</span>
                      <Link
                        to={`/rooms/${roomId}?year=${inspection.year}&trimester=${inspection.trimester}`}
                        className="small"
                      >
                        Add checklist detail
                      </Link>
                    </>
                  ) : (
                    <>
                      <RoomStatusChip
                        status={needsRepairCount > 0 ? 'needs_repair' : 'ok'}
                        needsRepairCount={needsRepairCount}
                      />
                      <Link
                        to={`/rooms/${roomId}?year=${inspection.year}&trimester=${inspection.trimester}`}
                        className="small"
                      >
                        View / edit
                      </Link>
                    </>
                  )}
                </div>
              </ListGroup.Item>
            )
          })}
        </ListGroup>
      )}
    </div>
  )
}
