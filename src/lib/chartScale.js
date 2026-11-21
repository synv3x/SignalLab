// chartScale.js - helpers that pick "nice" axis numbers (1, 2, 5, 10, 20, 50 ...).

/** Round a raw step size to the nearest 1, 2, 5 or 10 times a power of ten. */
export function niceStep(rawStep) {
  if (!(rawStep > 0)) return 1
  const exponent = Math.floor(Math.log10(rawStep))
  const fraction = rawStep / Math.pow(10, exponent)
  const nice = fraction <= 1.5 ? 1 : fraction <= 3 ? 2 : fraction <= 7 ? 5 : 10
  return nice * Math.pow(10, exponent)
}

/**
 * Build a y axis that starts at 0 and ends on a round number >= maxValue.
 * Returns { max, step, ticks } where ticks = [0, step, 2*step, ... max].
 */
export function niceAxis(maxValue, approxTicks = 5) {
  const step = niceStep(maxValue / approxTicks)
  const count = Math.max(1, Math.ceil(maxValue / step - 1e-9))
  const ticks = []
  for (let i = 0; i <= count; i++) ticks.push(Number((i * step).toPrecision(12)))
  return { max: ticks[ticks.length - 1], step, ticks }
}
