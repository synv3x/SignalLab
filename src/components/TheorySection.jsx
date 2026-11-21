import { GraduationCap } from 'lucide-react'
import { dbToLinear } from '../lib/shannon.js'
import { formatNumber } from '../lib/format.js'

const DB_EXAMPLES = [-10, -3, 0, 3, 10, 20, 30, 40]

// Static background theory, useful as a reference during the demo.
export default function TheorySection() {
  return (
    <section className="card" aria-labelledby="theory-title">
      <h2 id="theory-title"><GraduationCap size={18} aria-hidden="true" /> Theory notes</h2>
      <p className="card-desc">Background for the demo: what the theorem says, what it assumes, and what it does not say.</p>
      <div className="theory-grid">
        <div className="prose">
          <h3>What Shannon proved</h3>
          <p>
            Shannon's noisy-channel coding theorem (1948) says that every noisy channel has a capacity C.
            For any rate <b>below C</b>, there are codes, if you allow them to be long enough, whose
            error probability can be made <b>arbitrarily small</b>. For any rate <b>above C</b>, reliable
            communication is impossible: the error probability cannot be driven to zero. The
            Shannon–Hartley formula gives C for a band-limited channel with additive white Gaussian
            noise (AWGN):
          </p>
          <div className="eq-step"><div className="eq-line result">C = B × log<sub>2</sub>(1 + SNR<sub>linear</sub>)</div></div>
          <ul>
            <li><b>C</b>: channel capacity in bits per second (bps).</li>
            <li><b>B</b>: bandwidth in hertz (Hz).</li>
            <li><b>SNR<sub>linear</sub></b>: signal power divided by noise power, a plain ratio with no unit.</li>
            <li><b>SNR<sub>dB</sub></b>: the same ratio on a log scale, 10·log<sub>10</sub>(SNR<sub>linear</sub>).</li>
          </ul>

          <h3>Capacity is not throughput</h3>
          <p>
            <b>Capacity</b> is the theoretical limit of the channel model, and it is what this app
            calculates. <b>Throughput</b> is what a real link actually delivers, and it is lower. Practical
            modulation and coding, finite code lengths, protocol overhead, retransmissions, hardware
            imperfections, interference and fading all reduce it. A target rate below capacity is
            therefore <b>not</b> a guaranteed achievable data rate. It only means the theorem does not
            rule it out.
          </p>

          <h3>Model assumptions (AWGN)</h3>
          <ul>
            <li>The noise is <b>additive</b>, <b>white</b> (flat across the band) and <b>Gaussian</b>.</li>
            <li>The channel is band-limited to B and the SNR is constant: no fading, no interference.</li>
            <li>The signal has a fixed average power, so SNR is a single number.</li>
            <li>Error probability tends to zero only as code length tends to infinity, so delay and complexity grow without bound.</li>
          </ul>

          <h3>dB is not linear</h3>
          <p>
            The formula needs the <b>linear</b> ratio. Putting a dB number straight into it is a classic
            mistake. Always convert first: SNR<sub>linear</sub> = 10<sup>(SNR<sub>dB</sub>/10)</sup>.
          </p>

          <h3>Approximations are rules of thumb</h3>
          <p>
            For SNR<sub>linear</sub> much greater than 1, log<sub>2</sub>(1 + x) ≈ log<sub>2</sub>(x), so every
            +3 dB (a doubling of linear SNR) adds roughly 1 bit/s/Hz, and C ≈ B·SNR<sub>dB</sub>/3.01. This is
            an approximation, not an exact equation, and it is poor at low SNR. For SNR<sub>linear</sub> much
            less than 1, C ≈ 1.443·B·SNR<sub>linear</sub> is the corresponding approximation. The app always uses
            the exact formula for its results.
          </p>
        </div>

        <div>
          <h3 className="side-heading">dB to linear cheat sheet</h3>
          <table className="db-table">
            <thead><tr><th>SNR (dB)</th><th>SNR (linear)</th><th>C / B (bit/s/Hz)</th></tr></thead>
            <tbody>
              {DB_EXAMPLES.map((db) => (
                <tr key={db}>
                  <td>{db > 0 ? '+' : db < 0 ? '−' : ''}{Math.abs(db)} dB</td>
                  <td>{formatNumber(dbToLinear(db), 4)}</td>
                  <td>{formatNumber(Math.log2(1 + dbToLinear(db)), 3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3 className="side-heading" style={{ marginTop: 18 }}>Things to try in the demo</h3>
          <ul className="try-list">
            <li>Set SNR to 0 dB: capacity equals the bandwidth (1 bit/s/Hz).</li>
            <li>Raise SNR by 3 dB at high SNR: only about 1 bit/s/Hz is added.</li>
            <li>Double the bandwidth: the capacity exactly doubles.</li>
            <li>Enter a target above capacity and read off the SNR or bandwidth that would be needed.</li>
          </ul>
        </div>
      </div>
    </section>
  )
}
