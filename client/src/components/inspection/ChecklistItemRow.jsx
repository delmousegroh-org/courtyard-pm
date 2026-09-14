import { useState } from 'react'
import { Button, Form, Modal, ToggleButton, ToggleButtonGroup } from 'react-bootstrap'
import { ChatSquareText, ChatSquareTextFill } from 'react-bootstrap-icons'
import { REPAIR_TYPES } from '../../utils/repairTypes.js'

function NoteModal({ show, itemLabel, note, onSave, onClose }) {
  const [draft, setDraft] = useState(note ?? '')

  return (
    <Modal show={show} onHide={onClose} onEnter={() => setDraft(note ?? '')} centered>
      <Modal.Header closeButton>
        <Modal.Title className="h6 mb-0">Note — {itemLabel}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Control
          as="textarea"
          rows={4}
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="What's going on with this item?"
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="success" onClick={() => onSave(draft)}>
          Save note
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default function ChecklistItemRow({ item, value, onChange }) {
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const status = value?.status ?? 'ok'
  const isRepair = status === 'needs_repair'
  const isComplete = status === 'repair_complete'
  const showRepairOptions = isRepair || isComplete
  const hasNote = Boolean(value?.note)

  const rowClass = isRepair ? 'checklist-item-row-repair' : isComplete ? 'checklist-item-row-complete' : ''
  const selectClass = isRepair
    ? 'checklist-item-select-repair'
    : isComplete
      ? 'checklist-item-select-complete'
      : 'checklist-item-select-ok'

  return (
    <div className={`checklist-item-row ${rowClass}`}>
      <div className="d-flex justify-content-between align-items-center gap-2 flex-nowrap w-100">
        <span className="checklist-item-label">{item.label}</span>
        <Form.Select
          size="sm"
          className={`checklist-item-select ${selectClass}`}
          value={status}
          onChange={(e) => onChange({ ...value, status: e.target.value })}
        >
          <option value="ok">OK</option>
          <option value="needs_repair">Needs Repair</option>
          <option value="repair_complete">Repair Complete</option>
        </Form.Select>
      </div>

      {showRepairOptions && (
        <div className="mt-2 d-flex align-items-center flex-wrap gap-2 w-100">
          <ToggleButtonGroup
            type="radio"
            name={`repair-type-${item.id}`}
            value={value?.repairCode ?? null}
            onChange={(repairCode) => onChange({ ...value, repairCode })}
          >
            {REPAIR_TYPES.map((t) => (
              <ToggleButton
                key={t.value}
                id={`repair-type-${item.id}-${t.value}`}
                value={t.value}
                type="radio"
                variant="outline-secondary"
                size="sm"
              >
                {isComplete ? t.completeLabel : t.needsRepairLabel}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <Button
            variant={hasNote ? 'info' : 'outline-secondary'}
            size="sm"
            className="d-inline-flex align-items-center gap-1"
            onClick={() => setNoteModalOpen(true)}
          >
            {hasNote ? <ChatSquareTextFill /> : <ChatSquareText />}
            {hasNote ? 'Note' : 'Add note'}
          </Button>
        </div>
      )}

      <NoteModal
        show={noteModalOpen}
        itemLabel={item.label}
        note={value?.note}
        onSave={(note) => {
          onChange({ ...value, note })
          setNoteModalOpen(false)
        }}
        onClose={() => setNoteModalOpen(false)}
      />
    </div>
  )
}
