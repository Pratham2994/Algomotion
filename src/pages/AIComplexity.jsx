import { useEffect, useRef, useState } from 'react'
import { useSEO } from '../hooks/useSEO'

const LANGS = ['Auto-detect', 'JavaScript', 'TypeScript', 'Python', 'C++', 'Java', 'Go', 'Rust', 'C', 'Kotlin', 'Swift', 'PHP']

const SAMPLE = `function twoSum(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) return [i, j]
    }
  }
  return null
}`

const list = (value) => (Array.isArray(value) ? value : value ? [String(value)] : []).filter(Boolean)
const yesNo = (value) => (value === true ? 'Yes' : value === false ? 'No' : value ? String(value) : '')

function Lines({ title, items }) {
  if (!items.length) return null
  return (
    <div>
      <h3>{title}</h3>
      <ul className="plain">
        {items.map((text) => (
          <li key={text}>{text}</li>
        ))}
      </ul>
    </div>
  )
}

function Result({ res }) {
  const time = res.timeComplexity || {}
  const facts = [
    ['Kind', res.category],
    ['Approach', res.paradigm],
    ['Stable', yesNo(res.stable)],
    ['In place', yesNo(res.inPlace)],
  ].filter(([, value]) => value)
  const pseudo = Array.isArray(res.pseudocode) ? res.pseudocode.join('\n') : res.pseudocode

  return (
    <section className="stage answer" data-answer>
      <h2>{res.algorithmName || 'Your code'}</h2>
      <dl className="costs">
        {[
          ['Best', time.bestCase],
          ['Average', time.averageCase],
          ['Worst', time.worstCase],
        ]
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
      </dl>
      {res.spaceComplexity && (
        <p>
          <span className="eyebrow">Space</span> {res.spaceComplexity}
        </p>
      )}
      {res.summary && <p className="lede">{res.summary}</p>}
      {facts.length > 0 && (
        <ul className="tags">
          {facts.map(([label, value]) => (
            <li key={label}>
              {label}: {value}
            </li>
          ))}
          {list(res.primaryDataStructures).map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      )}
      <div className="columns">
        <Lines title="Where the time goes" items={list(res.bottlenecks)} />
        <Lines title="What could be faster" items={list(res.possibleOptimizations)} />
        <Lines title="It assumes" items={list(res.assumptions)} />
        <Lines title="Used for" items={list(res.commonUseCases)} />
        <Lines title="Close relatives" items={list(res.relatedAlgorithms)} />
      </div>
      {pseudo && <pre className="code">{pseudo}</pre>}
    </section>
  )
}

export default function AIComplexity() {
  useSEO({
    title: 'Code check - Algomotion',
    description: 'Paste a function and a model estimates its Big-O, says where the time goes, and what could be faster.',
  })
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('Auto-detect')
  const [loading, setLoading] = useState(false)
  const [problem, setProblem] = useState('')
  const [detail, setDetail] = useState('')
  const [res, setRes] = useState(null)
  const request = useRef(null)

  useEffect(() => () => request.current?.abort(), [])

  async function analyze() {
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    setProblem('')
    setDetail('')
    setRes(null)
    setLoading(true)
    try {
      const r = await fetch('/api/complexity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language: language === 'Auto-detect' ? '' : language }),
        signal: controller.signal,
      })
      const data = await r.json().catch(() => null)
      if (!r.ok || !data?.ok) {
        setProblem(
          r.status === 404 || !data
            ? 'The model sits behind a server function that only exists on the deployed site. It does not run with npm run dev.'
            : data?.error || 'The request failed.',
        )
        setDetail(typeof data?.details === 'string' ? data.details : data?.details ? JSON.stringify(data.details, null, 2) : '')
      } else if (!data.result) {
        setProblem(data.warning || 'The model answered, but not in a form this page can read. Try again.')
      } else {
        setRes(data.result)
        if (window.gtag) window.gtag('event', 'ai_complexity_run')
      }
    } catch (e) {
      if (e.name !== 'AbortError') setProblem('The request did not get through.')
    } finally {
      if (request.current === controller) {
        setLoading(false)
        request.current = null
      }
    }
  }

  return (
    <div className="page">
      <div className="lead">
        <p className="eyebrow">Code check</p>
        <h1>Paste a function. Get its Big-O.</h1>
        <p className="lede">
          A language model reads the code and estimates the cost. It is an estimate. It is usually right about loops
          and often wrong about clever tricks, so read the reasons, not only the answer.
        </p>
      </div>

      <section className="stage">
        <textarea
          className="code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Paste code here"
          spellCheck="false"
          rows="14"
          aria-label="Code to check"
        />
        <div className="transport">
          <div className="keys">
            <button type="button" className="solid" onClick={analyze} disabled={loading || code.trim().length < 4}>
              <span>{loading ? 'Reading it' : 'Check it'}</span>
            </button>
            <button type="button" onClick={() => setCode(SAMPLE)} disabled={loading}>
              <span>Use an example</span>
            </button>
          </div>
          <span className="where">{code.length.toLocaleString('en')} characters</span>
          <label className="speed">
            <span className="sr">Language</span>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              {LANGS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </label>
        </div>
        {problem && (
          <div className="problem" role="alert">
            <p>{problem}</p>
            {detail && (
              <details>
                <summary>What the server said</summary>
                <pre className="code">{detail}</pre>
              </details>
            )}
          </div>
        )}
      </section>

      {res && <Result res={res} />}
    </div>
  )
}
