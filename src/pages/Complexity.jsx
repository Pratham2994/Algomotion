// src/pages/Complexity.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import CompHeader from '../components/complexity/CompHeader'
import CompControls from '../components/complexity/CompControls'
import CompChart from '../components/complexity/CompChart'
import {
  makeArray, median, SORTERS, O_CURVES, COLORS, hashSeed, mulberry32
} from '../lib/benchCore'

export default function Complexity(){
  // Controls
  const [algos, setAlgos] = useState(['merge','quick','heap'])
  const [metric, setMetric] = useState('runtime')
  const [generator, setGenerator] = useState('random')
  const [minN, setMinN] = useState(16)
  const [maxN, setMaxN] = useState(2048)
  const [points, setPoints] = useState(7)
  const [trials, setTrials] = useState(3)
  const [seed, setSeed] = useState(7)
  const [overlays, setOverlays] = useState(['n','n log n','n²'])
  const [logScale, setLogScale] = useState(true)

  // Run state
  const [running, setRunning] = useState(false)
  const [data, setData] = useState([])
  const abortRef = useRef({abort:false})

  const sizeList = useMemo(()=>{
    const xs=[], ratio=Math.pow(maxN/minN, 1/Math.max(1,(points-1))); let v=minN
    for(let i=0;i<points;i++){ xs.push(Math.round(v)); v*=ratio }
    return Array.from(new Set(xs)).sort((a,b)=>a-b)
  }, [minN,maxN,points])

  function toCSV(rows){
    const headers=['n', ...algos.map(k => `${SORTERS[k].label} (${metric})`)]
    const lines=[headers.join(',')]
    for(const row of rows){ lines.push([row.n, ...algos.map(k=> row[k] ?? '')].join(',')) }
    return lines.join('\n')
  }

  async function runSweep(){
    setRunning(true); abortRef.current.abort=false
    const rows=[]
    for(const n of sizeList){
      if(abortRef.current.abort) break
      const row={ n }
      for(const key of algos){
        if(abortRef.current.abort) break
        const fn=SORTERS[key].fn
        const ts=[], cs=[], ws=[]
        for(let t=0;t<trials;t++){
          const arr = makeArray(n, generator, seed + t*101 + n*17)
          const t0=performance.now()
          const {comparisons,writes}=fn(arr)
          const dt=performance.now()-t0
          ts.push(dt); cs.push(comparisons); ws.push(writes)
          if((t & 3)===0) await new Promise(r=>setTimeout(r,0))
        }
        row[key] = metric==='runtime' ? median(ts) : metric==='comparisons' ? median(cs) : median(ws)
      }
      rows.push(row)
      setData(prev=>[...prev,row])
      await new Promise(r=>setTimeout(r,0))
    }
    setRunning(false)
  }

  const onRun   = ()=>{ setData([]); runSweep().catch(()=>setRunning(false)) }
  const onPause = ()=>{ abortRef.current.abort=true; setRunning(false) }
  const onReset = ()=>{ abortRef.current.abort=true; setRunning(false); setData([]) }
  const onExport= ()=>{
    const blob=new Blob([toCSV(data)],{type:'text/csv;charset=utf-8;'})
    const url=URL.createObjectURL(blob); const a=document.createElement('a')
    a.href=url; a.download=`complexity_${metric}.csv`; a.click(); URL.revokeObjectURL(url)
  }

  const overlaySeries = useMemo(()=>{
    if(!data.length) return []
    const n0=data[0].n
    const y0=data[0][algos[0]] || 1
    return overlays.map(name=>{
      const f=O_CURVES[name]; const k=y0 / f(n0)
      return { name, color: COLORS[name], points: data.map(d=>({ n:d.n, y:k * f(d.n) })) }
    })
  }, [data, algos, overlays])

  const yDomain = useMemo(()=>{
    if(!data.length) return ['auto','auto']
    let min=Infinity, max=-Infinity
    for(const row of data){ for(const a of algos){ const y=row[a]; if(y==null) continue; if(y<min) min=y; if(y>max) max=y } }
    for(const s of overlaySeries){ for(const p of s.points){ if(p.y<min) min=p.y; if(p.y>max) max=p.y } }
    if(!isFinite(min)||!isFinite(max)) return ['auto','auto']
    if(min===max){ max=min+1 }
    return [logScale ? Math.max(0.1, min*0.8) : 0, max*1.2]
  }, [data, algos, overlaySeries, logScale])

  const metricLabel = metric==='runtime' ? 'Runtime (ms)' : metric==='comparisons' ? 'Comparisons' : 'Writes'

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6">
      <CompHeader />
      <CompControls
        algos={algos} setAlgos={setAlgos}
        metric={metric} setMetric={setMetric}
        generator={generator} setGenerator={setGenerator}
        minN={minN} setMinN={setMinN}
        maxN={maxN} setMaxN={setMaxN}
        points={points} setPoints={setPoints}
        trials={trials} setTrials={setTrials}
        seed={seed} setSeed={setSeed}
        overlays={overlays} setOverlays={setOverlays}
        logScale={logScale} setLogScale={setLogScale}
        running={running}
        onRun={onRun} onPause={onPause} onReset={onReset} onExport={onExport}
      />
      <CompChart
        data={data}
        algos={algos}
        overlaySeries={overlaySeries}
        yDomain={yDomain}
        metricLabel={metricLabel}
        logScale={logScale}
      />
    </div>
  )
}
