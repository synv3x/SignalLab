import { Lightbulb } from 'lucide-react'
import { PRESETS } from '../lib/presets.js'

// A preset shows as selected while the current bandwidth and SNR still match it (visual only).
export default function Presets({ onPick, bandwidthHz, snrDb }) {
  return (
    <section className="card" aria-labelledby="presets-title">
      <h2 id="presets-title"><Lightbulb size={18} aria-hidden="true" /> Illustrative presets</h2>
      <p className="card-desc">Quick starting points to experiment with.</p>
      <div className="preset-list">
        {PRESETS.map((p) => (
          <button
            key={p.id} type="button" className="preset" onClick={() => onPick(p)}
            aria-pressed={p.bandwidthHz === bandwidthHz && p.snrDb === snrDb}
          >
            <strong>{p.name}</strong>
            <span>{p.blurb}</span>
          </button>
        ))}
      </div>
      <p className="hint" style={{ marginTop: 10 }}>
        These are illustrative bandwidth examples only. They are not real achievable data rates or
        guaranteed system specifications.
      </p>
    </section>
  )
}
