import { describe, it, expect } from 'vitest'
import { niceStep, niceAxis } from './chartScale.js'

describe('chart axis helpers', () => {
  it('niceStep rounds to the nearest 1, 2, 5 or 10 times a power of ten', () => {
    expect(niceStep(0.7)).toBe(0.5)
    expect(niceStep(1.3)).toBe(1)
    expect(niceStep(2.5)).toBe(2)
    expect(niceStep(4)).toBe(5)
    expect(niceStep(8)).toBe(10)
    expect(niceStep(26.6e6)).toBe(20e6)
  })
  it('niceStep falls back to 1 for invalid input', () => {
    expect(niceStep(0)).toBe(1)
    expect(niceStep(NaN)).toBe(1)
  })
  it('niceAxis starts at 0 and ends on a round number at or above the max', () => {
    const a = niceAxis(266.3e6)
    expect(a.ticks[0]).toBe(0)
    expect(a.max).toBeGreaterThanOrEqual(266.3e6)
    expect(a.max).toBe(300e6)
    expect(a.ticks).toEqual([0, 50e6, 100e6, 150e6, 200e6, 250e6, 300e6])
  })
  it('niceAxis handles tiny values without floating-point noise', () => {
    const a = niceAxis(0.35)
    expect(a.ticks).toEqual([0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35])
  })
})
