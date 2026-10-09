import { useCallback, useEffect, useState } from 'react'

/**
 * A playhead over a recorded list of steps. Nothing here knows what a step is: the page
 * draws whatever the list says at `cursor`. That is why it can go backwards.
 *
 * total: how many steps there are. perSecond: how fast to play them.
 * recording: anything that names this recording. When it changes, the playhead is back at 0.
 */
export function usePlayer(total, perSecond, recording) {
  const [state, setState] = useState({ cursor: 0, wanted: false, recording })
  // A playhead that belongs to an older recording counts as a fresh one
  const fresh = useCallback((s) => (s.recording === recording ? s : { cursor: 0, wanted: false, recording }), [recording])
  const { cursor, wanted } = fresh(state)
  const playing = wanted && cursor < total

  const change = useCallback((work) => setState((s) => ({ ...fresh(s), ...work(fresh(s)) })), [fresh])
  const clamp = useCallback((n) => Math.max(0, Math.min(total, n)), [total])

  useEffect(() => {
    if (!playing) return
    let id
    let last = performance.now()
    let owed = 0
    const tick = (now) => {
      owed += ((now - last) * perSecond) / 1000
      last = now
      const whole = Math.floor(owed)
      if (whole > 0) {
        owed -= whole
        change((s) => ({ cursor: clamp(s.cursor + whole) }))
      }
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [playing, perSecond, change, clamp])

  const seek = useCallback((to) => change(() => ({ wanted: false, cursor: clamp(to) })), [change, clamp])
  const step = useCallback((by) => change((s) => ({ wanted: false, cursor: clamp(s.cursor + by) })), [change, clamp])
  const toggle = useCallback(
    // Play from the end starts again from the top
    () => change((s) => (s.wanted && s.cursor < total ? { wanted: false } : { wanted: true, cursor: s.cursor >= total ? 0 : s.cursor })),
    [change, total],
  )

  // Space plays and pauses. The arrows step. Home goes back to the start.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('input, select, textarea')) return
      // Space on a button or a link already does what that button does
      if (e.key === ' ' && e.target.closest?.('button, a')) return
      if (e.key === ' ') toggle()
      else if (e.key === 'ArrowRight') step(e.shiftKey ? 10 : 1)
      else if (e.key === 'ArrowLeft') step(e.shiftKey ? -10 : -1)
      else if (e.key === 'Home') seek(0)
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggle, step, seek])

  return { cursor, total, playing, done: cursor >= total, seek, step, toggle }
}
