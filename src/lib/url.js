// The settings of a page live in its address, so a link opens the same array or the same maze.

export const param = (key, fallback) => new URLSearchParams(location.search).get(key) ?? fallback

export function numberParam(key, fallback, min, max) {
  const value = Number(param(key, fallback))
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : fallback))
}

export function writeParams(values) {
  const next = `?${new URLSearchParams(Object.entries(values).map(([k, v]) => [k, String(v)]))}`
  if (next !== location.search) history.replaceState(null, '', next)
}
