// format.js - turn raw numbers into readable text with consistent units.

export const BANDWIDTH_UNITS = [
  { label: 'Hz', factor: 1 },
  { label: 'kHz', factor: 1e3 },
  { label: 'MHz', factor: 1e6 },
  { label: 'GHz', factor: 1e9 },
]

export const RATE_UNITS = [
  { label: 'bps', factor: 1 },
  { label: 'kbps', factor: 1e3 },
  { label: 'Mbps', factor: 1e6 },
  { label: 'Gbps', factor: 1e9 },
  { label: 'Tbps', factor: 1e12 },
]

/** Pick the largest unit whose value is >= 1 (falls back to the smallest). */
export function bestUnit(value, units) {
  const abs = Math.abs(value)
  let best = units[0]
  for (const u of units) if (abs >= u.factor) best = u
  return best
}

/** Significant-digit formatting that never shows scientific notation. */
export function formatNumber(value, digits = 4) {
  if (value === Infinity) return '∞'
  if (value === -Infinity) return '−∞'
  if (!Number.isFinite(value)) return '—'
  if (value === 0) return '0'
  // Round to `digits` significant digits, then print with thousands separators.
  const rounded = Number(value.toPrecision(digits))
  return rounded.toLocaleString('en-US', { maximumFractionDigits: 15 })
}

/** Format with an explicit unit list, auto-choosing the unit: "20 MHz", "133.2 Mbps". */
function formatWithUnits(value, units, digits) {
  if (!Number.isFinite(value)) return '—'
  const u = bestUnit(value, units)
  return `${formatNumber(value / u.factor, digits)} ${u.label}`
}

export const formatHz = (hz, digits = 4) => formatWithUnits(hz, BANDWIDTH_UNITS, digits)
export const formatBps = (bps, digits = 4) => formatWithUnits(bps, RATE_UNITS, digits)

/** dB values with an explicit sign for readability: "+20 dB", "−5 dB". */
export function formatDb(db, digits = 4) {
  if (db === -Infinity) return '−∞ dB'
  if (!Number.isFinite(db)) return '—'
  const text = formatNumber(Math.abs(db), digits)
  return `${db < 0 ? '−' : db > 0 ? '+' : ''}${text} dB`
}
