const LABELS = { 1: 'Jan – Apr', 2: 'May – Aug', 3: 'Sep – Dec' }

export function getCurrentPeriod(date = new Date()) {
  const month = date.getMonth() // 0-11
  const trimester = month <= 3 ? 1 : month <= 7 ? 2 : 3
  return { year: date.getFullYear(), trimester }
}

export function periodLabel(year, trimester) {
  return `${LABELS[trimester] ?? 'Unknown'} ${year}`
}

export function parsePeriodQuery(query) {
  const current = getCurrentPeriod()
  const year = query.year ? Number(query.year) : current.year
  const trimester = query.trimester ? Number(query.trimester) : current.trimester
  if (![1, 2, 3].includes(trimester)) {
    throw new Error('trimester must be 1, 2, or 3')
  }
  return { year, trimester }
}
