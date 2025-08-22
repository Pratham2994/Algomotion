// useSEO.js
import { useEffect } from 'react'
export function useSEO({ title, description, canonical }) {
  useEffect(() => {
    if (title) document.title = title
    if (description) {
      let m = document.querySelector('meta[name="description"]')
      if (!m) { m = document.createElement('meta'); m.setAttribute('name','description'); document.head.appendChild(m) }
      m.setAttribute('content', description)
    }
    if (canonical) {
      let l = document.querySelector('link[rel="canonical"]')
      if (!l) { l = document.createElement('link'); l.setAttribute('rel','canonical'); document.head.appendChild(l) }
      l.setAttribute('href', canonical)
    }
  }, [title, description, canonical])
}

