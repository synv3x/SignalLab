import { BookOpen } from 'lucide-react'
import { formatBps, formatDb, formatHz, formatNumber } from '../lib/format.js'
import {
  LOG10_2_TIMES_10, highSnrApprox, lowSnrApprox, regimeFor, shannonCapacity, spectralEfficiency,
} from '../lib/shannon.js'

// Plain-language explanation that changes with the current bandwidth and SNR.
export default function Explanation({ bandwidthHz, snrDb }) {
  const capacity = shannonCapacity(bandwidthHz, snrDb)
  const regime = regimeFor(snrDb)
  const efficiency = spectralEfficiency(snrDb)

  // What would +3 dB (double the linear SNR) or double the bandwidth give us?
  const plus3dB = shannonCapacity(bandwidthHz, snrDb + LOG10_2_TIMES_10)
  const doubleB = shannonCapacity(2 * bandwidthHz, snrDb)

  return (
    <section className="card" aria-labelledby="explain-title">
      <h2 id="explain-title"><BookOpen size={18} aria-hidden="true" /> What this result means</h2>
      <p className="card-desc">A plain-language reading of the current result.</p>
      <div className="prose explain-body">
        <div className="explain-text">
        <p>
          At {formatHz(bandwidthHz)} and {formatDb(snrDb)}, the theoretical channel capacity is{' '}
          <b>{formatBps(capacity)}</b>, or {formatNumber(efficiency)} bit/s for every hertz of bandwidth.
          Under the AWGN model, rates below this can in principle be sent with arbitrarily low error
          probability using sufficiently long codes; rates above it cannot be sent reliably. Capacity is a
          limit of the model, not the throughput a real link would deliver.
        </p>

        {regime === 'noise-dominated' && (
          <p>
            <b>Noise-dominated region.</b> A negative SNR in dB means the noise is stronger than the
            signal (linear SNR below 1). Capacity is still above zero, but it is less than {formatHz(bandwidthHz)} worth of
            bits per second. Here capacity is roughly proportional to the linear SNR
            {snrDb <= -10 && (
              <> (low-SNR approximation C ≈ 1.443·B·SNR<sub>linear</sub> = {formatBps(lowSnrApprox(bandwidthHz, snrDb))}, exact value {formatBps(capacity)})</>
            )}
            , so extra signal power helps a lot.
          </p>
        )}
        {regime === 'low' && (
          <p>
            <b>Low-to-moderate SNR.</b> Between 0 and 10 dB the signal is at least as strong as the noise.
            Capacity is between 1 and about 3.5 bit/s/Hz, and each extra dB of SNR still buys a noticeable gain.
          </p>
        )}
        {regime === 'high' && (
          <p>
            <b>High-SNR region.</b> Capacity now grows only logarithmically with SNR: roughly{' '}
            <b>1 extra bit/s/Hz for every +3 dB</b>. {snrDb >= 20 && (
              <>The high-SNR rule of thumb C ≈ B·SNR<sub>dB</sub>/3.01 gives {formatBps(highSnrApprox(bandwidthHz, snrDb))},
              while the exact formula gives {formatBps(capacity)}. It is only an approximation that improves as SNR grows,
              not an exact equation. </>
            )}
            Doubling the capacity would take a huge power increase: the linear SNR has to be squared.
          </p>
        )}
        </div>

        <div className="explain-side">
        <ul>
          <li>
            <b>Spend bandwidth:</b> doubling B to {formatHz(2 * bandwidthHz)} gives <b>{formatBps(doubleB)}</b>.
            With SNR held constant, capacity scales exactly in proportion to bandwidth.
          </li>
          <li>
            <b>Spend power:</b> doubling the signal power (+3.01 dB, to {formatDb(snrDb + LOG10_2_TIMES_10)}) gives only{' '}
            <b>{formatBps(plus3dB)}</b>, an increase of {formatNumber((plus3dB / capacity - 1) * 100, 3)}%.
          </li>
          <li>
            <b>Why this matters:</b> bandwidth and SNR can be traded against each other. Wider channels
            can reach the same rate with a lower SNR.
          </li>
        </ul>

        <div className="note">
          Shannon capacity is a <b>theoretical upper bound</b>, not a promise. Real systems use practical
          modulation and coding, and have hardware losses, interference and fading, so they run below it.
        </div>
        </div>
      </div>
    </section>
  )
}
