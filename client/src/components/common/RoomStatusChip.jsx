import { CheckCircleFill, ExclamationTriangleFill } from 'react-bootstrap-icons'

export default function RoomStatusChip({ status, needsRepairCount = 0 }) {
  if (status === 'needs_repair') {
    return (
      <span className="status-chip status-chip-repair">
        <ExclamationTriangleFill /> {needsRepairCount} needs repair
      </span>
    )
  }
  if (status === 'ok') {
    return (
      <span className="status-chip status-chip-ok">
        <CheckCircleFill /> All good
      </span>
    )
  }
  return <span className="status-chip status-chip-pending">Not started</span>
}
