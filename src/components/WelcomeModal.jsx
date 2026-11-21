import { useEffect, useRef, useState } from 'react'
import { ExternalLink } from 'lucide-react'

const REPO_URL = 'https://github.com/synv3x/SignalLab'
const STORAGE_KEY = 'signallab-welcome-dismissed'

// Lucide's current release has no brand icons, so the GitHub mark is drawn inline.
function GithubMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.08 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  )
}

function wasDismissed() {
  try { return sessionStorage.getItem(STORAGE_KEY) === '1' } catch { return false }
}

export default function WelcomeModal() {
  const [open, setOpen] = useState(() => !wasDismissed())
  const dialogRef = useRef(null)
  const primaryRef = useRef(null)

  function dismiss() {
    try { sessionStorage.setItem(STORAGE_KEY, '1') } catch { /* storage unavailable: just close */ }
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return undefined
    const previous = document.activeElement
    primaryRef.current?.focus()
    const scrollLock = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        dismiss()
      } else if (e.key === 'Tab') {
        // Keep keyboard focus inside the dialog.
        const items = dialogRef.current?.querySelectorAll('a[href], button')
        if (!items || items.length === 0) return
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = scrollLock
      if (previous && previous.focus) previous.focus()
    }
  }, [open])

  if (!open) return null

  return (
    <div className="welcome-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) dismiss() }}>
      <div
        className="welcome-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        aria-describedby="welcome-desc"
        ref={dialogRef}
      >
        <p className="welcome-eyebrow">PROJECT SOURCE CODE</p>
        <h2 id="welcome-title">Explore SignalLab on GitHub</h2>
        <p id="welcome-desc" className="welcome-desc">
          Interested in how SignalLab works? The project's source code is available on GitHub. Explore the
          implementation, technologies, and development behind this interactive learning tool.
        </p>
        <a
          ref={primaryRef}
          className="welcome-primary"
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={dismiss}
        >
          <GithubMark />
          <span>View on GitHub</span>
          <ExternalLink size={16} aria-hidden="true" />
        </a>
        <button type="button" className="welcome-secondary" onClick={dismiss}>
          Continue to SignalLab
        </button>
      </div>
    </div>
  )
}
