// src/lib/pathCore.js
/* ---------- tiny utils ---------- */
export function mulberry32(seed){let t=seed>>>0;return function(){t+=0x6D2B79F5;let r=Math.imul(t^(t>>>15),1|t);r^=r+Math.imul(r^(r>>>7),61|r);return((r^(r>>>14))>>>0)/4294967296}}
export function hashSeed(...vals){let h=2166136261;for(const ch of vals.join('|')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
export const makeRng = (seed)=> mulberry32(hashSeed('algo', seed))
export const shuffled=(arr,rng)=>{const a=arr.slice();for(let i=a.length-1;i>0;i--){const j=(rng()*(i+1))|0;[a[i],a[j]]=[a[j],a[i]]}return a}

/* ---------- Grid helpers ---------- */
export const EMPTY=0, WALL=1
export const DIRS4=[[1,0],[-1,0],[0,1],[0,-1]]
export const DIRS8=[...DIRS4,[1,1],[1,-1],[-1,1],[-1,-1]]
export const manhattan=(a,b)=>Math.abs(a.r-b.r)+Math.abs(a.c-b.c)
export const euclid=(a,b)=>Math.hypot(a.r-b.r,a.c-b.c)
export const octile=(a,b)=>{const dx=Math.abs(a.c-b.c),dy=Math.abs(a.r-b.r),D=1,D2=Math.SQRT2;return D*(dx+dy)+(D2-2*D)*Math.min(dx,dy)}

/* Open grid (optional random obstacles) */
export function buildOpenGrid(rows, cols, seed, density=0){
  rows|=1; cols|=1
  const rng=mulberry32(hashSeed('open',seed,rows,cols,density))
  const g=Array.from({length:rows},()=>Array(cols).fill(EMPTY))
  if(density<=0) return g
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    if((r===1&&c===1)||(r===rows-2&&c===cols-2)) continue
    if(rng()<density) g[r][c]=WALL
  }
  return g
}

/* Maze (recursive backtracker) + braid */
export function buildMaze(rows, cols, seed, braid=0.15){
  rows|=1; cols|=1
  const rng=mulberry32(hashSeed('maze',seed,rows,cols,braid))
  const g=Array.from({length:rows},()=>Array(cols).fill(WALL))
  const inb=(r,c)=>r>0&&c>0&&r<rows-1&&c<cols-1
  function carve(r,c){
    g[r][c]=EMPTY
    const dirs=[[2,0],[-2,0],[0,2],[0,-2]].sort(()=>rng()-.5)
    for(const [dr,dc] of dirs){
      const r2=r+dr,c2=c+dc,r1=r+dr/2,c1=c+dc/2
      if(inb(r2,c2)&&g[r2][c2]===WALL){ g[r1|0][c1|0]=EMPTY; carve(r2,c2) }
    }
  }
  carve(1,1)
  for(let r=1;r<rows-1;r++)for(let c=1;c<cols-1;c++){
    if(g[r][c]!==EMPTY) continue
    let exits=0; for(const [dr,dc] of DIRS4) exits+= g[r+dr][c+dc]===EMPTY?1:0
    if(exits===1 && rng()<braid){
      const walls=[]; for(const [dr,dc] of DIRS4) if(g[r+dr][c+dc]===WALL) walls.push([dr,dc])
      if(walls.length){ const [dr,dc]=walls[(walls.length*rng())|0]; g[r+dr][c+dc]=EMPTY }
    }
  }
  return g
}

/* Optional weights 1..3 (∞ for walls) */
export function buildWeights(grid, seed, enabled=false){
  if(!enabled) return null
  const rng=mulberry32(hashSeed('weights',seed))
  return grid.map(row=>row.map(cell=>{
    if(cell===WALL) return Infinity
    const r=rng(); return r<0.15?3 : r<0.45?2 : 1
  }))
}

/* ---------- Algorithms: emit step lists ---------- */
/* Steps: {type:'frontier'|'visit'|'path'|'done', r,c} */

export function bfsSteps(grid,start,goal,{dirs=DIRS4,rng=null,randomTies=false,weights=null}={}){
  if(weights||(dirs.length===8)) return dijkstraSteps(grid,start,goal,{dirs,rng,randomTies,weights})
  const rows=grid.length, cols=grid[0].length, inb=(r,c)=>r>=0&&c>=0&&r<rows&&c<cols
  const steps=[], q=[start], seen=new Set([start.r+','+start.c]), parent={}
  let visited=0
  while(q.length){
    const cur=q.shift(); steps.push({type:'visit',...cur}); visited++
    if(cur.r===goal.r&&cur.c===goal.c) break
    const nbrs=randomTies&&rng?shuffled(dirs,rng):dirs
    for(const [dr,dc] of nbrs){
      const nr=cur.r+dr,nc=cur.c+dc,key=nr+','+nc
      if(inb(nr,nc)&&grid[nr][nc]!==WALL&&!seen.has(key)){
        seen.add(key); parent[key]=cur; q.push({r:nr,c:nc})
        steps.push({type:'frontier',r:nr,c:nc})
      }
    }
  }
  let key=goal.r+','+goal.c, pathLen=0
  if(parent[key]||(start.r===goal.r&&start.c===goal.c)){
    let cur={r:goal.r,c:goal.c}
    while(!(cur.r===start.r&&cur.c===start.c)){
      steps.push({type:'path',...cur}); pathLen++; cur=parent[cur.r+','+cur.c]; if(!cur) break
    }
    steps.push({type:'path',...start})
  }
  steps.push({type:'done'})
  return {steps, metrics:{visited, pathLen}}
}

export function dijkstraSteps(grid,start,goal,{dirs=DIRS4,rng=null,randomTies=false,weights=null}={}){
  const rows=grid.length, cols=grid[0].length, inb=(r,c)=>r>=0&&c>=0&&r<rows&&c<cols
  const w=(r,c,pr,pc)=>((r!==pr&&c!==pc)?Math.SQRT2:1) * (weights?weights[r][c]:1)
  const dist=Array.from({length:rows},()=>Array(cols).fill(Infinity))
  const parent={}, steps=[]; let visited=0
  dist[start.r][start.c]=0
  const pq=[{r:start.r,c:start.c,d:0}]
  while(pq.length){
    let idx=0; for(let i=1;i<pq.length;i++){ if(pq[i].d<pq[idx].d) idx=i; else if(pq[i].d===pq[idx].d && randomTies && rng && rng()<0.5) idx=i }
    const cur=pq.splice(idx,1)[0]; steps.push({type:'visit',r:cur.r,c:cur.c}); visited++
    if(cur.r===goal.r&&cur.c===goal.c) break
    const nbrs=randomTies&&rng?shuffled(dirs,rng):dirs
    for(const [dr,dc] of nbrs){
      const nr=cur.r+dr,nc=cur.c+dc
      if(!inb(nr,nc)||grid[nr][nc]===WALL) continue
      const nd=cur.d + w(nr,nc,cur.r,cur.c)
      if(nd<dist[nr][nc]){ dist[nr][nc]=nd; parent[nr+','+nc]={r:cur.r,c:cur.c}; pq.push({r:nr,c:nc,d:nd}); steps.push({type:'frontier',r:nr,c:nc}) }
    }
  }
  let pathLen=0, cur={r:goal.r,c:goal.c}; while(parent[cur.r+','+cur.c]){ steps.push({type:'path',...cur}); pathLen++; cur=parent[cur.r+','+cur.c] }
  if(cur.r===start.r&&cur.c===start.c) steps.push({type:'path',...start})
  steps.push({type:'done'})
  return {steps, metrics:{visited, pathLen}}
}

export function dfsSteps(grid,start,goal,{dirs=DIRS4,rng=null,randomTies=false}={}){
  const rows=grid.length, cols=grid[0].length, inb=(r,c)=>r>=0&&c>=0&&r<rows&&c<cols
  const steps=[], stack=[start], seen=new Set([start.r+','+start.c]), parent={}, keyOf=(r,c)=>r+','+c
  let visited=0
  while(stack.length){
    const cur=stack.pop(); steps.push({type:'visit',r:cur.r,c:cur.c}); visited++
    if(cur.r===goal.r&&cur.c===goal.c) break
    const nbrs=randomTies&&rng?shuffled(dirs,rng):dirs
    for(const [dr,dc] of nbrs){
      const nr=cur.r+dr,nc=cur.c+dc,key=keyOf(nr,nc)
      if(!inb(nr,nc)||grid[nr][nc]===WALL||seen.has(key)) continue
      seen.add(key); parent[key]=cur; stack.push({r:nr,c:nc}); steps.push({type:'frontier',r:nr,c:nc})
    }
  }
  let pathLen=0, cur={r:goal.r,c:goal.c}; while(parent[cur.r+','+cur.c]){ steps.push({type:'path',...cur}); pathLen++; cur=parent[cur.r+','+cur.c] }
  if(cur.r===start.r&&cur.c===start.c) steps.push({type:'path',...start})
  steps.push({type:'done'})
  return {steps, metrics:{visited, pathLen}}
}

export function aStarSteps(grid,start,goal,{dirs=DIRS4,rng=null,randomTies=false,weights=null,heuristic='manhattan'}={}){
  const rows=grid.length, cols=grid[0].length, inb=(r,c)=>r>=0&&c>=0&&r<rows&&c<cols
  const h= heuristic==='euclid'?euclid : heuristic==='octile'?octile : manhattan
  const w=(r,c,pr,pc)=>((r!==pr&&c!==pc)?Math.SQRT2:1) * (weights?weights[r][c]:1)
  const g=Array.from({length:rows},()=>Array(cols).fill(Infinity))
  const f=Array.from({length:rows},()=>Array(cols).fill(Infinity))
  const parent={}, steps=[]; let visited=0
  g[start.r][start.c]=0; f[start.r][start.c]=h(start,goal)
  const open=[{r:start.r,c:start.c,f:f[start.r][start.c],g:0}], inOpen=new Set([start.r+','+start.c])
  while(open.length){
    let idx=0; for(let i=1;i<open.length;i++){ if(open[i].f<open[idx].f) idx=i; else if(open[i].f===open[idx].f){ if(open[i].g>open[idx].g) idx=i; else if(open[i].g===open[idx].g&&randomTies&&rng&&rng()<0.5) idx=i } }
    const cur=open.splice(idx,1)[0]; inOpen.delete(cur.r+','+cur.c)
    steps.push({type:'visit',r:cur.r,c:cur.c}); visited++
    if(cur.r===goal.r&&cur.c===goal.c) break
    const nbrs=randomTies&&rng?shuffled(dirs,rng):dirs
    for(const [dr,dc] of nbrs){
      const nr=cur.r+dr,nc=cur.c+dc
      if(!inb(nr,nc)||grid[nr][nc]===WALL) continue
      const tentative=g[cur.r][cur.c]+w(nr,nc,cur.r,cur.c)
      if(tentative<g[nr][nc]){
        parent[nr+','+nc]={r:cur.r,c:cur.c}; g[nr][nc]=tentative; f[nr][nc]=tentative+h({r:nr,c:nc},goal)
        if(!inOpen.has(nr+','+nc)){ open.push({r:nr,c:nc,f:f[nr][nc],g:g[nr][nc]}); inOpen.add(nr+','+nc); steps.push({type:'frontier',r:nr,c:nc}) }
      }
    }
  }
  let pathLen=0, cur={r:goal.r,c:goal.c}; while(parent[cur.r+','+cur.c]){ steps.push({type:'path',...cur}); pathLen++; cur=parent[cur.r+','+cur.c] }
  if(cur.r===start.r&&cur.c===start.c) steps.push({type:'path',...start})
  steps.push({type:'done'})
  return {steps, metrics:{visited, pathLen}}
}
export function greedyBestFirstSteps(
    grid, start, goal,
    { dirs = DIRS4, rng = null, randomTies = false, weights = null, heuristic = 'manhattan' } = {}
  ){
    const rows = grid.length, cols = grid[0].length
    const inb = (r,c)=>r>=0&&c>=0&&r<rows&&c<cols
    const h = heuristic==='euclid' ? euclid : heuristic==='octile' ? octile : manhattan
  
    const steps = []
    const parent = {}
    const inOpen = new Set()
    const inClosed = new Set()
  
    const open = []
    function push(r,c){
      const hv = h({r,c}, goal)
      open.push({r,c,h:hv})
      inOpen.add(r+','+c)
    }
    function popMin(){
      let idx=0
      for(let i=1;i<open.length;i++){
        if(open[i].h<open[idx].h) idx=i
        else if(open[i].h===open[idx].h && randomTies && rng && rng()<0.5) idx=i
      }
      return open.splice(idx,1)[0]
    }
  
    push(start.r, start.c)
    let visited=0
    while(open.length){
      const cur = popMin()
      const key = cur.r+','+cur.c
      if(inClosed.has(key)) continue
      inOpen.delete(key); inClosed.add(key)
  
      steps.push({type:'visit', r:cur.r, c:cur.c}); visited++
      if(cur.r===goal.r && cur.c===goal.c) break
  
      const nbrs = randomTies && rng ? shuffled(dirs, rng) : dirs
      for(const [dr,dc] of nbrs){
        const nr=cur.r+dr, nc=cur.c+dc, nk=nr+','+nc
        if(!inb(nr,nc) || grid[nr][nc]===WALL) continue
        if(inClosed.has(nk)) continue
        if(!inOpen.has(nk)){
          parent[nk]={r:cur.r,c:cur.c}
          steps.push({type:'frontier', r:nr, c:nc})
          push(nr,nc)
        }
      }
    }
  
    // Reconstruct path
    let pathLen=0
    let cur={r:goal.r,c:goal.c}
    while(parent[cur.r+','+cur.c]){
      steps.push({type:'path', ...cur}); pathLen++
      cur = parent[cur.r+','+cur.c]
    }
    if(cur.r===start.r && cur.c===start.c) steps.push({type:'path', ...start})
    steps.push({type:'done'})
    return { steps, metrics:{ visited, pathLen } }
  }
  
  /* =================
     DIAL'S ALGORITHM
     =================
     Works when:
     - diagonals are OFF (4-way movement)
     - edge costs are small non-negative integers (your weights 1..3)
     Otherwise we fallback to Dijkstra.
  */
  export function dialsSteps(
    grid, start, goal,
    { dirs = DIRS4, rng = null, randomTies = false, weights = null } = {}
  ){
    // Guard: no diagonals and integer costs
    const diagonalUsed = dirs.length > 4
    const integerWeights = !weights || weights.every(row => row.every(v => v===Infinity || Number.isInteger(v)))
    if (diagonalUsed || !integerWeights) {
      // Fallback to standard Dijkstra (handles diagonals / non-integers)
      return dijkstraSteps(grid, start, goal, { dirs, rng, randomTies, weights })
    }
  
    const rows=grid.length, cols=grid[0].length, inb=(r,c)=>r>=0&&c>=0&&r<rows&&c<cols
    const w = (r,c)=> (weights ? weights[r][c] : 1) // 4-way only; assumes integer small
    const steps=[]
    const parent={}
    const dist=Array.from({length:rows},()=>Array(cols).fill(Infinity))
    let visited=0
  
    // Max edge weight C
    const C = weights ?  Math.max(1, ...weights.flat().filter(v=>Number.isFinite(v))) : 1
    const MAXD = C * rows * cols + 2 // safe upper bound
    const buckets = Array.from({length: MAXD}, ()=>[]) // index = distance
    let idx = 0
    function push(r,c,d){
      if(d>=MAXD) return
      buckets[d].push({r,c,d})
    }
  
    dist[start.r][start.c]=0
    push(start.r, start.c, 0)
  
    let found=false
    while(idx < MAXD){
      // advance to next non-empty bucket
      while(idx<MAXD && buckets[idx].length===0) idx++
      if(idx>=MAXD) break
  
      const cur = buckets[idx].shift()
      if(cur.d!==dist[cur.r][cur.c]) continue // stale
      steps.push({type:'visit', r:cur.r, c:cur.c}); visited++
      if(cur.r===goal.r && cur.c===goal.c){ found=true; break }
  
      const nbrs = randomTies && rng ? shuffled(dirs, rng) : dirs
      for(const [dr,dc] of nbrs){
        const nr=cur.r+dr, nc=cur.c+dc
        if(!inb(nr,nc) || grid[nr][nc]===WALL) continue
        const cost = w(nr,nc)
        if(!Number.isFinite(cost)) continue
        const nd = cur.d + cost
        if(nd < dist[nr][nc]){
          dist[nr][nc]=nd
          parent[nr+','+nc]={r:cur.r,c:cur.c}
          steps.push({type:'frontier', r:nr, c:nc})
          push(nr,nc,nd)
        }
      }
    }
  
    // Reconstruct
    let pathLen=0, cur={r:goal.r,c:goal.c}
    while(parent[cur.r+','+cur.c]){
      steps.push({type:'path', ...cur}); pathLen++
      cur = parent[cur.r+','+cur.c]
    }
    if(cur.r===start.r && cur.c===start.c) steps.push({type:'path', ...start})
    steps.push({type:'done'})
    return { steps, metrics:{ visited, pathLen } }
  }
  


  export const ALGOS = {
    bfs:      {label:'BFS',      fn:bfsSteps,      desc:'Breadth-first search on uniform/4-way grid.'},
    dijkstra: {label:'Dijkstra', fn:dijkstraSteps, desc:'Non-negative weights; optimal with 4/8-way + costs.'},
    astar:    {label:'A*',       fn:aStarSteps,    desc:'Best-first guided by a heuristic (Manhattan/Euclid/Octile).'},
    dfs:      {label:'DFS',      fn:dfsSteps,      desc:'Depth-first (not shortest); good for exploring shapes.'},
    greedy:   {label:'Greedy',   fn:greedyBestFirstSteps, desc:'Greedy best-first (uses only heuristic h, not optimal).'},
    dials:    {label:"Dial's",   fn:dialsSteps,            desc:"Bucketed Dijkstra for small integer costs (no diagonals)."},
  }
  