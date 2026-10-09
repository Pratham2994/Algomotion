const SPEEDS = [0.25, 0.5, 1, 2, 4, 8]

/** Play, pause, one step either way, and a bar to drag through the whole recording. */
export default function Transport({ player, speed, setSpeed }) {
  const { cursor, total, playing, seek, step, toggle } = player
  return (
    <div className="transport">
      <div className="keys">
        <button type="button" onClick={() => seek(0)} disabled={cursor === 0} aria-label="Back to the start" title="Back to the start (Home)">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3h2v10H3zM13 3v10L6 8z" /></svg>
        </button>
        <button type="button" onClick={() => step(-1)} disabled={cursor === 0} aria-label="One step back" title="One step back (Left arrow)">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M11 3v10L4 8z" /></svg>
        </button>
        <button type="button" className="solid" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'} title="Play or pause (Space)">
          {playing ? (
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 3h3v10H4zM9 3h3v10H9z" /></svg>
          ) : (
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11L13 8z" /></svg>
          )}
          <span>{playing ? 'Pause' : cursor >= total && total > 0 ? 'Again' : 'Play'}</span>
        </button>
        <button type="button" onClick={() => step(1)} disabled={cursor >= total} aria-label="One step on" title="One step on (Right arrow)">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3v10l7-5z" /></svg>
        </button>
      </div>
      <input
        className="scrub"
        type="range"
        min="0"
        max={total}
        value={cursor}
        onChange={(e) => seek(Number(e.target.value))}
        aria-label="Position in the recording"
        style={{ '--done': total ? cursor / total : 0 }}
      />
      <span className="where" data-where>
        {cursor.toLocaleString('en')} / {total.toLocaleString('en')}
      </span>
      <label className="speed">
        <span className="sr">Speed</span>
        <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
          {SPEEDS.map((s) => (
            <option key={s} value={s}>
              {s}×
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
