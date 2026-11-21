import { Sigma } from 'lucide-react'
import { formatBps, formatNumber } from '../lib/format.js'
import { dbToLinear, shannonCapacity, spectralEfficiency } from '../lib/shannon.js'

// Shows the Shannon-Hartley calculation step by step with the live values substituted.
// Every number comes from the same functions the result card uses.
export default function EquationPanel({ bandwidthHz, snrDb }) {
  const snrLinear = dbToLinear(snrDb)
  const efficiency = spectralEfficiency(snrDb)
  const capacity = shannonCapacity(bandwidthHz, snrDb)

  const B = `${formatNumber(bandwidthHz, 6)} Hz`
  const onePlus = formatNumber(1 + snrLinear)
  const dbText = formatNumber(snrDb)

  return (
    <section className="card card-half" aria-labelledby="eq-title">
      <h2 id="eq-title"><Sigma size={18} aria-hidden="true" /> The calculation, step by step</h2>
      <p className="card-desc">Every number below is computed from your current settings.</p>
      <div className="eq-steps">
        <div className="eq-step">
          <div className="eq-title">Shannon–Hartley theorem</div>
          <div className="eq-line">C = B × log<sub>2</sub>(1 + SNR<sub>linear</sub>)</div>
        </div>

        <div className="eq-step">
          <div className="eq-title">Step 1: convert SNR from dB to a linear ratio</div>
          <div className="eq-line">SNR<sub>linear</sub> = 10<sup>(SNR<sub>dB</sub> / 10)</sup></div>
          <div className="eq-line">SNR<sub>linear</sub> = 10<sup>({dbText} / 10)</sup> = <b>{formatNumber(snrLinear)}</b></div>
        </div>

        <div className="eq-step">
          <div className="eq-title">Step 2: substitute into the capacity formula</div>
          <div className="eq-line">C = {B} × log<sub>2</sub>(1 + {formatNumber(snrLinear)})</div>
          <div className="eq-line">C = {B} × log<sub>2</sub>({onePlus})</div>
          <div className="eq-line">C = {B} × {formatNumber(efficiency)} bit/s/Hz</div>
          <div className="eq-line result">C = {formatNumber(capacity, 6)} bps ≈ {formatBps(capacity)}</div>
        </div>

        <div className="eq-step">
          <div className="eq-title">Spectral efficiency (capacity per hertz)</div>
          <div className="eq-line">C / B = log<sub>2</sub>(1 + SNR<sub>linear</sub>) = {formatNumber(efficiency)} bit/s/Hz</div>
        </div>
      </div>
    </section>
  )
}
