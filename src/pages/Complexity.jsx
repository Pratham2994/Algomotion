import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Card, CardHeader, CardContent, Typography, Grid, Box,
  FormControl, InputLabel, Select, MenuItem, Button, Chip, Slider, Checkbox, ListItemText,
} from '@mui/material'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import PauseRoundedIcon from '@mui/icons-material/PauseRounded'
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts'

/* ========= tiny utils ========= */
function mulberry32(seed){let t=seed>>>0;return function(){t+=0x6D2B79F5;let r=Math.imul(t^(t>>>15),1|t);r^=r+Math.imul(r^(r>>>7),61|r);return((r^(r>>>14))>>>0)/4294967296}}
function hashSeed(...vals){let h=2166136261;for(const ch of vals.join('|')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
const median = arr => { if(!arr.length) return 0; const a=[...arr].sort((x,y)=>x-y); const m=(a.length-1)/2; return a.length%2 ? a[m|0] : (a[m|0]+a[(m+1)|0])/2 }

/* ========= array generators ========= */
function makeArray(n, kind, seed){
  const rng = mulberry32(hashSeed('arr', n, kind, seed))
  if(kind==='reversed'){
    return Array.from({length:n}, (_,i)=> n - i)
  } else if(kind==='nearly'){
    const a = Array.from({length:n}, () => (rng()*1000|0))
    // light local swaps
    const swaps = Math.max(1, Math.floor(n*0.05))
    for(let k=0;k<swaps;k++){
      const i=(rng()*n)|0, j=Math.min(n-1, i+((rng()*5)|0))
      ;[a[i],a[j]]=[a[j],a[i]]
    }
    return a
  } else if(kind==='fewunique'){
    const vals = Array.from({length:Math.max(2, Math.floor(Math.log2(n)))} ,()=> (rng()*100|0))
    return Array.from({length:n}, ()=> vals[(rng()*vals.length)|0])
  }
  // random default
  return Array.from({length:n}, ()=>(rng()*100000|0))
}

/* ========= sorting metrics (headless) ========= */
/* Return {comparisons, writes} — mirror what your viz does. */
function bubbleMeasure(a0){
  const a=a0.slice(); let c=0,w=0
  for(let i=0;i<a.length-1;i++){
    for(let j=0;j<a.length-1-i;j++){
      c++; if(a[j]>a[j+1]){ [a[j],a[j+1]]=[a[j+1],a[j]]; w++ }
    }
  }
  return {comparisons:c,writes:w}
}
function insertionMeasure(a0){
  const a=a0.slice(); let c=0,w=0
  for(let i=1;i<a.length;i++){
    const key=a[i]; let j=i-1
    while(j>=0){ c++; if(a[j]>key){ a[j+1]=a[j]; w++; j-- } else break }
    a[j+1]=key; w++
  }
  return {comparisons:c,writes:w}
}
function selectionMeasure(a0){
  const a=a0.slice(); let c=0,w=0
  for(let i=0;i<a.length-1;i++){
    let m=i
    for(let j=i+1;j<a.length;j++){ c++; if(a[j]<a[m]) m=j }
    if(m!==i){ [a[i],a[m]]=[a[m],a[i]]; w++ }
  }
  return {comparisons:c,writes:w}
}
// bottom-up merge
function mergeMeasure(a0){
  const n=a0.length, a=a0.slice(), aux=new Array(n); let c=0,w=0
  for(let sz=1; sz<n; sz<<=1){
    for(let lo=0; lo<n-sz; lo+=(sz<<1)){
      const mid=lo+sz-1, hi=Math.min(lo+(sz<<1)-1, n-1)
      for(let k=lo;k<=hi;k++) aux[k]=a[k]
      let i=lo, j=mid+1
      for(let k=lo;k<=hi;k++){
        if(i>mid){ a[k]=aux[j++]; w++ }
        else if(j>hi){ a[k]=aux[i++]; w++ }
        else{ c++; if(aux[j]<aux[i]){ a[k]=aux[j++]; w++ } else { a[k]=aux[i++]; w++ } }
      }
    }
  }
  return {comparisons:c,writes:w}
}
// quick (Lomuto)
function quickMeasure(a0){
  const a=a0.slice(); let c=0,w=0
  function part(lo,hi){
    const pivot=a[hi]; let i=lo
    for(let j=lo;j<hi;j++){ c++; if(a[j]<=pivot){ if(i!==j){ [a[i],a[j]]=[a[j],a[i]]; w++ } i++ } }
    if(i!==hi){ [a[i],a[hi]]=[a[hi],a[i]]; w++ }
    return i
  }
  function qs(lo,hi){ if(lo>=hi) return; const p=part(lo,hi); qs(lo,p-1); qs(p+1,hi) }
  qs(0,a.length-1); return {comparisons:c,writes:w}
}
// heap (max-heap)
function heapMeasure(a0){
  const a=a0.slice(); let c=0,w=0, n=a.length
  function sift(i, size){
    while(true){
      const l=2*i+1, r=2*i+2
      if(l>=size) break
      let big=l
      if(r<size){ c++; if(a[r]>a[l]) big=r }
      c++; if(a[i]>=a[big]) break
      ;[a[i],a[big]]=[a[big],a[i]]; w++; i=big
    }
  }
  for(let i=(n>>1)-1;i>=0;i--) sift(i,n)
  for(let end=n-1;end>0;end--){ [a[0],a[end]]=[a[end],a[0]]; w++; sift(0,end) }
  return {comparisons:c,writes:w}
}

const SORTERS = {
  bubble:   {label:'Bubble',   fn:bubbleMeasure,    bigO:'O(n²)'},
  insertion:{label:'Insertion',fn:insertionMeasure, bigO:'O(n²)'},
  selection:{label:'Selection',fn:selectionMeasure, bigO:'O(n²)'},
  merge:    {label:'Merge',    fn:mergeMeasure,     bigO:'O(n log n)'},
  quick:    {label:'Quick',    fn:quickMeasure,     bigO:'O(n log n)'},
  heap:     {label:'Heap',     fn:heapMeasure,      bigO:'O(n log n)'},
}

/* ========= Big-O helpers ========= */
const O_CURVES = {
  'n': (n)=> n,
  'n log n': (n)=> n * Math.log2(Math.max(2,n)),
  'n²': (n)=> n*n,
}
const COLORS = {
  bubble: '#f97316', insertion:'#f59e0b', selection:'#eab308',
  merge:  '#22c55e', quick:   '#06b6d4',  heap:     '#8b5cf6',
  // overlays (dashed)
  'n': '#94a3b8', 'n log n': '#9ca3af', 'n²': '#a3a3a3'
}

/* ========= main component ========= */
export default function Complexity(){
  // Controls
  const [algos, setAlgos] = useState(['merge','quick','heap'])
  const [metric, setMetric] = useState('runtime') // runtime | comparisons | writes
  const [generator, setGenerator] = useState('random') // random | reversed | nearly | fewunique
  const [minN, setMinN] = useState(16)
  const [maxN, setMaxN] = useState(2048)
  const [points, setPoints] = useState(7)  // how many sizes in sweep
  const [trials, setTrials] = useState(3)
  const [seed, setSeed] = useState(7)
  const [overlays, setOverlays] = useState(['n','n log n','n²'])
  const [logScale, setLogScale] = useState(true)

  // Run state
  const [running, setRunning] = useState(false)
  const [data, setData] = useState([])  // [{n, merge:val, quick:val, ...}]
  const abortRef = useRef({abort:false})

  const sizeList = useMemo(()=>{
    // geometric-ish spacing between minN and maxN
    const xs = []
    const ratio = Math.pow(maxN/minN, 1/Math.max(1, (points-1)))
    let v = minN
    for(let i=0;i<points;i++){ xs.push(Math.round(v)); v*=ratio }
    // ensure unique & sorted
    return Array.from(new Set(xs)).sort((a,b)=>a-b)
  }, [minN,maxN,points])

  function toCSV(rows){
    const headers = ['n', ...algos.map(k => `${SORTERS[k].label} (${metric})`)]
    const lines = [headers.join(',')]
    for(const row of rows){
      lines.push([row.n, ...algos.map(k => row[k] ?? '')].join(','))
    }
    return lines.join('\n')
  }

  async function runSweep(){
    setRunning(true); abortRef.current.abort=false
    const rows = []
    for(const n of sizeList){
      if(abortRef.current.abort) break
      const row = { n }
      for(const key of algos){
        if(abortRef.current.abort) break
        const fn = SORTERS[key].fn
        const ts = [], cs = [], ws = []
        for(let t=0;t<trials;t++){
          const arr = makeArray(n, generator, seed + t*101 + n*17)
          const t0 = performance.now()
          const {comparisons,writes} = fn(arr)
          const dt = performance.now() - t0
          ts.push(dt); cs.push(comparisons); ws.push(writes)
          // let UI breathe
          if((t & 3) === 0) await new Promise(r=>setTimeout(r,0))
        }
        row[key] = metric==='runtime' ? median(ts)
                  : metric==='comparisons' ? median(cs)
                  : median(ws)
      }
      rows.push(row)
      setData(prev => [...prev, row])
      // yield to UI
      await new Promise(r=>setTimeout(r,0))
    }
    setRunning(false)
  }

  function onRun(){
    setData([]); runSweep().catch(()=>setRunning(false))
  }
  function onPause(){ abortRef.current.abort=true; setRunning(false) }
  function onReset(){ abortRef.current.abort=true; setRunning(false); setData([]) }
  function onExport(){
    const blob = new Blob([toCSV(data)], {type: 'text/csv;charset=utf-8;'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `complexity_${metric}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const overlaySeries = useMemo(()=>{
    if(!data.length) return []
    const n0 = data[0].n
    // pick the first algo's y0 as scale reference
    const y0 = data[0][algos[0]] || 1
    return overlays.map(name => {
      const f = O_CURVES[name]
      const k = y0 / f(n0)
      return {
        name,
        color: COLORS[name],
        points: data.map(d => ({ n:d.n, y:k * f(d.n) }))
      }
    })
  }, [data, algos, overlays])

  const yDomain = useMemo(()=>{
    if(!data.length) return ['auto','auto']
    let min=Infinity, max=-Infinity
    for(const row of data){
      for(const a of algos){
        const y=row[a]; if(y==null) continue
        if(y<min) min=y; if(y>max) max=y
      }
    }
    // include overlays
    for(const s of overlaySeries){
      for(const p of s.points){ if(p.y<min) min=p.y; if(p.y>max) max=p.y }
    }
    if(!isFinite(min) || !isFinite(max)) return ['auto','auto']
    if(min===max){ max=min+1 }
    return [logScale ? Math.max(0.1, min*0.8) : 0, max*1.2]
  }, [data, algos, overlaySeries, logScale])

  const metricLabel = metric==='runtime' ? 'Runtime (ms)' : metric==='comparisons' ? 'Comparisons' : 'Writes'

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Typography variant="h4" className="!font-bold text-slate-100">Complexity Explorer</Typography>
            <Chip label="Sorting" className="bg-slate-800 text-slate-300 border border-slate-600" />
          </div>
          <Typography variant="body1" className="text-slate-400 max-w-2xl">
            Benchmark sorting algorithms across input sizes. See measured growth vs Big-O curves.
          </Typography>
        </div>
      </div>

      {/* Controls */}
      <Card variant="outlined" sx={{ borderColor:'#1f2937', background:'#0a1220' }}>
        <CardHeader title={<Typography variant="h6" className="!font-semibold">Controls</Typography>} sx={{ pb:1 }} />
        <CardContent>
          <Grid container spacing={4}>
            {/* Algorithms multi-select */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="medium">
                <InputLabel id="algos">Algorithms</InputLabel>
                <Select
                  labelId="algos" multiple value={algos} label="Algorithms"
                  onChange={(e)=>setAlgos(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                  renderValue={(selected)=>selected.map(k=>SORTERS[k].label).join(', ')}
                  sx={{ '& .MuiSelect-select':{ color:'#e2e8f0' }, '& .MuiOutlinedInput-notchedOutline':{ borderColor:'#374151' } }}
                >
                  {Object.keys(SORTERS).map(k=>(
                    <MenuItem key={k} value={k}>
                      <Checkbox checked={algos.indexOf(k)>-1} />
                      <ListItemText primary={SORTERS[k].label} secondary={SORTERS[k].bigO} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Metric */}
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="medium">
                <InputLabel id="metric">Metric</InputLabel>
                <Select
                  labelId="metric" value={metric} label="Metric"
                  onChange={e=>setMetric(e.target.value)}
                  sx={{ '& .MuiSelect-select':{ color:'#e2e8f0' }, '& .MuiOutlinedInput-notchedOutline':{ borderColor:'#374151' } }}
                >
                  <MenuItem value="runtime">Runtime (ms)</MenuItem>
                  <MenuItem value="comparisons">Comparisons</MenuItem>
                  <MenuItem value="writes">Writes</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Generator */}
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="medium">
                <InputLabel id="gen">Input</InputLabel>
                <Select
                  labelId="gen" value={generator} label="Input"
                  onChange={e=>setGenerator(e.target.value)}
                  sx={{ '& .MuiSelect-select':{ color:'#e2e8f0' }, '& .MuiOutlinedInput-notchedOutline':{ borderColor:'#374151' } }}
                >
                  <MenuItem value="random">Random</MenuItem>
                  <MenuItem value="reversed">Reversed</MenuItem>
                  <MenuItem value="nearly">Nearly-sorted</MenuItem>
                  <MenuItem value="fewunique">Few unique</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Size range */}
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="subtitle2" className="text-slate-300 mb-2">
                  Sizes: {minN} → {maxN}  •  Points: {points}
                </Typography>
                <Box className="flex gap-4">
                  <Box className="flex-1">
                    <Typography variant="caption" className="text-slate-400">Min N</Typography>
                    <Slider value={minN} min={8} max={2048} step={8} onChange={(_,v)=>setMinN(v)}
                      sx={{ '& .MuiSlider-track':{backgroundColor:'#67e8f9'}, '& .MuiSlider-thumb':{backgroundColor:'#67e8f9'}, '& .MuiSlider-rail':{backgroundColor:'#374151'} }} />
                  </Box>
                  <Box className="flex-1">
                    <Typography variant="caption" className="text-slate-400">Max N</Typography>
                    <Slider value={maxN} min={minN} max={32768} step={16} onChange={(_,v)=>setMaxN(v)}
                      sx={{ '& .MuiSlider-track':{backgroundColor:'#67e8f9'}, '& .MuiSlider-thumb':{backgroundColor:'#67e8f9'}, '& .MuiSlider-rail':{backgroundColor:'#374151'} }} />
                  </Box>
                  <Box className="flex-[.8]">
                    <Typography variant="caption" className="text-slate-400">Points</Typography>
                    <Slider value={points} min={3} max={12} step={1} onChange={(_,v)=>setPoints(v)}
                      sx={{ '& .MuiSlider-track':{backgroundColor:'#67e8f9'}, '& .MuiSlider-thumb':{backgroundColor:'#67e8f9'}, '& .MuiSlider-rail':{backgroundColor:'#374151'} }} />
                  </Box>
                </Box>
              </Box>
            </Grid>

            {/* Trials & seed & overlays */}
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="subtitle2" className="text-slate-300 mb-2">
                  Trials: {trials} • Seed: {seed}
                </Typography>
                <Box className="flex gap-4">
                  <Box className="flex-1">
                    <Typography variant="caption" className="text-slate-400">Trials per size</Typography>
                    <Slider value={trials} min={1} max={9} step={1} onChange={(_,v)=>setTrials(v)}
                      sx={{ '& .MuiSlider-track':{backgroundColor:'#67e8f9'}, '& .MuiSlider-thumb':{backgroundColor:'#67e8f9'}, '& .MuiSlider-rail':{backgroundColor:'#374151'} }} />
                  </Box>
                  <Box className="flex-1">
                    <Typography variant="caption" className="text-slate-400">Seed</Typography>
                    <Slider value={seed} min={0} max={999} step={1} onChange={(_,v)=>setSeed(v)}
                      sx={{ '& .MuiSlider-track':{backgroundColor:'#67e8f9'}, '& .MuiSlider-thumb':{backgroundColor:'#67e8f9'}, '& .MuiSlider-rail':{backgroundColor:'#374151'} }} />
                  </Box>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="medium">
                <InputLabel id="ov">Big-O Overlays</InputLabel>
                <Select
                  labelId="ov" multiple value={overlays} label="Big-O Overlays"
                  onChange={(e)=>setOverlays(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                  renderValue={(s)=>s.join(', ')}
                  sx={{ '& .MuiSelect-select':{ color:'#e2e8f0' }, '& .MuiOutlinedInput-notchedOutline':{ borderColor:'#374151' } }}
                >
                  {Object.keys(O_CURVES).map(k=>(
                    <MenuItem key={k} value={k}>
                      <Checkbox checked={overlays.indexOf(k)>-1} />
                      <ListItemText primary={k} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Box className="mt-3">
                <Button
                  variant="outlined"
                  onClick={()=>setLogScale(v=>!v)}
                  sx={{ borderColor:'#67e8f9', color:'#67e8f9', '&:hover':{ borderColor:'#22d3ee', color:'#22d3ee' } }}
                >
                  {logScale ? 'Y-Scale: Log' : 'Y-Scale: Linear'}
                </Button>
              </Box>
            </Grid>

            {/* Actions */}
            <Grid item xs={12} md={4}>
              <Box className="flex gap-3 justify-end">
                {!running ? (
                  <Button onClick={onRun} startIcon={<PlayArrowRoundedIcon />} variant="contained"
                    sx={{ backgroundColor:'#059669', '&:hover':{backgroundColor:'#047857'} }}>
                    Run
                  </Button>
                ) : (
                  <Button onClick={onPause} startIcon={<PauseRoundedIcon />} variant="contained"
                    sx={{ backgroundColor:'#dc2626', '&:hover':{backgroundColor:'#b91c1c'} }}>
                    Pause
                  </Button>
                )}
                <Button onClick={onReset} startIcon={<RestartAltRoundedIcon />} variant="contained"
                  sx={{ backgroundColor:'#374151', '&:hover':{backgroundColor:'#1f2937'} }}>
                  Reset
                </Button>
                <Button onClick={onExport} startIcon={<DownloadRoundedIcon />} variant="outlined"
                  sx={{ borderColor:'#67e8f9', color:'#67e8f9', '&:hover':{ borderColor:'#22d3ee', color:'#22d3ee' } }}>
                  Export CSV
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card variant="outlined" sx={{ borderColor:'#1f2937', background:'#0a1220' }}>
        <CardHeader title={<Typography variant="h6" className="!font-semibold">{metricLabel}</Typography>} sx={{ pb:1 }} />
        <CardContent>
          <Box sx={{ height: 440 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid stroke="#1f2937" />
                <XAxis dataKey="n" tick={{ fill:'#94a3b8' }} type="number" domain={['dataMin', 'dataMax']} />
                <YAxis
                  tick={{ fill:'#94a3b8' }}
                  domain={yDomain}
                  scale={logScale ? 'log' : 'linear'}
                  allowDataOverflow
                />
                <Tooltip
                  contentStyle={{ background:'#0b1220', border:'1px solid #334155', color:'#e2e8f0' }}
                  formatter={(val, name) => [val.toFixed ? val.toFixed(2) : val, name]}
                />
                <Legend wrapperStyle={{ color:'#cbd5e1' }} />
                {algos.map(a => (
                  <Line key={a} type="monotone" dataKey={a} name={SORTERS[a].label} stroke={COLORS[a]} dot={false} strokeWidth={2} />
                ))}
                {/* overlays */}
                {overlaySeries.map(s=>(
                  <Line key={s.name} name={`O(${s.name})`} data={s.points} dataKey="y" stroke={s.color} strokeDasharray="4 6" dot={false} strokeWidth={1.5} />
                ))}
                <ReferenceLine y={0} stroke="#1f2937" />
              </LineChart>
            </ResponsiveContainer>
          </Box>
          <Typography variant="body2" className="text-slate-400 mt-3">
            Overlays are scaled to the first measured point to compare <em>shape</em>, not raw value.
          </Typography>
        </CardContent>
      </Card>
    </div>
  )
}
