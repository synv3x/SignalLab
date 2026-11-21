<div align="center">

# SignalLab

**Shannon's Law & Channel Capacity Explorer**

An interactive educational web app for the Shannon–Hartley theorem and theoretical channel capacity.

*by SYNVEX*

[**Live demo**](https://signallab-wcm.vercel.app) · [**GitHub repository**](https://github.com/synv3x/SignalLab)

</div>

---

## Contents

- [Live demo and source code](#live-demo-and-source-code)
- [What SignalLab does](#what-signallab-does)
- [Features](#features)
- [Mathematical foundations](#mathematical-foundations)
- [Capacity is not throughput](#capacity-is-not-throughput)
- [Model assumptions and limitations](#model-assumptions-and-limitations)
- [Technology stack](#technology-stack)
- [Getting started](#getting-started)
- [Testing](#testing)
- [Project structure](#project-structure)
- [Author](#author)
- [AI development acknowledgement](#ai-development-acknowledgement)

---

## Live demo and source code

| | |
|---|---|
| **Live website** | [signallab-wcm.vercel.app](https://signallab-wcm.vercel.app) |
| **Source code** | [github.com/synv3x/SignalLab](https://github.com/synv3x/SignalLab) |

## What SignalLab does

Every communication channel has a theoretical maximum rate at which information can be sent reliably.
For a band-limited channel with additive white Gaussian noise (AWGN), the **Shannon–Hartley theorem**
gives that limit using only two quantities: the channel **bandwidth** and the **signal-to-noise ratio (SNR)**.

SignalLab lets you change those two quantities and see the consequences straight away: the capacity,
the equations with your numbers substituted in, a graph of capacity against SNR, and a comparison with a
data rate you want to reach. It is designed for computer engineering students to explore, and to explain
in a live demonstration.

## Features

- **Bandwidth control.** A typed input with a Hz / kHz / MHz / GHz unit selector and a logarithmic slider
  (100 Hz to 1 GHz). Typed values up to 1 THz are accepted.
- **SNR control in dB.** A typed input (−100 dB to +100 dB) and a slider (−20 dB to +50 dB). Negative dB values
  are valid. The equivalent **linear** SNR is always shown beside the dB value, so the two are never confused.
- **Live capacity calculation.** Capacity in readable units (bps up to Tbps) and spectral efficiency in bit/s/Hz,
  updated as you type or drag.
- **Interactive capacity chart.** A hand-drawn SVG chart of capacity against SNR at the current bandwidth, with:
  - the current operating point, with guide lines to both axes;
  - a subtle dashed curve showing capacity at **twice the bandwidth** and the same SNR;
  - a shaded region labelled "Below theoretical capacity limit";
  - a horizontal line for the target data rate;
  - a hover / touch readout of SNR and capacity at the cursor;
  - dB tick labels with the matching linear ratio underneath (on screens wide enough to fit both rows).
- **Presets.** Three illustrative starting points: a voice channel (3.1 kHz), a Wi-Fi-style channel (20 MHz) and an
  LTE-style channel (20 MHz). They are teaching examples, not real data rates or system specifications.
- **Target data-rate analyzer.** Enter a desired rate (bps to Tbps) and see whether it is within the Shannon limit,
  the headroom, the ratio *capacity / target rate*, the **minimum SNR** needed at the current bandwidth and the
  **minimum bandwidth** needed at the current SNR.
- **Step-by-step calculations.** The Shannon–Hartley formula with your live values substituted at each step,
  including the dB-to-linear conversion.
- **Explanations that adapt to the inputs.** Plain-language text that changes with the SNR regime
  (noise-dominated, low-to-moderate, high) and compares spending bandwidth with spending power.
- **Theory notes.** What Shannon proved, capacity versus throughput, the AWGN assumptions, why dB is not linear,
  a dB-to-linear cheat sheet and a short list of experiments to try.
- **Input validation.** Invalid entries (for example a bandwidth of 0, or text that is not a number) show an error,
  and the app keeps using the last valid value.
- **Welcome notice.** A short dialog on first visit that points to the source code on GitHub. It can be dismissed
  with a button or Escape, and stays hidden for the rest of the browser session.
- **Responsive layout.** A full-width dashboard on large screens that stacks into a single column on tablets and phones.
  The interface uses a dark "Midnight Indigo" theme.

## Mathematical foundations

### Shannon–Hartley theorem

```math
C = B \times \log_2\left(1 + \mathrm{SNR}_{\text{linear}}\right)
```

### Converting SNR from decibels to a linear ratio

```math
\mathrm{SNR}_{\text{linear}} = 10^{\,\mathrm{SNR}_{\text{dB}} / 10}
\qquad\Longleftrightarrow\qquad
\mathrm{SNR}_{\text{dB}} = 10\,\log_{10}\left(\mathrm{SNR}_{\text{linear}}\right)
```

The capacity formula needs the **linear** ratio. Putting a dB value straight into it is a common mistake.
SignalLab always converts first, and always labels which form of SNR it is showing.

### Variables and units

| Symbol | Meaning | Unit |
|---|---|---|
| `C` | Channel capacity (theoretical upper bound) | bits per second (bps) |
| `B` | Channel bandwidth | hertz (Hz) |
| `SNR_linear` | Signal power divided by noise power | dimensionless (a plain ratio) |
| `SNR_dB` | The same ratio on a logarithmic scale | decibels (dB) |
| `C / B` | Spectral efficiency | bits per second per hertz (bit/s/Hz) |
| `R` | A target data rate, compared with `C` | bits per second (bps) |

### Other formulas used (`src/lib/shannon.js`)

| Purpose | Formula |
|---|---|
| Spectral efficiency | `C / B = log2(1 + SNR_linear)` |
| Minimum SNR for rate `R` at bandwidth `B` | `SNR_linear = 2^(R/B) − 1`, then converted to dB |
| Minimum bandwidth for rate `R` at a given SNR | `B = R / log2(1 + SNR_linear)` |
| Low-SNR rule of thumb | `C ≈ 1.443 · B · SNR_linear`, only when `SNR_linear ≪ 1` |
| High-SNR rule of thumb | `C ≈ B · SNR_dB / 3.01`, only when `SNR_linear ≫ 1` |

The two rules of thumb are used only in the explanatory text and are **approximations, not exact equations**.
All displayed results come from the exact formula.

## Capacity is not throughput

**Shannon capacity is a theoretical upper bound**, not the data rate a real system delivers.

- **Capacity** is the limit of an idealised channel model. For any rate below it, sufficiently long codes can make
  the error probability arbitrarily small. For any rate above it, reliable communication is impossible.
- **Throughput** is what a real link actually achieves. It is lower because of practical modulation and coding,
  finite code lengths, protocol overhead, retransmissions, hardware imperfections, interference and fading.

A target rate below capacity is therefore **not** a guaranteed achievable rate. It only means the theorem does not
rule it out. For this reason the chart says "Below theoretical capacity limit" and never "achievable".

## Model assumptions and limitations

- **AWGN channel.** The noise is **additive**, **white** (flat across the band) and **Gaussian**.
- **Fixed conditions.** The channel is band-limited to `B`, the signal has a fixed average power, and the SNR is a
  single constant. There is no fading, no interference and no other noise type.
- **Ideal coding.** The error probability approaches zero only as the code length approaches infinity, so delay and
  complexity grow without bound. Real codes are finite.
- **Single channel.** SignalLab does not model multiple antennas (MIMO), multiple users or any specific standard.
- **Illustrative presets.** The preset SNR values are rough teaching numbers, not measurements or specifications.
- **Application limits.** Bandwidth must be greater than 0 and at most 1 THz, SNR is limited to ±100 dB and the
  target rate must be greater than 0 and at most 1 Pbps. These are practical limits of the app, not part of the theory.

## Technology stack

Taken from `package.json` and the source code.

| Area | Tool | Version range |
|---|---|---|
| UI library | [React](https://react.dev/) and `react-dom` | ^19.3.1 |
| Build tool and dev server | [Vite](https://vite.dev/) with `@vitejs/plugin-react` | ^8.3.8 and ^6.3.0 |
| Icons | [Lucide React](https://lucide.dev/) | ^1.77.0 |
| Unit and component tests | [Vitest](https://vitest.dev/), `@testing-library/react`, `jsdom` | ^5.1.1, ^16.3.3, ^31.0.1 |
| Language | JavaScript (ES modules) | |
| Styling | One plain CSS file with CSS custom properties | |
| Chart | Hand-written SVG, no chart library | |

## Getting started

### Prerequisites

[Node.js](https://nodejs.org/) and npm. The test tooling needs Node.js 22.22.2 or newer (or 24.15 or newer);
the development server and production build alone need Node.js 20.19 or newer (or 22.12 or newer).
SignalLab was developed with Node.js 24.20.0 and npm 11.19.0.

### Install and run

```bash
# Get the project
git clone https://github.com/synv3x/SignalLab.git
cd SignalLab

# Install dependencies
npm install

# Start the development server (Vite prints the local address)
npm run dev
```

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Starts the Vite development server with live reload |
| `npm run build` | Creates a production build in `dist/` |
| `npm run preview` | Serves the production build locally, so you can check it before deploying |
| `npm test` | Runs all tests once (`vitest run`) |

## Testing

```bash
npm test
```

This runs every test once and prints a summary. To re-run the tests automatically while you edit code, use
`npx vitest`. To check that the production build compiles, use `npm run build`.

| Test file | What it covers |
|---|---|
| `src/lib/shannon.test.js` | dB ↔ linear conversion; capacity at 0 dB, at negative dB and when doubling bandwidth; the +3 dB rule of thumb; input validation; minimum SNR and bandwidth; target comparison; curve sampling; SNR regimes; the approximations; number and unit formatting |
| `src/lib/chartScale.test.js` | Axis step and tick generation for the chart |
| `src/components/WelcomeModal.test.jsx` | The welcome dialog: opens on a first visit, shows no visible URL, links to the repository in a new tab, and is dismissed by its buttons and Escape, with the choice remembered for the session |
| `src/App.test.jsx` | The whole app in a simulated DOM (jsdom): controls and validation, presets and their selected state, the chart's elements and wording, the target analyzer, the equation panel, explanations, theory text, page structure and branding |

The tests run in a simulated DOM, so they check structure, text and numbers but not the visual appearance.
Check the layout and chart by eye in a real browser.

## Project structure

```
SignalLab/
├── index.html                  # page shell; loads src/main.jsx
├── package.json
├── package-lock.json
├── vite.config.js              # Vite + React plugin, test environment
├── .gitignore
├── README.md
└── src/
    ├── main.jsx                # React entry point
    ├── App.jsx                 # holds the state (bandwidth, SNR, target) and lays out the page
    ├── App.test.jsx            # component tests
    ├── lib/                    # plain JavaScript logic, no React
    │   ├── shannon.js          # every formula (dB/linear, capacity, minimum SNR and bandwidth, ...)
    │   ├── shannon.test.js     # unit tests for the formulas and formatting
    │   ├── format.js           # number and unit formatting (Hz, bps, dB)
    │   ├── chartScale.js       # "nice" axis tick values for the chart
    │   ├── chartScale.test.js  # unit tests for the axis helpers
    │   └── presets.js          # the three illustrative presets
    ├── components/
    │   ├── WelcomeModal.jsx    # first-visit dialog linking to the source code
    │   ├── WelcomeModal.test.jsx # tests for the welcome dialog
    │   ├── Controls.jsx        # bandwidth and SNR sliders and inputs
    │   ├── NumberField.jsx     # validated numeric text input
    │   ├── Presets.jsx         # preset buttons
    │   ├── ResultCard.jsx      # headline capacity and key values
    │   ├── CapacityChart.jsx   # SVG chart: capacity vs SNR, 2x bandwidth curve, target line
    │   ├── TargetAnalyzer.jsx  # target rate vs capacity, minimum SNR and bandwidth
    │   ├── EquationPanel.jsx   # step-by-step equations with live values
    │   ├── Explanation.jsx     # explanation text that adapts to the SNR regime
    │   └── TheorySection.jsx   # background theory and dB cheat sheet
    └── styles/
        └── global.css          # design tokens, layout, controls, chart and theme styling
```

**Design rule:** components contain no formulas of their own. They call `src/lib/shannon.js`, so every number on
screen comes from the same tested functions.

## Author

| | |
|---|---|
| **Project** | SignalLab: Shannon's Law & Channel Capacity Explorer |
| **Brand** | SYNVEX |
| **Author** | Samarjeet Singh |
| **Program** | Computer Engineering Technology (ECT) |
| **Institution** | Seneca Polytechnic |
| **Year** | 2026 |

**Theory reference:** C. E. Shannon, "A Mathematical Theory of Communication", *Bell System Technical Journal*, 1948.

## AI development acknowledgement

This project was built with the assistance of **Claude Code** by Anthropic, an AI coding tool. Claude Code helped
generate and implement the code, tests and documentation. Samarjeet Singh directed the project, chose the stack and
requirements, and reviewed and tested the result. The code was not written entirely by hand.
