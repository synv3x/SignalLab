import { SlidersHorizontal } from 'lucide-react'
import NumberField from './NumberField.jsx'
import { BANDWIDTH_UNITS, formatNumber } from '../lib/format.js'
import { dbToLinear, LIMITS } from '../lib/shannon.js'

// Slider ranges (typed values may go beyond these; the slider just pins to its end).
const BW_LOG_MIN = 2   // 10^2 = 100 Hz
const BW_LOG_MAX = 9   // 10^9 = 1 GHz
export const SNR_SLIDER = { min: -20, max: 50, step: 0.5 }

export default function Controls({ bandwidthHz, setBandwidthHz, bwUnit, setBwUnit, snrDb, setSnrDb }) {
  const unit = BANDWIDTH_UNITS.find((u) => u.label === bwUnit)

  // The bandwidth slider is logarithmic: equal steps = equal multiplication.
  const bwSliderPos = Math.min(BW_LOG_MAX, Math.max(BW_LOG_MIN, Math.log10(bandwidthHz)))
  function onBwSlider(e) {
    const hz = Math.pow(10, Number(e.target.value))
    setBandwidthHz(Number(hz.toPrecision(3))) // 3 significant digits keeps numbers tidy
  }

  const validateBw = (n) => {
    if (n <= 0) return 'Bandwidth must be greater than 0.'
    if (n * unit.factor > LIMITS.bandwidthHz.max) return 'Bandwidth is too large (max 1 THz).'
    return null
  }
  const validateSnr = (n) =>
    n < LIMITS.snrDb.min || n > LIMITS.snrDb.max
      ? `SNR must be between ${LIMITS.snrDb.min} and ${LIMITS.snrDb.max} dB.`
      : null

  return (
    <section className="card" aria-labelledby="controls-title">
      <h2 id="controls-title"><SlidersHorizontal size={18} aria-hidden="true" /> Channel controls</h2>
      <p className="card-desc">Set the channel bandwidth and its signal-to-noise ratio.</p>

      <div className="field">
        <div className="field-head">
          <label htmlFor="bw-input">Bandwidth (B)</label>
          <span className="badge">Hz</span>
        </div>
        <div className="input-row">
          <NumberField
            id="bw-input"
            value={bandwidthHz / unit.factor}
            validate={validateBw}
            onCommit={(n) => setBandwidthHz(n * unit.factor)}
          />
          <select aria-label="Bandwidth unit" value={bwUnit} onChange={(e) => setBwUnit(e.target.value)}>
            {BANDWIDTH_UNITS.map((u) => <option key={u.label}>{u.label}</option>)}
          </select>
        </div>
        <input
          type="range" aria-label="Bandwidth slider (logarithmic)"
          min={BW_LOG_MIN} max={BW_LOG_MAX} step={0.01}
          value={bwSliderPos} onChange={onBwSlider}
        />
        <div className="hint">Slider: 100 Hz to 1 GHz (logarithmic)</div>
      </div>

      <div className="field">
        <div className="field-head">
          <label htmlFor="snr-input">Signal-to-noise ratio</label>
          <span className="badge">dB</span>
        </div>
        <div className="input-row">
          <NumberField id="snr-input" value={snrDb} validate={validateSnr} onCommit={setSnrDb} />
          <span className="unit-suffix">dB</span>
        </div>
        <input
          type="range" aria-label="SNR slider in decibels"
          min={SNR_SLIDER.min} max={SNR_SLIDER.max} step={SNR_SLIDER.step}
          value={Math.min(SNR_SLIDER.max, Math.max(SNR_SLIDER.min, snrDb))}
          onChange={(e) => setSnrDb(Number(e.target.value))}
        />
        <div className="hint">Slider: −20 dB to +50 dB. Negative dB means noise is stronger than the signal.</div>
        <div className="derived" aria-live="polite">
          Linear SNR = 10<sup>{formatNumber(snrDb)}/10</sup> = <strong>{formatNumber(dbToLinear(snrDb))}</strong> <span>(plain ratio, no unit)</span>
        </div>
      </div>
    </section>
  )
}
