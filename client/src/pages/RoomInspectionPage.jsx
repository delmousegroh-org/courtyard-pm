import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { Alert, Button, Spinner } from 'react-bootstrap'
import PeriodSelector from '../components/layout/PeriodSelector.jsx'
import ChecklistSections from '../components/inspection/ChecklistSections.jsx'
import InspectionMeta from '../components/inspection/InspectionMeta.jsx'
import { useApi } from '../hooks/useApi.js'
import { useAuth } from '../context/AuthContext.jsx'
import { getChecklistTemplate } from '../api/checklist.js'
import { getRoomHistory } from '../api/rooms.js'
import { saveInspection } from '../api/inspections.js'
import { listUsers } from '../api/users.js'
import { getCurrentPeriod } from '../utils/period.js'

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export default function RoomInspectionPage() {
  const { roomId } = useParams()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const [period, setPeriod] = useState(() => {
    const year = Number(searchParams.get('year'))
    const trimester = Number(searchParams.get('trimester'))
    if (year && [1, 2, 3].includes(trimester)) return { year, trimester }
    return getCurrentPeriod()
  })

  const { data: template, loading: templateLoading } = useApi(() => getChecklistTemplate(), [])
  const { data: history, loading: historyLoading, refetch } = useApi(() => getRoomHistory(roomId), [roomId])
  const { data: users } = useApi(() => listUsers(), [])

  const [values, setValues] = useState({})
  const [date, setDate] = useState(todayIso())
  const [overallNotes, setOverallNotes] = useState('')
  const [technicianIds, setTechnicianIds] = useState(user ? [user.id] : [])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saved, setSaved] = useState(false)

  const existingInspection = useMemo(() => {
    if (!history) return null
    return history.inspections.find((i) => i.year === period.year && i.trimester === period.trimester) || null
  }, [history, period])

  // (Re)initialize the form whenever the template loads or the selected
  // period changes to a different existing (or blank) inspection. Local
  // editable state initialized from async server data — intentional sync.
  /* eslint-disable courtyard-pm-hooks/set-state-in-effect */
  useEffect(() => {
    if (!template) return
    const initial = {}
    for (const category of template) {
      for (const item of category.items) {
        initial[item.id] = { status: 'ok', note: '', repairCode: null }
      }
    }
    if (existingInspection) {
      for (const item of existingInspection.items) {
        initial[item.checklist_item_id] = {
          status: item.status,
          note: item.note || '',
          repairCode: item.repair_code,
        }
      }
      setDate(existingInspection.date_completed)
      setOverallNotes(existingInspection.overall_notes || '')
      setTechnicianIds(
        existingInspection.technicians?.length ? existingInspection.technicians.map((t) => t.id) : user ? [user.id] : []
      )
    } else {
      setDate(todayIso())
      setOverallNotes('')
      setTechnicianIds(user ? [user.id] : [])
    }
    setValues(initial)
    setSaved(false)
  }, [template, existingInspection, user])
  /* eslint-enable courtyard-pm-hooks/set-state-in-effect */

  const handleItemChange = (itemId, value) => {
    setValues((prev) => ({ ...prev, [itemId]: value }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      const items = Object.entries(values).map(([checklistItemId, v]) => ({
        checklistItemId: Number(checklistItemId),
        status: v.status,
        note: v.note || null,
        repairCode: v.repairCode || null,
      }))
      await saveInspection({
        roomId: Number(roomId),
        year: period.year,
        trimester: period.trimester,
        dateCompleted: date,
        overallNotes: overallNotes || null,
        technicianIds,
        items,
      })
      setSaved(true)
      refetch()
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const loading = templateLoading || historyLoading

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-2 mb-3">
        <div>
          <h1 className="h4 mb-0">Room {history?.room?.room_number || roomId}</h1>
          {history?.room && (
            <Link to={`/rooms/${roomId}/history`} className="small">
              View history
            </Link>
          )}
        </div>
        <PeriodSelector year={period.year} trimester={period.trimester} onChange={setPeriod} />
      </div>

      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      )}

      {!loading && template && (
        <>
          {Boolean(existingInspection?.is_quick_entry) && (
            <Alert variant="info" className="py-2">
              This period was logged as a quick backdate ({existingInspection.date_completed}) with no item
              detail. Filling out the checklist below and saving will add full detail to it.
            </Alert>
          )}

          <InspectionMeta
            date={date}
            onDateChange={setDate}
            overallNotes={overallNotes}
            onNotesChange={setOverallNotes}
            users={users}
            technicianIds={technicianIds}
            onTechnicianIdsChange={setTechnicianIds}
          />

          <ChecklistSections categories={template} values={values} onItemChange={handleItemChange} />

          <div className="sticky-save-bar mt-3">
            {saveError && (
              <p className="text-danger small mb-2">{saveError}</p>
            )}
            <div className="d-flex align-items-center gap-2">
              <Button variant="success" size="lg" className="flex-grow-1" onClick={handleSave} disabled={saving}>
                {saving ? <Spinner animation="border" size="sm" /> : saved ? 'Saved ✓' : 'Save inspection'}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
