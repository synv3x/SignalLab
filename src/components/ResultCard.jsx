import { Gauge } from 'lucide-react'
import { formatBps, formatHz, formatNumber, formatDb } from '../lib/format.js'
import { dbToLinear, shannonCapacity, spectralEfficiency } from '../lib/shannon.js'

export default function ResultCard({ bandwidthHz, snrDb }) {
  const capacity = shannonCapacity(bandwidthHz, snrDb)
  const efficiency = spectralEfficiency(snrDb)

  return (
    <section className="card" aria-labelledby="result-title">
      <h2 id="result-title"><Gauge size={18} aria-hidden="true" /> Shannon capacity</h2>
      <p className="card-desc">Theoretical limit for the current settings, not a measured data rate.</p>
      <div className="result-main">
        <div>
          <div className="result-label">Theoretical channel capacity (an upper bound, not actual throughput)</div>
          <div className="result-big" aria-live="polite">{formatBps(capacity)}</div>
        </div>
      </div>
      <div className="stat-row">
        <div className="stat"><b>{formatHz(bandwidthHz)}</b><span>Bandwidth B</span></div>
        <div className="stat"><b>{formatDb(snrDb)}</b><span>SNR in dB</span></div>
        <div className="stat"><b>{formatNumber(dbToLinear(snrDb))}</b><span>SNR linear (ratio)</span></div>
        <div className="stat"><b>{formatNumber(efficiency)} bit/s/Hz</b><span>Spectral efficiency C/B</span></div>
      </div>
    </section>
  )
}
