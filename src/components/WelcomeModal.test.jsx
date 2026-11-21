// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import WelcomeModal from './WelcomeModal.jsx'

beforeEach(() => sessionStorage.clear())
afterEach(cleanup)

describe('WelcomeModal', () => {
  it('shows on first visit, hides the URL text, and links to the repo in a new tab', () => {
    render(<WelcomeModal />)
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(document.body.textContent).not.toContain('github.com')
    const link = screen.getByRole('link', { name: /view on github/i })
    expect(link.getAttribute('href')).toBe('https://github.com/synv3x/SignalLab')
    expect(link.getAttribute('target')).toBe('_blank')
  })
  it('Continue and Escape dismiss and remember for the session', () => {
    const { unmount } = render(<WelcomeModal />)
    fireEvent.click(screen.getByRole('button', { name: /continue to signallab/i }))
    expect(screen.queryByRole('dialog')).toBeNull()
    unmount()
    render(<WelcomeModal />)
    expect(screen.queryByRole('dialog')).toBeNull()
    sessionStorage.clear(); cleanup()
    render(<WelcomeModal />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })
  it('clicking View on GitHub dismisses', () => {
    render(<WelcomeModal />)
    fireEvent.click(screen.getByRole('link', { name: /view on github/i }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
