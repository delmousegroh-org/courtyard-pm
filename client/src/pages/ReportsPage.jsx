import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Col, ListGroup, Row, Spinner, Stack } from 'react-bootstrap'
import { Buildings, CheckCircleFill, Circle, ExclamationTriangleFill, PeopleFill, PersonFill } from 'react-bootstrap-icons'
import PeriodSelector from '../components/layout/PeriodSelector.jsx'
import StatCard from '../components/dashboard/StatCard.jsx'
import RoomIssueList from '../components/rooms/RoomIssueList.jsx'
import { useApi } from '../hooks/useApi.js'
import { getReportSummary } from '../api/reports.js'
import { getDashboard } from '../api/dashboard.js'
import { getCurrentPeriod, periodLabel } from '../utils/period.js'

function sameFilter(a, b) {
  return a && b && a.kind === b.kind && a.value === b.value
}

function FloorRow({ floor, active, onClick }) {
  const total = floor.total || 1
  return (
    <button
      type="button"
      onClick={onClick}
      className={`btn btn-link p-2 w-100 text-start text-decoration-none drilldown-trigger ${active ? 'drilldown-trigger-active' : ''}`}
    >
      <div className="d-flex justify-content-between small mb-1 text-body">
        <span className="fw-semibold">Floor {floor.floor}</span>
        <span className="text-body-secondary">
          {floor.ok + floor.needsRepair}/{floor.total} done
        </span>
      </div>
      <div className="d-flex" style={{ height: 10, borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ width: `${(floor.ok / total) * 100}%`, background: 'var(--status-ok-border)' }} />
        <div style={{ width: `${(floor.needsRepair / total) * 100}%`, background: 'var(--status-repair-border)' }} />
        <div style={{ width: `${(floor.notStarted / total) * 100}%`, background: 'var(--status-pending-border)' }} />
      </div>
    </button>
  )
}

function DrilldownPanel({ filter, rooms, onClear }) {
  if (!filter) {
    return (
      <p className="small text-body-secondary mb-4">
        Tap a number above, a floor, or a category below to see the rooms behind it.
      </p>
    )
  }

  return (
    <div className="drilldown-panel mb-4">
      <div className="drilldown-panel-header">
        <span>
          {filter.label} <span className="text-body-secondary">({rooms?.length ?? 0})</span>
        </span>
        <button type="button" className="btn btn-sm btn-link p-0" onClick={onClear}>
          Clear
        </button>
      </div>
      <RoomIssueList
        rooms={rooms}
        categoryId={filter.kind === 'category' ? filter.value : undefined}
        emptyMessage="No rooms match this filter for the selected period."
      />
    </div>
  )
}

