import { Form, InputGroup } from 'react-bootstrap'
import { trimesterOptions } from '../../utils/period.js'

export default function PeriodSelector({ year, trimester, onChange }) {
  const currentYear = new Date().getFullYear()
  const years = [currentYear - 1, currentYear, currentYear + 1]

  return (
    <InputGroup style={{ maxWidth: 320 }}>
      <InputGroup.Text>Period</InputGroup.Text>
      <Form.Select
        aria-label="Trimester"
        value={trimester}
        onChange={(e) => onChange({ year, trimester: Number(e.target.value) })}
      >
        {trimesterOptions().map((opt) => (
          <option key={opt.value} value={opt.value}>
            T{opt.value}: {opt.label}
          </option>
        ))}
      </Form.Select>
      <Form.Select
        aria-label="Year"
        value={year}
        onChange={(e) => onChange({ year: Number(e.target.value), trimester })}
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </Form.Select>
    </InputGroup>
  )
}
