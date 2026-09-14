import { Link } from 'react-router-dom'
import { ListGroup, Badge } from 'react-bootstrap'
import { PersonFill, PeopleFill } from 'react-bootstrap-icons'
import RoomStatusChip from '../common/RoomStatusChip.jsx'
import { repairTypeLabel } from '../../utils/repairTypes.js'

// Rooms drill-down list: shared by the stat cards, floor bars, and category
// list on the Reports page, and anywhere else "show me the rooms behind this
// number" is needed. Pass `categoryId` to narrow which issues show per room
// (e.g. from the "top problem categories" list) instead of all of a room's
// issues.
export default function RoomIssueList({ rooms, categoryId, emptyMessage = 'No rooms match.' }) {
  if (!rooms || rooms.length === 0) {
    return <p className="small text-body-secondary mb-0">{emptyMessage}</p>
  }

  return (
    <ListGroup className="room-issue-list">
      {rooms.map((room) => {
        const issues = categoryId
          ? room.issues.filter((i) => i.categoryId === categoryId)
          : room.issues

        return (
          <ListGroup.Item key={room.roomId} className="room-issue-row">
            <div className="d-flex justify-content-between align-items-start gap-2">
              <div>
                <Link to={`/rooms/${room.roomId}/history`} className="fw-semibold text-decoration-none">
                  Room {room.roomNumber}
                </Link>
                <span className="text-body-secondary small ms-2">Floor {room.floor}</span>
                <div className="small text-body-secondary">
                  {room.dateCompleted ? (
                    <>
                      {room.dateCompleted}
                      {room.isQuickEntry ? ' (quick entry)' : ''}
                      {room.technicians?.length > 0 && (
                        <span className="d-inline-flex align-items-center gap-1 ms-2">
                          {room.technicians.length > 1 ? <PeopleFill /> : <PersonFill />}
                          {room.technicians.map((t) => t.display_name || t.displayName).join(' & ')}
                        </span>
                      )}
                    </>
                  ) : (
                    'Not yet inspected'
                  )}
                </div>
              </div>
              <RoomStatusChip status={room.status} needsRepairCount={room.needsRepairCount} />
            </div>

            {issues && issues.length > 0 && (
              <ul className="room-issue-detail-list">
                {issues.map((issue, idx) => (
                  <li key={idx}>
                    <span className="text-body-secondary">{issue.categoryName}:</span> {issue.label}
                    {issue.note ? ` — ${issue.note}` : ''}
                    {issue.repairCode && (
                      <Badge bg="light" text="dark" className="ms-2">
                        {repairTypeLabel(issue.repairCode, 'needs_repair')}
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </ListGroup.Item>
        )
      })}
    </ListGroup>
  )
}
