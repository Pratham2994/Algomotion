// src/lib/benchCore.js

/* ========= tiny utils ========= */
export function mulberry32(seed){let t=seed>>>0;return function(){t+=0x6D2B79F5;let r=Math.imul(t^(t>>>15),1|t);r^=r+Math.imul(r^(r>>>7),61|r);return((r^(r>>>14))>>>0)/4294967296}}
export function hashSeed(...vals){let h=2166136261;for(const ch of vals.join('|')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
export const median = arr => { if(!arr.length) return 0; const a=[...arr].sort((x,y)=>x-y); const m=(a.length-1)/2; return a.length%2 ? a[m|0] : (a[m|0]+a[(m+1)|0])/2 }

/* ========= array generators ========= */
export function makeArray(n, kind, seed){
  const rng = mulberry32(hashSeed('arr', n, kind, seed))
  if(kind==='reversed'){
    return Array.from({length:n}, (_,i)=> n - i)
  } else if(kind==='nearly'){
    const a = Array.from({length:n}, () => (rng()*1000|0))
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
  return Array.from({length:n}, ()=>(rng()*100000|0))
}

/* ========= sorting metrics (headless) ========= */
export function bubbleMeasure(a0){ const a=a0.slice(); let c=0,w=0
  for(let i=0;i<a.length-1;i++){ for(let j=0;j<a.length-1-i;j++){ c++; if(a[j]>a[j+1]){ [a[j],a[j+1]]=[a[j+1],a[j]]; w++ } } }
  return {comparisons:c,writes:w}
}
export function insertionMeasure(a0){ const a=a0.slice(); let c=0,w=0
  for(let i=1;i<a.length;i++){ const key=a[i]; let j=i-1
    while(j>=0){ c++; if(a[j]>key){ a[j+1]=a[j]; w++; j-- } else break }
    a[j+1]=key; w++
  } return {comparisons:c,writes:w}
}
export function selectionMeasure(a0){ const a=a0.slice(); let c=0,w=0
  for(let i=0;i<a.length-1;i++){ let m=i
    for(let j=i+1;j<a.length;j++){ c++; if(a[j]<a[m]) m=j }
    if(m!==i){ [a[i],a[m]]=[a[m],a[i]]; w++ }
  } return {comparisons:c,writes:w}
}
export function mergeMeasure(a0){ const n=a0.length, a=a0.slice(), aux=new Array(n); let c=0,w=0
  for(let sz=1; sz<n; sz<<=1){ for(let lo=0; lo<n-sz; lo+=(sz<<1)){
    const mid=lo+sz-1, hi=Math.min(lo+(sz<<1)-1, n-1)
    for(let k=lo;k<=hi;k++) aux[k]=a[k]
    let i=lo, j=mid+1
    for(let k=lo;k<=hi;k++){
      if(i>mid){ a[k]=aux[j++]; w++ }
      else if(j>hi){ a[k]=aux[i++]; w++ }
      else{ c++; if(aux[j]<aux[i]){ a[k]=aux[j++]; w++ } else { a[k]=aux[i++]; w++ } }
    }
  }} return {comparisons:c,writes:w}
}
export function quickMeasure(a0){ const a=a0.slice(); let c=0,w=0
  function part(lo,hi){ const pivot=a[hi]; let i=lo
    for(let j=lo;j<hi;j++){ c++; if(a[j]<=pivot){ if(i!==j){ [a[i],a[j]]=[a[j],a[i]]; w++ } i++ } }
    if(i!==hi){ [a[i],a[hi]]=[a[hi],a[i]]; w++ } return i
  }
  (function qs(lo,hi){ if(lo>=hi) return; const p=part(lo,hi); qs(lo,p-1); qs(p+1,hi) })(0,a.length-1)
  return {comparisons:c,writes:w}
}
export function heapMeasure(a0){ const a=a0.slice(); let c=0,w=0, n=a.length
  function sift(i, size){ while(true){ const l=2*i+1, r=2*i+2; if(l>=size) break
    let big=l; if(r<size){ c++; if(a[r]>a[l]) big=r } c++; if(a[i]>=a[big]) break
    ;[a[i],a[big]]=[a[big],a[i]]; w++; i=big
  } }
  for(let i=(n>>1)-1;i>=0;i--) sift(i,n)
  for(let end=n-1;end>0;end--){ [a[0],a[end]]=[a[end],a[0]]; w++; sift(0,end) }
  return {comparisons:c,writes:w}
}

export const SORTERS = {
  bubble:   {label:'Bubble',   fn:bubbleMeasure,    bigO:'O(n²)'},
  insertion:{label:'Insertion',fn:insertionMeasure, bigO:'O(n²)'},
  selection:{label:'Selection',fn:selectionMeasure, bigO:'O(n²)'},
  merge:    {label:'Merge',    fn:mergeMeasure,     bigO:'O(n log n)'},
  quick:    {label:'Quick',    fn:quickMeasure,     bigO:'O(n log n)'},
  heap:     {label:'Heap',     fn:heapMeasure,      bigO:'O(n log n)'},
}

/* ========= Big-O helpers ========= */
export const O_CURVES = {
  'n': (n)=> n,
  'n log n': (n)=> n * Math.log2(Math.max(2,n)),
  'n²': (n)=> n*n,
}
export const COLORS = {
  bubble: '#f97316', insertion:'#f59e0b', selection:'#eab308',
  merge:  '#22c55e', quick:   '#06b6d4',  heap:     '#8b5cf6',
  'n': '#94a3b8', 'n log n': '#9ca3af', 'n²': '#a3a3a3'
}
