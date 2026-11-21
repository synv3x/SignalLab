// Illustrative examples only. Bandwidth values follow the assignment brief;
// the SNR values are rough teaching numbers, NOT measured or guaranteed specs.
export const PRESETS = [
  { id: 'voice', name: 'Voice channel', bandwidthHz: 3100, unit: 'kHz', snrDb: 30,
    blurb: '3.1 kHz bandwidth, example SNR 30 dB' },
  { id: 'wifi', name: 'Wi-Fi-style channel', bandwidthHz: 20e6, unit: 'MHz', snrDb: 25,
    blurb: '20 MHz bandwidth, example SNR 25 dB' },
  { id: 'lte', name: 'LTE-style channel', bandwidthHz: 20e6, unit: 'MHz', snrDb: 15,
    blurb: '20 MHz bandwidth, example SNR 15 dB' },
]
