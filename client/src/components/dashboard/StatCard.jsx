export default function StatCard({ icon: Icon, value, label, tone = 'pending', onClick, active }) {
  const classes = [
    'stat-card',
    `stat-card-${tone}`,
    onClick ? 'stat-card-clickable' : '',
    active ? 'stat-card-active' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const content = (
    <>
      <Icon className="stat-card-icon" />
      <div>
        <div className="stat-card-value">{value}</div>
        <div className="stat-card-label">{label}</div>
      </div>
    </>
  )

  if (onClick) {
    return (
      <button type="button" className={classes} onClick={onClick} aria-pressed={!!active}>
        {content}
      </button>
    )
  }

  return <div className={classes}>{content}</div>
}