export default function ReportsPage() {
  const [period, setPeriod] = useState(getCurrentPeriod())
  const [filter, setFilter] = useState(null)

  const { data: summary, loading: summaryLoading, error } = useApi(
    () => getReportSummary(period.year, period.trimester),
    [period.year, period.trimester]
  )
  const { data: dashboard, loading: dashboardLoading } = useApi(
    () => getDashboard(period.year, period.trimester),
    [period.year, period.trimester]
  )

  // Selecting a new period invalidates whatever was being drilled into.
  // eslint-disable-next-line courtyard-pm-hooks/set-state-in-effect
  useEffect(() => setFilter(null), [period.year, period.trimester])

  const toggleFilter = (next) => {
    setFilter((prev) => (sameFilter(prev, next) ? null : next))
  }

  const filteredRooms = useMemo(() => {
    if (!dashboard || !filter) return null
    switch (filter.kind) {
      case 'all':
        return dashboard.rooms
      case 'status':
        return dashboard.rooms.filter((r) => r.status === filter.value)
      case 'floor':
        return dashboard.rooms.filter((r) => r.floor === filter.value)
      case 'category':
        return dashboard.rooms.filter((r) => r.issues.some((i) => i.categoryId === filter.value))
      default:
        return null
    }
  }, [dashboard, filter])

  const loading = summaryLoading || dashboardLoading

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-2 mb-3">
        <h1 className="h4 mb-0">Reports — {summary ? summary.periodLabel : periodLabel(period.year, period.trimester)}</h1>
        <PeriodSelector year={period.year} trimester={period.trimester} onChange={setPeriod} />
      </div>

      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      )}
      {error && <p className="text-danger">{error.message}</p>}

      {summary && dashboard && (
        <>
          <Row className="g-2 mb-2">
            <Col xs={6} md={3}>
              <StatCard
                icon={Buildings}
                value={summary.totals.totalRooms}
                label="Total rooms"
                tone="total"
                onClick={() => toggleFilter({ kind: 'all', value: null, label: 'All rooms' })}
                active={filter?.kind === 'all'}
              />
            </Col>
            <Col xs={6} md={3}>
              <StatCard
                icon={CheckCircleFill}
                value={summary.totals.okRooms}
                label="All good"
                tone="ok"
                onClick={() => toggleFilter({ kind: 'status', value: 'ok', label: 'All good' })}
                active={filter?.kind === 'status' && filter.value === 'ok'}
              />
            </Col>
            <Col xs={6} md={3}>
              <StatCard
                icon={ExclamationTriangleFill}
                value={summary.totals.needsRepairRooms}
                label="Needs repair"
                tone="repair"
                onClick={() => toggleFilter({ kind: 'status', value: 'needs_repair', label: 'Needs repair' })}
                active={filter?.kind === 'status' && filter.value === 'needs_repair'}
              />
            </Col>
            <Col xs={6} md={3}>
              <StatCard
                icon={Circle}
                value={summary.totals.notStartedRooms}
                label="Not started"
                tone="pending"
                onClick={() => toggleFilter({ kind: 'status', value: 'not_started', label: 'Not started' })}
                active={filter?.kind === 'status' && filter.value === 'not_started'}
              />
            </Col>
          </Row>

          <DrilldownPanel filter={filter} rooms={filteredRooms} onClear={() => setFilter(null)} />

          <Row className="g-4">
            <Col md={6}>
              <h2 className="h6 text-uppercase text-body-secondary mb-3">Completion by floor</h2>
              {summary.byFloor.map((floor) => (
                <FloorRow
                  key={floor.floor}
                  floor={floor}
                  active={filter?.kind === 'floor' && filter.value === floor.floor}
                  onClick={() =>
                    toggleFilter({ kind: 'floor', value: floor.floor, label: `Floor ${floor.floor}` })
                  }
                />
              ))}

              <h2 className="h6 text-uppercase text-body-secondary mt-4 mb-3">Top problem categories</h2>
              {summary.topCategories.length === 0 && (
                <p className="small text-body-secondary">No repair items logged for this period.</p>
              )}
              <ListGroup>
                {summary.topCategories.map((cat) => (
                  <ListGroup.Item
                    key={cat.categoryId}
                    action
                    onClick={() =>
                      toggleFilter({ kind: 'category', value: cat.categoryId, label: cat.categoryName })
                    }
                    active={filter?.kind === 'category' && filter.value === cat.categoryId}
                    className="d-flex justify-content-between align-items-center"
                  >
                    <span>{cat.categoryName}</span>
                    <span className="status-chip status-chip-repair">{cat.needsRepairCount}</span>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Col>

            <Col md={6}>
              <h2 className="h6 text-uppercase text-body-secondary mb-3">Recent activity</h2>
              <ListGroup>
                {summary.recentActivity.map((a) => (
                  <ListGroup.Item key={a.inspectionId} className="d-flex justify-content-between align-items-start gap-2">
                    <div>
                      <Link to={`/rooms/${a.roomId}/history`} className="fw-semibold text-decoration-none">
                        Room {a.roomNumber}
                      </Link>
                      <div className="small text-body-secondary">
                        {periodLabel(a.year, a.trimester)} · {a.dateCompleted}
                        {a.isQuickEntry ? ' (quick)' : ''}
                      </div>
                      {a.technicians.length > 0 && (
                        <div className="small text-body-secondary d-inline-flex align-items-center gap-1">
                          {a.technicians.length > 1 ? <PeopleFill /> : <PersonFill />}
                          {a.technicians.join(' & ')}
                        </div>
                      )}
                    </div>
                    <Stack className="align-items-end">
                      {a.isQuickEntry ? (
                        <span className="status-chip status-chip-pending">Quick entry</span>
                      ) : a.needsRepairCount > 0 ? (
                        <span className="status-chip status-chip-repair">
                          <ExclamationTriangleFill /> {a.needsRepairCount}
                        </span>
                      ) : (
                        <span className="status-chip status-chip-ok">
                          <CheckCircleFill /> OK
                        </span>
                      )}
                    </Stack>
                  </ListGroup.Item>
                ))}
                {summary.recentActivity.length === 0 && (
                  <p className="small text-body-secondary mb-0">No activity logged yet.</p>
                )}
              </ListGroup>
            </Col>
          </Row>
        </>
      )}
    </div>
  )
}
