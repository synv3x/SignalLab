import { Target, CheckCircle2, XCircle } from 'lucide-react'
import NumberField from './NumberField.jsx'
import { RATE_UNITS, formatBps, formatHz, formatDb, formatNumber } from '../lib/format.js'
import {
  LIMITS, compareToTarget, dbToLinear, minBandwidthForRate, minSnrDbForRate, shannonCapacity,
} from '../lib/shannon.js'

// Compares a desired data rate with the Shannon limit of the current channel.
export default function TargetAnalyzer({ bandwidthHz, snrDb, targetBps, setTargetBps, targetUnit, setTargetUnit }) {
  const unit = RATE_UNITS.find((u) => u.label === targetUnit)

  const capacity = shannonCapacity(bandwidthHz, snrDb)
  const { withinLimit, marginBps, capacityOverTarget } = compareToTarget(capacity, targetBps)
  const neededSnrDb = minSnrDbForRate(targetBps, bandwidthHz)   // at the current bandwidth
  const neededBandwidthHz = minBandwidthForRate(targetBps, snrDb) // at the current SNR

  const validateTarget = (n) => {
    if (n <= 0) return 'Target rate must be greater than 0.'
    if (n * unit.factor > LIMITS.rateBps.max) return 'Target rate is too large.'
    return null
  }

  return (
    <section className="card card-half" aria-labelledby="target-title">
      <h2 id="target-title"><Target size={18} aria-hidden="true" /> Target data-rate check</h2>
      <p className="card-desc">Compare a desired data rate with the theoretical limit.</p>

      <div className="field">
        <div className="field-head">
          <label htmlFor="target-input">Desired data rate (R)</label>
          <span className="badge">bps</span>
        </div>
        <div className="input-row" style={{ maxWidth: 360 }}>
          <NumberField
            id="target-input"
            value={targetBps / unit.factor}
            validate={validateTarget}
            onCommit={(n) => setTargetBps(n * unit.factor)}
          />
          <select aria-label="Target rate unit" value={targetUnit} onChange={(e) => setTargetUnit(e.target.value)}>
            {RATE_UNITS.map((u) => <option key={u.label}>{u.label}</option>)}
          </select>
        </div>
      </div>

      <div className={`verdict ${withinLimit ? 'ok' : 'no'}`} role="status">
        {withinLimit ? <CheckCircle2 size={22} aria-hidden="true" /> : <XCircle size={22} aria-hidden="true" />}
        <span>
          {withinLimit
            ? `${formatBps(targetBps)} is within the Shannon limit of ${formatBps(capacity)}.`
            : `${formatBps(targetBps)} exceeds the Shannon limit of ${formatBps(capacity)}.`}
        </span>
      </div>

      <div className="stat-row">
        <div className="stat">
          <b>{marginBps >= 0 ? '+' : '−'}{formatBps(Math.abs(marginBps))}</b>
          <span>{marginBps >= 0 ? 'Headroom below the limit (C − R)' : 'Shortfall (C − R)'}</span>
        </div>
        <div className="stat">
          <b>{formatNumber(capacityOverTarget, 4)}×</b>
          <span>Capacity / target rate (C / R)</span>
        </div>
        <div className="stat">
          <b>{formatDb(neededSnrDb)}</b>
          <span>
            Minimum SNR at {formatHz(bandwidthHz)} (linear {formatNumber(dbToLinear(neededSnrDb))})
          </span>
        </div>
        <div className="stat">
          <b>{formatHz(neededBandwidthHz)}</b>
          <span>Minimum bandwidth at {formatDb(snrDb)}</span>
        </div>
      </div>

      <div className="prose" style={{ marginTop: 14 }}>
        <p>
          {withinLimit
            ? `Your channel has ${formatDb(snrDb - neededSnrDb).replace('+', '')} more SNR than the theoretical minimum for this rate (${formatDb(snrDb)} vs ${formatDb(neededSnrDb)}).`
            : `To reach this rate at ${formatHz(bandwidthHz)}, SNR would need to rise by ${formatDb(neededSnrDb - snrDb).replace('+', '')} to at least ${formatDb(neededSnrDb)}, or bandwidth would need to grow to at least ${formatHz(neededBandwidthHz)} at the current SNR.`}
        </p>
        <p className="hint">
          {withinLimit
            ? 'Being within the limit does not guarantee that a real system reaches this rate. Shannon capacity is a theoretical upper bound; real modulation, coding, hardware and interference all fall short of it.'
            : 'Above the limit, Shannon’s theorem says no coding scheme, however clever, can deliver reliable communication at this rate over this channel.'}
        </p>
      </div>
    </section>
  )
}
