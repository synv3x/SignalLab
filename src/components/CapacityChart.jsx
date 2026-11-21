import { useEffect, useRef, useState } from 'react'
import { LineChart } from 'lucide-react'
import { capacityCurve, shannonCapacity, dbToLinear } from '../lib/shannon.js'
import { RATE_UNITS, bestUnit, formatBps, formatHz, formatNumber, formatDb } from '../lib/format.js'
import { niceAxis } from '../lib/chartScale.js'

// Capacity-vs-SNR chart drawn by hand with SVG (no chart library).
//   x axis: SNR in dB      y axis: capacity C        blue curve: C at bandwidth B
//   grey dashed curve: C at 2B (same SNR)            orange line: optional target rate
export default function CapacityChart({ bandwidthHz, snrDb, targetBps = null }) {
  const wrapRef = useRef(null)
  const [width, setWidth] = useState(640)   // real pixel width of the chart area
  const [hoverDb, setHoverDb] = useState(null) // SNR under the mouse / finger, or null

  // Measure the container so text stays a readable size on phones.
  useEffect(() => {
    const el = wrapRef.current
    if (!el || typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.max(240, Math.floor(entry.contentRect.width)))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // ---- layout (pixels) ----
  const narrow = width < 480
  const margin = { top: 18, right: narrow ? 14 : 24, bottom: narrow ? 54 : 68, left: narrow ? 64 : 76 }
  const height = Math.round(Math.min(480, Math.max(290, width * 0.58)))
  const plotW = width - margin.left - margin.right
  const plotH = height - margin.top - margin.bottom

  // ---- x domain (dB): at least -20..50, widened if the operating point is outside ----
  const xMin = Math.min(-20, Math.floor((snrDb - 5) / 10) * 10)
  const xMax = Math.max(50, Math.ceil((snrDb + 5) / 10) * 10)

  // ---- data: both curves come from the same math functions as the rest of the app ----
  const base = capacityCurve(bandwidthHz, xMin, xMax, 160)
  const double = capacityCurve(2 * bandwidthHz, xMin, xMax, 160)
  const yDataMax = double[double.length - 1].capacity

  // Show the target line only if it is not absurdly far above the curves.
  const targetOnChart = targetBps != null && targetBps <= 2 * yDataMax
  const axis = niceAxis(Math.max(yDataMax, targetOnChart ? targetBps * 1.05 : 0))
  const yUnit = bestUnit(axis.max, RATE_UNITS)

  // ---- scales: data value -> pixel ----
  const sx = (db) => margin.left + ((db - xMin) / (xMax - xMin)) * plotW
  const sy = (bps) => margin.top + plotH - (bps / axis.max) * plotH

  const toPath = (pts) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p.snrDb).toFixed(1)},${sy(p.capacity).toFixed(1)}`).join('')
  const basePath = toPath(base)
  const areaPath = `${basePath}L${sx(xMax).toFixed(1)},${sy(0)}L${sx(xMin).toFixed(1)},${sy(0)}Z`

  // ---- x ticks every 10 dB (20 dB if the range is wide) ----
  const xStep = xMax - xMin > 100 ? 20 : 10
  const xTicks = []
  for (let t = Math.ceil(xMin / xStep) * xStep; t <= xMax; t += xStep) xTicks.push(t)

  // ---- operating point and hover readout ----
  const capacity = shannonCapacity(bandwidthHz, snrDb)
  const capacity2B = shannonCapacity(2 * bandwidthHz, snrDb)
  const px = sx(snrDb)
  const py = sy(capacity)
  const shownDb = hoverDb ?? snrDb

  function onPointerMove(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const fraction = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    setHoverDb(xMin + fraction * (xMax - xMin))
  }

  // Label for the shaded region, placed where the area under the curve is tall enough.
  const labelDb = xMin + 0.68 * (xMax - xMin)
  const labelCap = shannonCapacity(bandwidthHz, labelDb)
  const showRegionLabel = (labelCap / axis.max) * plotH > 46

  const yLabelFor = (v) => formatNumber(v / yUnit.factor, 3)
  const summary =
    `Capacity versus SNR at ${formatHz(bandwidthHz)} bandwidth. ` +
    `At ${formatDb(snrDb)} the Shannon capacity is ${formatBps(capacity)}; ` +
    `with double the bandwidth it would be ${formatBps(capacity2B)}.`

  return (
    <section className="card" aria-labelledby="chart-title">
      <h2 id="chart-title"><LineChart size={18} aria-hidden="true" /> Capacity vs SNR</h2>
      <p className="card-desc">How capacity changes with SNR at the current bandwidth.</p>

      <div className="chart-wrap" ref={wrapRef}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={summary}>
          {/* horizontal grid + y tick labels */}
          {axis.ticks.map((t) => (
            <g key={`y${t}`}>
              <line className="ch-grid" x1={margin.left} x2={width - margin.right} y1={sy(t)} y2={sy(t)} />
              <text className="ch-text" x={margin.left - 8} y={sy(t) + 4} textAnchor="end">{yLabelFor(t)}</text>
            </g>
          ))}

          {/* x ticks: dB on the first row, the same value as a linear ratio on the second */}
          {xTicks.map((t) => (
            <g key={`x${t}`}>
              <line className="ch-grid ch-grid-v" x1={sx(t)} x2={sx(t)} y1={margin.top} y2={margin.top + plotH} />
              <text className="ch-text" x={sx(t)} y={margin.top + plotH + 16} textAnchor="middle">{t}</text>
              {!narrow && (
                <text className="ch-text ch-text-faint" x={sx(t)} y={margin.top + plotH + 32} textAnchor="middle">
                  {formatNumber(dbToLinear(t), 2)}
                </text>
              )}
            </g>
          ))}
          <text className="ch-text ch-axis-title" x={margin.left + plotW / 2} y={height - 8} textAnchor="middle">
            {narrow ? 'SNR (dB)' : 'SNR in dB (top row)  /  linear ratio (grey row)'}
          </text>
          <text
            className="ch-text ch-axis-title" textAnchor="middle"
            transform={`translate(14 ${margin.top + plotH / 2}) rotate(-90)`}
          >
            Capacity C ({yUnit.label})
          </text>

          {/* shaded region: rates below the theoretical limit at this B and SNR */}
          <path className="ch-area" d={areaPath} />
          {showRegionLabel && (
            <text className="ch-text ch-region" x={sx(labelDb)} y={sy(labelCap / 2)} textAnchor="middle">
              <tspan x={sx(labelDb)} dy="-0.2em">Below theoretical</tspan>
              <tspan x={sx(labelDb)} dy="1.2em">capacity limit</tspan>
            </text>
          )}

          {/* the 2x bandwidth curve (subtle) and its label */}
          <path className="ch-curve2" d={toPath(double)} />
          <text
            className="ch-text ch-curve2-label" textAnchor="end"
            x={sx(xMax) - 4} y={Math.max(margin.top + 12, sy(yDataMax) - 6)}
          >
            {narrow ? '2× B' : '2× bandwidth, same SNR'}
          </text>

          {/* the main curve */}
          <path className="ch-curve" d={basePath} />

          {/* optional target-rate line */}
          {targetOnChart && (
            <g>
              <line className="ch-target" x1={margin.left} x2={width - margin.right} y1={sy(targetBps)} y2={sy(targetBps)} />
              <text className="ch-text ch-target-label" x={margin.left + 6} y={sy(targetBps) - 6}>
                Target {formatBps(targetBps)}
              </text>
            </g>
          )}
          {targetBps != null && !targetOnChart && (
            <text className="ch-text ch-target-label" x={margin.left + 6} y={margin.top + 14}>
              Target {formatBps(targetBps)} is far above this chart range
            </text>
          )}

          {/* operating point with guide lines to both axes */}
          <line className="ch-guide" x1={px} x2={px} y1={py} y2={sy(0)} />
          <line className="ch-guide" x1={margin.left} x2={px} y1={py} y2={py} />
          <circle className="ch-point2" cx={px} cy={sy(capacity2B)} r={4.5} />
          <circle className="ch-point" cx={px} cy={py} r={6} />

          {/* hover crosshair */}
          {hoverDb != null && (
            <line className="ch-cross" x1={sx(hoverDb)} x2={sx(hoverDb)} y1={margin.top} y2={margin.top + plotH} />
          )}

          {/* invisible layer that listens for the mouse / touch */}
          <rect
            x={margin.left} y={margin.top} width={plotW} height={plotH} fill="transparent"
            style={{ touchAction: 'pan-y' }}
            onPointerMove={onPointerMove} onPointerDown={onPointerMove} onPointerLeave={() => setHoverDb(null)}
          />
        </svg>
      </div>

      <div className="readout" aria-live="polite">
        <strong>{hoverDb == null ? 'Operating point' : 'Cursor'}:</strong>{' '}
        SNR {formatDb(shownDb)} (linear {formatNumber(dbToLinear(shownDb))}) &rarr;{' '}
        <b>{formatBps(shannonCapacity(bandwidthHz, shownDb))}</b> at {formatHz(bandwidthHz)};{' '}
        <b>{formatBps(shannonCapacity(2 * bandwidthHz, shownDb))}</b> at {formatHz(2 * bandwidthHz)}
      </div>

      <div className="chart-legend">
        <span><i className="lg-curve" />Capacity at B</span>
        <span><i className="lg-curve2" />Capacity at 2B (same SNR)</span>
        <span><i className="lg-area" />Below theoretical capacity limit</span>
        {targetBps != null && <span><i className="lg-target" />Target rate</span>}
      </div>

      <div className="note" style={{ marginTop: 12 }}>
        <p>
          <b>Doubling bandwidth doubles Shannon capacity</b> when SNR is held constant (C = B·log₂(1 + SNR)
          is linear in B), which is why the grey curve is exactly twice as high as the blue one.
        </p>
        <p style={{ marginTop: 6 }}>
          Shannon capacity is a <b>theoretical upper bound</b>. Being below it does not guarantee
          real-world performance: practical modulation, coding, hardware, interference and fading
          all keep real systems under the limit.
        </p>
      </div>
    </section>
  )
}
