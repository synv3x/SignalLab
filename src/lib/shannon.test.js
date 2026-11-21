import { describe, it, expect } from 'vitest'
import {
  dbToLinear, linearToDb, spectralEfficiency, shannonCapacity,
  minSnrDbForRate, minBandwidthForRate, compareToTarget, capacityCurve,
  lowSnrApprox, highSnrApprox, regimeFor,
} from './shannon.js'
import { formatBps, formatHz, formatDb, formatNumber } from './format.js'

describe('SNR conversion', () => {
  it('0 dB is linear 1, 10 dB is 10, 20 dB is 100, 30 dB is 1000', () => {
    expect(dbToLinear(0)).toBeCloseTo(1, 12)
    expect(dbToLinear(10)).toBeCloseTo(10, 10)
    expect(dbToLinear(20)).toBeCloseTo(100, 8)
    expect(dbToLinear(30)).toBeCloseTo(1000, 6)
  })
  it('3 dB is about a factor of 2', () => {
    expect(dbToLinear(3)).toBeCloseTo(1.9953, 3)
  })
  it('negative dB gives linear SNR below 1', () => {
    expect(dbToLinear(-10)).toBeCloseTo(0.1, 12)
  })
  it('round trip dB -> linear -> dB returns the original', () => {
    for (const db of [-30, -3, 0, 7.5, 20, 45]) {
      expect(linearToDb(dbToLinear(db))).toBeCloseTo(db, 10)
    }
  })
})

describe('Shannon capacity', () => {
  it('0 dB gives exactly 1 bit/s/Hz, so C = B', () => {
    expect(spectralEfficiency(0)).toBeCloseTo(1, 12)
    expect(shannonCapacity(1000, 0)).toBeCloseTo(1000, 8)
  })
  it('classic telephone line: 3.1 kHz at 30 dB is about 30.9 kbps', () => {
    expect(shannonCapacity(3100, 30)).toBeCloseTo(30898, -1)
  })
  it('20 MHz at 20 dB is about 133.2 Mbps', () => {
    expect(shannonCapacity(20e6, 20) / 1e6).toBeCloseTo(133.17, 1)
  })
  it('uses LINEAR SNR: 10 dB gives log2(11), not log2(1 + 10 dB)', () => {
    expect(shannonCapacity(1, 10)).toBeCloseTo(Math.log2(11), 12)
  })
  it('accepts negative dB: capacity is positive but below B', () => {
    const c = shannonCapacity(1000, -10)
    expect(c).toBeGreaterThan(0)
    expect(c).toBeCloseTo(1000 * Math.log2(1.1), 8)
    expect(c).toBeLessThan(1000)
  })
  it('doubling bandwidth exactly doubles capacity at fixed SNR', () => {
    expect(shannonCapacity(2e6, 13)).toBeCloseTo(2 * shannonCapacity(1e6, 13), 4)
  })
  it('+3 dB adds only about 1 bit/s/Hz at high SNR', () => {
    const delta = spectralEfficiency(33) - spectralEfficiency(30)
    expect(delta).toBeCloseTo(1, 2)
  })
  it('capacity increases with SNR', () => {
    expect(shannonCapacity(1e6, 11)).toBeGreaterThan(shannonCapacity(1e6, 10))
  })
})

describe('Validation', () => {
  it('rejects zero, negative and non-finite bandwidth', () => {
    expect(() => shannonCapacity(0, 10)).toThrow(RangeError)
    expect(() => shannonCapacity(-5, 10)).toThrow(RangeError)
    expect(() => shannonCapacity(NaN, 10)).toThrow(RangeError)
    expect(() => shannonCapacity(Infinity, 10)).toThrow(RangeError)
  })
  it('rejects non-finite SNR', () => {
    expect(() => shannonCapacity(1000, NaN)).toThrow(RangeError)
    expect(() => shannonCapacity(1000, Infinity)).toThrow(RangeError)
  })
})

describe('Target-rate analysis', () => {
  it('minimum SNR: 1 bit/s/Hz needs 0 dB; 2 bits/s/Hz needs 10*log10(3)', () => {
    expect(minSnrDbForRate(1e6, 1e6)).toBeCloseTo(0, 10)
    expect(minSnrDbForRate(2e6, 1e6)).toBeCloseTo(10 * Math.log10(3), 10)
  })
  it('min SNR is consistent with capacity (round trip)', () => {
    const snr = minSnrDbForRate(50e6, 20e6)
    expect(shannonCapacity(20e6, snr)).toBeCloseTo(50e6, 0)
  })
  it('target 0 needs -Infinity dB', () => {
    expect(minSnrDbForRate(0, 1e6)).toBe(-Infinity)
  })
  it('very large rate/bandwidth ratios do not overflow', () => {
    const db = minSnrDbForRate(1e12, 1)
    expect(Number.isFinite(db)).toBe(true)
    expect(db).toBeGreaterThan(0)
  })
  it('minimum bandwidth is consistent with capacity (round trip)', () => {
    const b = minBandwidthForRate(30e6, 15)
    expect(shannonCapacity(b, 15)).toBeCloseTo(30e6, 0)
  })
  it('compareToTarget reports margin and ratio', () => {
    const ok = compareToTarget(100, 40)
    expect(ok.withinLimit).toBe(true)
    expect(ok.marginBps).toBe(60)
    expect(ok.capacityOverTarget).toBe(2.5)
    const no = compareToTarget(100, 250)
    expect(no.withinLimit).toBe(false)
    expect(no.marginBps).toBe(-150)
  })
  it('a target exactly equal to capacity is within the limit', () => {
    expect(compareToTarget(100, 100).withinLimit).toBe(true)
  })
})

describe('Curve, regimes and approximations', () => {
  it('capacityCurve spans the requested range and matches shannonCapacity', () => {
    const pts = capacityCurve(1e6, -10, 30, 5)
    expect(pts).toHaveLength(5)
    expect(pts[0].snrDb).toBe(-10)
    expect(pts[4].snrDb).toBe(30)
    expect(pts[2].capacity).toBe(shannonCapacity(1e6, 10))
  })
  it('regime classification', () => {
    expect(regimeFor(-5)).toBe('noise-dominated')
    expect(regimeFor(5)).toBe('low')
    expect(regimeFor(20)).toBe('high')
  })
  it('low-SNR approximation is close for tiny SNR', () => {
    const exact = shannonCapacity(1e6, -20)
    expect(lowSnrApprox(1e6, -20) / exact).toBeCloseTo(1, 1)
  })
  it('high-SNR approximation is close for large SNR', () => {
    const exact = shannonCapacity(1e6, 40)
    expect(highSnrApprox(1e6, 40) / exact).toBeCloseTo(1, 2)
  })
})

describe('Formatting', () => {
  it('chooses sensible units', () => {
    expect(formatHz(3100)).toBe('3.1 kHz')
    expect(formatHz(20e6)).toBe('20 MHz')
    expect(formatBps(133.17e6)).toBe('133.2 Mbps')
    expect(formatBps(500)).toBe('500 bps')
  })
  it('formats dB with explicit sign', () => {
    expect(formatDb(20)).toBe('+20 dB')
    expect(formatDb(-5)).toBe('−5 dB')
    expect(formatDb(0)).toBe('0 dB')
    expect(formatDb(-Infinity)).toBe('−∞ dB')
  })
  it('handles non-finite values safely', () => {
    expect(formatNumber(NaN)).toBe('—')
  })
})
