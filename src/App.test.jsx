// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import App from './App.jsx'

afterEach(cleanup)

const bwInput = () => screen.getByLabelText(/^Bandwidth \(B\)/)
const snrInput = () => screen.getByLabelText(/^Signal-to-noise ratio/)
const big = () => document.querySelector('.result-big').textContent

describe('Stage 4: controls and result', () => {
  it('starts at 20 MHz / 20 dB and shows about 133.2 Mbps', () => {
    render(<App />)
    expect(big()).toBe('133.2 Mbps')
    expect(screen.getAllByText(/100/).length).toBeGreaterThan(0) // linear SNR 100
  })

  it('updates capacity live when SNR is typed (incl. negative dB)', () => {
    render(<App />)
    fireEvent.change(snrInput(), { target: { value: '0' } })
    expect(big()).toBe('20 Mbps') // 0 dB -> C = B
    fireEvent.change(snrInput(), { target: { value: '-10' } })
    expect(big()).toBe('2.75 Mbps') // 20e6*log2(1.1)
  })

  it('rejects bandwidth of zero and keeps the last valid result', () => {
    render(<App />)
    fireEvent.change(bwInput(), { target: { value: '0' } })
    expect(screen.getByRole('alert').textContent).toMatch(/greater than 0/)
    expect(big()).toBe('133.2 Mbps')
    fireEvent.change(bwInput(), { target: { value: '-4' } })
    expect(screen.getByRole('alert').textContent).toMatch(/greater than 0/)
    fireEvent.change(bwInput(), { target: { value: 'abc' } })
    expect(screen.getByRole('alert').textContent).toMatch(/Enter a number/)
  })

  it('presets set bandwidth and SNR', () => {
    render(<App />)
    fireEvent.click(screen.getByText('Voice channel').closest('button'))
    expect(big()).toBe('30.9 kbps')
    expect(bwInput().value).toBe('3.1')
  })

  it('changing the bandwidth unit converts the displayed number, not the bandwidth', () => {
    render(<App />)
    fireEvent.change(screen.getByLabelText('Bandwidth unit'), { target: { value: 'kHz' } })
    expect(bwInput().value).toBe('20000')
    expect(big()).toBe('133.2 Mbps')
  })
})

describe('Stage 5: capacity chart', () => {
  it('draws both curves, the operating point and the required wording', () => {
    const { container } = render(<App />)
    const svg = container.querySelector('svg[role="img"]')
    expect(svg).toBeTruthy()
    expect(svg.querySelector('.ch-curve').getAttribute('d')).toMatch(/^M/)
    expect(svg.querySelector('.ch-curve2')).toBeTruthy()
    expect(svg.querySelector('.ch-point')).toBeTruthy()
    expect(svg.getAttribute('aria-label')).toMatch(/133\.2 Mbps/)
    expect(svg.getAttribute('aria-label')).toMatch(/266\.3 Mbps/) // 2x bandwidth
    expect(container.textContent).toMatch(/Below theoretical capacity limit/)
    expect(container.textContent).toMatch(/theoretical upper bound/)
    expect(container.textContent).not.toMatch(/achievable region/i)
  })

  it('2x curve is exactly twice the main curve at the operating SNR', () => {
    const { container } = render(<App />)
    const readout = container.querySelector('.readout').textContent
    expect(readout).toMatch(/133\.2 Mbps at 20 MHz/)
    expect(readout).toMatch(/266\.3 Mbps at 40 MHz/)
  })

  it('hovering shows a cursor readout and leaving restores the operating point', () => {
    const { container } = render(<App />)
    const overlay = container.querySelector('svg rect')
    overlay.getBoundingClientRect = () => ({ left: 0, width: 100, top: 0, height: 100 })
    fireEvent.pointerMove(overlay, { clientX: 50 })
    expect(container.querySelector('.readout').textContent).toMatch(/Cursor/)
    fireEvent.pointerLeave(overlay)
    expect(container.querySelector('.readout').textContent).toMatch(/Operating point/)
  })

  it('widens the x range for extreme SNR and stays finite for negative SNR', () => {
    const { container } = render(<App />)
    fireEvent.change(snrInput(), { target: { value: '-60' } })
    const d = container.querySelector('.ch-curve').getAttribute('d')
    expect(d).not.toMatch(/NaN|Infinity/)
    fireEvent.change(snrInput(), { target: { value: '90' } })
    expect(container.querySelector('.ch-curve').getAttribute('d')).not.toMatch(/NaN|Infinity/)
  })
})

