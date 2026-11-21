import { useState } from 'react'
import { Radio } from 'lucide-react'
import Controls from './components/Controls.jsx'
import Presets from './components/Presets.jsx'
import ResultCard from './components/ResultCard.jsx'
import CapacityChart from './components/CapacityChart.jsx'
import TargetAnalyzer from './components/TargetAnalyzer.jsx'
import EquationPanel from './components/EquationPanel.jsx'
import Explanation from './components/Explanation.jsx'
import TheorySection from './components/TheorySection.jsx'

export default function App() {
  // The whole app state: bandwidth (always stored in Hz), its display unit, and SNR in dB.
  const [bandwidthHz, setBandwidthHz] = useState(20e6)
  const [bwUnit, setBwUnit] = useState('MHz')
  const [snrDb, setSnrDb] = useState(20)
  // Target data rate for the comparison (stored in bps, shown in its own unit).
  const [targetBps, setTargetBps] = useState(100e6)
  const [targetUnit, setTargetUnit] = useState('Mbps')

  function applyPreset(p) {
    setBandwidthHz(p.bandwidthHz)
    setBwUnit(p.unit)
    setSnrDb(p.snrDb)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo"><Radio size={26} aria-hidden="true" /></div>
        <div>
          <div className="title-row">
            <h1>SignalLab</h1>
            <span className="brand-by">by SYNVEX</span>
          </div>
          <p>Shannon's Law &amp; Channel Capacity Explorer</p>
        </div>
      </header>

      <main className="layout">
        <aside className="col col-side">
          <Controls
            bandwidthHz={bandwidthHz} setBandwidthHz={setBandwidthHz}
            bwUnit={bwUnit} setBwUnit={setBwUnit}
            snrDb={snrDb} setSnrDb={setSnrDb}
          />
          <Presets onPick={applyPreset} bandwidthHz={bandwidthHz} snrDb={snrDb} />
        </aside>
        <div className="col col-main">
          <ResultCard bandwidthHz={bandwidthHz} snrDb={snrDb} />
          <CapacityChart bandwidthHz={bandwidthHz} snrDb={snrDb} targetBps={targetBps} />
        </div>
      </main>

      {/* Full-width analysis area: starts below the two-column dashboard, so it can use the whole page width. */}
      <div className="analysis">
        <TargetAnalyzer
          bandwidthHz={bandwidthHz} snrDb={snrDb}
          targetBps={targetBps} setTargetBps={setTargetBps}
          targetUnit={targetUnit} setTargetUnit={setTargetUnit}
        />
        <EquationPanel bandwidthHz={bandwidthHz} snrDb={snrDb} />
        <Explanation bandwidthHz={bandwidthHz} snrDb={snrDb} />
        <TheorySection />
      </div>

      <footer className="footer">
        <p className="footer-note">
          SignalLab is an educational model of the Shannon–Hartley theorem. Results are theoretical upper bounds, not predictions for real systems.
        </p>
        <p className="footer-credit">
          <span>Designed &amp; Developed by Samarjeet Singh</span>
          <span className="dot" aria-hidden="true"> · </span>
          <span>Computer Engineering Technology (ECT)</span>
          <span className="dot" aria-hidden="true"> · </span>
          <span>Seneca Polytechnic</span>
          <span className="dot" aria-hidden="true"> · </span>
          <span>2026</span>
        </p>
      </footer>
    </div>
  )
}
