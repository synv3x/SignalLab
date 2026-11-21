import { useEffect, useState } from 'react'

// A text box for numbers. It keeps what the user is typing (the "draft") separate
// from the real value, so partial input like "-" or "1." does not break anything.
// Only valid numbers are passed up through onCommit; otherwise an error is shown
// and the app keeps using the last valid value.
export default function NumberField({ id, value, onCommit, validate }) {
  const [draft, setDraft] = useState(toText(value))
  const [error, setError] = useState(null)

  // If the value changes from outside (slider, preset, unit switch), refresh the box.
  useEffect(() => {
    if (Number(draft) !== value) {
      setDraft(toText(value))
      setError(null)
    }
    // Deliberately depends only on `value`: typing must not trigger a reset of the draft text.
  }, [value])

  function handleChange(e) {
    const text = e.target.value
    setDraft(text)
    const n = text.trim() === '' ? NaN : Number(text)
    const problem = Number.isNaN(n) ? 'Enter a number.' : validate(n)
    setError(problem)
    if (!problem) onCommit(n)
  }

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={draft}
        onChange={handleChange}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${id}-error` : undefined}
        style={{ width: '100%' }}
      />
      {error && <p id={`${id}-error`} className="error" role="alert">{error} Showing the last valid value.</p>}
    </div>
  )
}

function toText(value) {
  return String(Number(value.toPrecision(8)))
}