describe('Stage 6: target analyzer', () => {
  const targetInput = () => screen.getByLabelText(/^Desired data rate/)
  const verdict = () => screen.getByRole('status').textContent

  it('default 100 Mbps target is within the 133.2 Mbps limit and draws a target line', () => {
    const { container } = render(<App />)
    expect(verdict()).toMatch(/100 Mbps is within the Shannon limit of 133\.2 Mbps/)
    expect(container.querySelector('.ch-target')).toBeTruthy()
  })

  it('flags a target above capacity and gives the required SNR / bandwidth', () => {
    const { container } = render(<App />)
    fireEvent.change(targetInput(), { target: { value: '200' } })
    expect(verdict()).toMatch(/exceeds the Shannon limit/)
    // 200 Mbps over 20 MHz = 10 bit/s/Hz -> SNR = 2^10 - 1 = 1023 -> +30.1 dB
    expect(container.textContent).toMatch(/\+30\.1 dB/)
    // 200 Mbps at 20 dB: B = 200e6 / log2(101) = 30.04 MHz
    expect(container.textContent).toMatch(/30\.04 MHz/)
  })

  it('rejects a zero target and keeps the last valid verdict', () => {
    render(<App />)
    fireEvent.change(targetInput(), { target: { value: '0' } })
    expect(screen.getAllByRole('alert').some((a) => /greater than 0/.test(a.textContent))).toBe(true)
    expect(verdict()).toMatch(/100 Mbps is within/)
  })

  it('never claims a target below capacity is guaranteed', () => {
    const { container } = render(<App />)
    expect(container.textContent).toMatch(/does not guarantee/)
  })
})

describe('Stage 7: equations, explanation and theory', () => {
  it('substitutes the live values into the equation steps', () => {
    const { container } = render(<App />)
    const eq = container.querySelector('[aria-labelledby="eq-title"]').textContent
    expect(eq).toMatch(/SNRlinear = 10\(20 \/ 10\) = 100/)
    expect(eq).toMatch(/C = 20,000,000 Hz × log2\(1 \+ 100\)/)
    expect(eq).toMatch(/log2\(101\)/)
    expect(eq).toMatch(/133\.2 Mbps/)
    expect(eq).toMatch(/6\.658 bit\/s\/Hz/)
  })

  it('equation panel follows negative dB input', () => {
    const { container } = render(<App />)
    fireEvent.change(snrInput(), { target: { value: '-10' } })
    const eq = container.querySelector('[aria-labelledby="eq-title"]').textContent
    expect(eq).toMatch(/= 0\.1/)
    expect(eq).toMatch(/log2\(1\.1\)/)
  })

  it('explanation switches regime with SNR and states the upper-bound caveat', () => {
    const { container } = render(<App />)
    const text = () => container.querySelector('[aria-labelledby="explain-title"]').textContent
    expect(text()).toMatch(/High-SNR region/)
    fireEvent.change(snrInput(), { target: { value: '-15' } })
    expect(text()).toMatch(/Noise-dominated region/)
    expect(text()).toMatch(/low-SNR approximation/)
    fireEvent.change(snrInput(), { target: { value: '5' } })
    expect(text()).toMatch(/Low-to-moderate SNR/)
    expect(text()).toMatch(/theoretical upper bound/)
  })

  it('states that doubling bandwidth doubles capacity, and shows the theory table', () => {
    const { container } = render(<App />)
    expect(container.textContent).toMatch(/Doubling bandwidth doubles Shannon capacity/)
    expect(container.querySelector('.db-table')).toBeTruthy()
    expect(container.textContent).toMatch(/dB is not linear/)
  })
})

describe('Refinement pass', () => {
  it('shows capacity / target as a ratio with the x sign, not a percentage', () => {
    const { container } = render(<App />)
    const text = container.querySelector('[aria-labelledby="target-title"]').textContent
    expect(text).toMatch(/1\.332×/)
    expect(text).toMatch(/Capacity \/ target rate/)
    expect(text).not.toMatch(/share of the target|133\.2%/)
    expect(text).toMatch(/Headroom/)
    expect(text).toMatch(/Minimum SNR/)
    expect(text).toMatch(/Minimum bandwidth/)
  })

  it('theory distinguishes capacity from throughput and keeps AWGN assumptions visible', () => {
    const { container } = render(<App />)
    const text = container.querySelector('[aria-labelledby="theory-title"]').textContent
    expect(text).toMatch(/Capacity is not throughput/)
    expect(text).toMatch(/arbitrarily small/)
    expect(text).toMatch(/additive.*white.*Gaussian/)
    expect(text).toMatch(/approximation, not an exact equation/)
    expect(text).toMatch(/not a guaranteed achievable data rate/)
  })

  it('every card has a heading followed by a description', () => {
    const { container } = render(<App />)
    const cards = container.querySelectorAll('section.card')
    expect(cards.length).toBeGreaterThanOrEqual(8)
    cards.forEach((c) => expect(c.querySelector('h2 + .card-desc')).toBeTruthy())
  })

  it('does not call sub-capacity rates achievable or guaranteed', () => {
    const { container } = render(<App />)
    expect(container.textContent).not.toMatch(/achievable region|guaranteed achievable rate|is achievable/i)
  })
})

