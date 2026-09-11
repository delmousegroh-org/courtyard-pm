import { Link } from 'react-router-dom'
import { CheckCircleFill, ExclamationTriangleFill } from 'react-bootstrap-icons'

const STATUS_CONFIG = {
  ok: {
    icon: CheckCircleFill,
    className: 'room-tile-ok',
    label: 'All good',
  },
  needs_repair: {
    icon: ExclamationTriangleFill,
    className: 'room-tile-repair',
    label: 'Needs repair',
  },
  not_started: {
    icon: null,
    className: 'room-tile-pending',
    label: 'Not started',
  },
}

export default function RoomStatusTile({ room, to }) {
  const config = STATUS_CONFIG[room.status] || STATUS_CONFIG.not_started
  const Icon = config.icon
  const techNames = (room.technicians || []).map((t) => t.display_name || t.displayName).join(' & ')

  const title = [
    config.label,
    room.dateCompleted ? `Completed ${room.dateCompleted}${room.isQuickEntry ? ' (quick)' : ''}` : null,
    techNames ? `By ${techNames}` : null,
    room.needsRepairCount ? `${room.needsRepairCount} item(s) need repair` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Link to={to} className={`room-tile ${config.className}`} title={title}>
      {Icon && <Icon className="room-tile-icon" />}
      <span className="room-tile-number">{room.roomNumber}</span>
      {room.status === 'needs_repair' && room.needsRepairCount > 0 && (
        <span className="room-tile-count">{room.needsRepairCount}</span>
      )}
    </Link>
  )
}
