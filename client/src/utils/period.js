const LABELS = { 1: 'Jan – Apr', 2: 'May – Aug', 3: 'Sep – Dec' }

export function getCurrentPeriod(date = new Date()) {
  const month = date.getMonth() // 0-11
  const trimester = month <= 3 ? 1 : month <= 7 ? 2 : 3
  return { year: date.getFullYear(), trimester }
}

export function periodLabel(year, trimester) {
  return `${LABELS[trimester] ?? 'Unknown'} ${year}`
}

export function trimesterOptions() {
  return [1, 2, 3].map((t) => ({ value: t, label: LABELS[t] }))
}
