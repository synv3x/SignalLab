// shannon.js - every formula in SignalLab lives here.
// Pure functions: numbers in, numbers out, no React. The UI only calls these,
// so what you see on screen always matches what the unit tests check.
//
// Units used everywhere in this file:
//   bandwidth -> hertz (Hz)        data rate / capacity -> bits per second (bps)
//   snrDb     -> decibels (dB)     snrLinear -> plain power ratio (no unit)

export const LOG10_2_TIMES_10 = 10 * Math.log10(2) // ≈ 3.0103 dB per doubling of linear SNR
export const LOG2_E = Math.LOG2E                   // ≈ 1.4427

// Allowed input ranges (used by validation and by the UI).
export const LIMITS = {
  bandwidthHz: { min: 0, max: 1e12 },   // must be > 0 (min is exclusive)
  snrDb: { min: -100, max: 100 },       // negative dB is fine: noise stronger than signal
  rateBps: { min: 0, max: 1e15 },       // target rate must be > 0
}

/** SNR_linear = 10^(SNR_dB / 10) */
export function dbToLinear(snrDb) {
  return Math.pow(10, snrDb / 10)
}

/** SNR_dB = 10 * log10(SNR_linear). Linear SNR of 0 gives -Infinity dB. */
export function linearToDb(snrLinear) {
  return 10 * Math.log10(snrLinear)
}

/** Throws if bandwidth is not a finite number greater than zero. */
export function assertBandwidth(bandwidthHz) {
  if (!Number.isFinite(bandwidthHz) || bandwidthHz <= 0) {
    throw new RangeError('Bandwidth must be greater than 0 Hz')
  }
}

/** Throws if SNR (dB) is not a finite number. Negative values are allowed. */
export function assertSnrDb(snrDb) {
  if (!Number.isFinite(snrDb)) {
    throw new RangeError('SNR (dB) must be a finite number')
  }
}

/**
 * Spectral efficiency in bits/s/Hz:  C / B = log2(1 + SNR_linear)
 * The dB value is ALWAYS converted to linear first.
 */
export function spectralEfficiency(snrDb) {
  assertSnrDb(snrDb)
  return Math.log2(1 + dbToLinear(snrDb))
}

/** Shannon-Hartley:  C = B * log2(1 + SNR_linear)   (result in bps) */
export function shannonCapacity(bandwidthHz, snrDb) {
  assertBandwidth(bandwidthHz)
  return bandwidthHz * spectralEfficiency(snrDb)
}

/**
 * Minimum SNR (dB) needed for capacity to reach `rateBps` with bandwidth B.
 * From R = B*log2(1+SNR)  ->  SNR = 2^(R/B) - 1.
 * expm1 keeps precision for small R/B; huge R/B would overflow 2^x, so for
 * large x we use the equivalent  SNR_dB ≈ x * 3.0103.
 */
export function minSnrDbForRate(rateBps, bandwidthHz) {
  assertBandwidth(bandwidthHz)
  if (!Number.isFinite(rateBps) || rateBps < 0) throw new RangeError('Rate must be 0 or more')
  if (rateBps === 0) return -Infinity
  const x = rateBps / bandwidthHz // bits/s/Hz required
  if (x > 50) return x * LOG10_2_TIMES_10
  return linearToDb(Math.expm1(x * Math.LN2))
}

/** Minimum bandwidth (Hz) so that capacity reaches `rateBps` at a given SNR. B = R / log2(1+SNR) */
export function minBandwidthForRate(rateBps, snrDb) {
  if (!Number.isFinite(rateBps) || rateBps < 0) throw new RangeError('Rate must be 0 or more')
  return rateBps / spectralEfficiency(snrDb)
}

/**
 * Compare a target rate with the Shannon limit.
 * "withinLimit" means the target does not exceed the theoretical upper bound.
 * It does NOT promise a real system can reach it.
 */
export function compareToTarget(capacityBps, targetBps) {
  return {
    withinLimit: targetBps <= capacityBps,
    marginBps: capacityBps - targetBps,       // positive = headroom, negative = shortfall
    capacityOverTarget: capacityBps / targetBps, // 1.0 = exactly at the limit
  }
}

/** Sample the capacity curve for a chart: array of { snrDb, capacity }. */
export function capacityCurve(bandwidthHz, snrMinDb, snrMaxDb, points = 120) {
  assertBandwidth(bandwidthHz)
  const out = []
  for (let i = 0; i < points; i++) {
    const snrDb = snrMinDb + ((snrMaxDb - snrMinDb) * i) / (points - 1)
    out.push({ snrDb, capacity: shannonCapacity(bandwidthHz, snrDb) })
  }
  return out
}

/** Which regime are we in? Used for the educational text. */
export function regimeFor(snrDb) {
  if (snrDb < 0) return 'noise-dominated'   // signal weaker than noise
  if (snrDb < 10) return 'low'              // capacity grows roughly in proportion to SNR_linear
  return 'high'                             // capacity grows roughly 1 bit/s/Hz per 3 dB
}

/** Low-SNR approximation: log2(1+x) ≈ x*log2(e). Only valid when SNR_linear << 1. */
export function lowSnrApprox(bandwidthHz, snrDb) {
  return bandwidthHz * dbToLinear(snrDb) * LOG2_E
}

/** High-SNR approximation: log2(1+x) ≈ log2(x) = SNR_dB / 3.0103. Only valid when SNR_linear >> 1. */
export function highSnrApprox(bandwidthHz, snrDb) {
  return (bandwidthHz * snrDb) / LOG10_2_TIMES_10
}