describe('Branding', () => {
  it('shows the BY SYNVEX label beside the product name and the credit footer', () => {
    const { container } = render(<App />)
    expect(container.querySelector('h1').textContent).toBe('SignalLab')
    expect(container.querySelector('.brand-by').textContent).toMatch(/by synvex/i)
    const credit = container.querySelector('.footer-credit').textContent.replace(/\s+/g, ' ').trim()
    expect(credit).toMatch(/^Designed & Developed by Samarjeet Singh · /)
    expect(credit).toMatch(/Computer Engineering Technology/)
    expect(credit).toMatch(/Seneca Polytechnic/)
    expect(credit).toMatch(/· 2026$/)
  })
  it('keeps the original footer disclaimer and makes no patent claims', () => {
    const { container } = render(<App />)
    expect(container.querySelector('.footer-note').textContent).toMatch(/educational model of the Shannon/)
    expect(container.textContent).not.toMatch(/patent|™|®|pending/i)
  })
})

describe('Page structure: full-width lower sections', () => {
  it('only controls, presets, result and chart live in the two-column dashboard', () => {
    const { container } = render(<App />)
    const layout = container.querySelector('main.layout')
    const inLayout = [...layout.querySelectorAll('section.card')].map((s) => s.getAttribute('aria-labelledby'))
    expect(inLayout).toEqual(['controls-title', 'presets-title', 'result-title', 'chart-title'])
  })

  it('target, equations, explanation and theory are in a separate full-width .analysis grid', () => {
    const { container } = render(<App />)
    const layout = container.querySelector('main.layout')
    const analysis = container.querySelector('.analysis')
    expect(analysis).toBeTruthy()
    expect(layout.contains(analysis)).toBe(false)           // not nested in the 72% column
    expect(layout.nextElementSibling).toBe(analysis)        // directly below the dashboard
    const ids = [...analysis.children].map((s) => s.getAttribute('aria-labelledby'))
    expect(ids).toEqual(['target-title', 'eq-title', 'explain-title', 'theory-title'])
  })

  it('target and equations are the side-by-side pair; explanation and theory span the width', () => {
    const { container } = render(<App />)
    const half = [...container.querySelectorAll('.analysis > .card-half')].map((s) => s.getAttribute('aria-labelledby'))
    expect(half).toEqual(['target-title', 'eq-title'])
  })

  it('explanation keeps all of its content, split into a text and a side column', () => {
    const { container } = render(<App />)
    const body = container.querySelector('.explain-body')
    expect(body.querySelector('.explain-text').textContent).toMatch(/theoretical channel capacity/)
    expect(body.querySelector('.explain-side').textContent).toMatch(/Spend bandwidth/)
    expect(body.querySelector('.explain-side').textContent).toMatch(/theoretical upper bound/)
  })
})

describe('Midnight Indigo redesign: preset selected state', () => {
  const presetButton = (name) => screen.getByText(name).closest('button')

  it('no preset is selected at the default settings', () => {
    render(<App />)
    ;['Voice channel', 'Wi-Fi-style channel', 'LTE-style channel'].forEach((n) =>
      expect(presetButton(n).getAttribute('aria-pressed')).toBe('false'))
  })

  it('a preset shows as selected while it matches, and clears when the SNR changes', () => {
    render(<App />)
    fireEvent.click(presetButton('Voice channel'))
    expect(presetButton('Voice channel').getAttribute('aria-pressed')).toBe('true')
    expect(presetButton('LTE-style channel').getAttribute('aria-pressed')).toBe('false')
    fireEvent.change(snrInput(), { target: { value: '31' } })
    expect(presetButton('Voice channel').getAttribute('aria-pressed')).toBe('false')
  })

  it('preset values are unchanged', () => {
    render(<App />)
    fireEvent.click(presetButton('Wi-Fi-style channel'))
    expect(big()).toBe('166.2 Mbps') // 20 MHz at 25 dB
    fireEvent.click(presetButton('LTE-style channel'))
    expect(big()).toBe('100.6 Mbps') // 20 MHz at 15 dB
  })
})
