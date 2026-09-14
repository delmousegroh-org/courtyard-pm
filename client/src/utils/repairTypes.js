// Repair type options, shared by the checklist item editor and anywhere a
// saved repair code is displayed. Labels differ by status: "Needs Repair"
// describes the outstanding work, "Repair Complete" confirms what was done.
export const REPAIR_TYPES = [
  { value: 'caulking', needsRepairLabel: 'Caulking', completeLabel: 'Caulked' },
  { value: 'replace', needsRepairLabel: 'Replace', completeLabel: 'Replaced' },
  { value: 'paint', needsRepairLabel: 'Paint', completeLabel: 'Painted' },
]

export function repairTypeLabel(repairCode, status = 'needs_repair') {
  const type = REPAIR_TYPES.find((t) => t.value === repairCode)
  if (!type) return null
  return status === 'repair_complete' ? type.completeLabel : type.needsRepairLabel
}
