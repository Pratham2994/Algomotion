// src/lib/sortEmitters.js
/* Steps: {type:'compare', i,j} | {type:'swap', i,j} | {type:'overwrite', i, value} | {type:'placed', i} */

function bubbleSteps(a0) {
    const a = a0.slice(), steps = []
    let comparisons = 0, writes = 0
    const n = a.length
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - 1 - i; j++) {
        comparisons++; steps.push({ type: 'compare', i: j, j: j + 1 })
        if (a[j] > a[j + 1]) {
          ;[a[j], a[j + 1]] = [a[j + 1], a[j]]
          writes++; steps.push({ type: 'swap', i: j, j: j + 1 })
        }
      }
    }
    for (let i = 0; i < n; i++) steps.push({ type: 'placed', i })
    return { steps, metrics: { comparisons, writes } }
  }
  
  function insertionSteps(a0) {
    const a = a0.slice(), steps = []
    let comparisons = 0, writes = 0
    for (let i = 1; i < a.length; i++) {
      const key = a[i]
      let j = i - 1
      while (j >= 0) {
        comparisons++; steps.push({ type: 'compare', i: j, j: j + 1 })
        if (a[j] > key) {
          a[j + 1] = a[j]; writes++
          steps.push({ type: 'overwrite', i: j + 1, value: a[j] })
          j--
        } else break
      }
      a[j + 1] = key; writes++
      steps.push({ type: 'overwrite', i: j + 1, value: key })
    }
    for (let i = 0; i < a.length; i++) steps.push({ type: 'placed', i })
    return { steps, metrics: { comparisons, writes } }
  }
  
  function selectionSteps(a0) {
    const a = a0.slice(), steps = []
    let comparisons = 0, writes = 0
    const n = a.length
    for (let i = 0; i < n - 1; i++) {
      let min = i
      for (let j = i + 1; j < n; j++) {
        comparisons++; steps.push({ type: 'compare', i: min, j })
        if (a[j] < a[min]) min = j
      }
      if (min !== i) {
        ;[a[i], a[min]] = [a[min], a[i]]
        writes++; steps.push({ type: 'swap', i, j: min })
      }
    }
    for (let i = 0; i < n; i++) steps.push({ type: 'placed', i })
    return { steps, metrics: { comparisons, writes } }
  }
  
  function quickSteps(a0) {
    const a = a0.slice(), steps = []
    let comparisons = 0, writes = 0
    function partition(lo, hi) {
      const pivot = a[hi]
      let i = lo
      for (let j = lo; j < hi; j++) {
        comparisons++; steps.push({ type: 'compare', i: j, j: hi })
        if (a[j] <= pivot) {
          if (i !== j) {
            ;[a[i], a[j]] = [a[j], a[i]]
            writes++; steps.push({ type: 'swap', i, j })
          }
          i++
        }
      }
      if (i !== hi) {
        ;[a[i], a[hi]] = [a[hi], a[i]]
        writes++; steps.push({ type: 'swap', i, j: hi })
      }
      return i
    }
    function qs(lo, hi) {
      if (lo >= hi) return
      const p = partition(lo, hi)
      qs(lo, p - 1); qs(p + 1, hi)
    }
    qs(0, a.length - 1)
    for (let i = 0; i < a.length; i++) steps.push({ type: 'placed', i })
    return { steps, metrics: { comparisons, writes } }
  }
  
  function heapSteps(a0) {
    const a = a0.slice(), steps = []
    let comparisons = 0, writes = 0
    const n = a.length
    function siftDown(i, size) {
      while (true) {
        const l = 2 * i + 1, r = 2 * i + 2
        if (l >= size) break
        let largest = l
        if (r < size) {
          comparisons++; steps.push({ type: 'compare', i: l, j: r })
          if (a[r] > a[l]) largest = r
        }
        comparisons++; steps.push({ type: 'compare', i, j: largest })
        if (a[i] >= a[largest]) break
        ;[a[i], a[largest]] = [a[largest], a[i]]
        writes++; steps.push({ type: 'swap', i, j: largest })
        i = largest
      }
    }
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) siftDown(i, n)
    for (let end = n - 1; end > 0; end--) {
      ;[a[0], a[end]] = [a[end], a[0]]
      writes++; steps.push({ type: 'swap', i: 0, j: end })
      siftDown(0, end)
    }
    for (let i = 0; i < n; i++) steps.push({ type: 'placed', i })
    return { steps, metrics: { comparisons, writes } }
  }
  
  function mergeSteps(a0) {
    const a = a0.slice(), n = a.length, steps = []
    let comparisons = 0, writes = 0
    const aux = new Array(n)
    for (let sz = 1; sz < n; sz <<= 1) {
      for (let lo = 0; lo < n - sz; lo += sz << 1) {
        const mid = lo + sz - 1
        const hi = Math.min(lo + (sz << 1) - 1, n - 1)
        for (let k = lo; k <= hi; k++) aux[k] = a[k]
        let i = lo, j = mid + 1
        for (let k = lo; k <= hi; k++) {
          if (i > mid) { a[k] = aux[j++]; writes++; steps.push({ type: 'overwrite', i: k, value: a[k] }); continue }
          if (j > hi) { a[k] = aux[i++]; writes++; steps.push({ type: 'overwrite', i: k, value: a[k] }); continue }
          comparisons++; steps.push({ type: 'compare', i, j })
          if (aux[j] < aux[i]) { a[k] = aux[j++]; writes++; steps.push({ type: 'overwrite', i: k, value: a[k] }) }
          else { a[k] = aux[i++]; writes++; steps.push({ type: 'overwrite', i: k, value: a[k] }) }
        }
      }
    }
    for (let i = 0; i < n; i++) steps.push({ type: 'placed', i })
    return { steps, metrics: { comparisons, writes } }
  }
  
  export const EMITTERS = {
    bubble:   { label: 'Bubble Sort',   fn: bubbleSteps,   bigO: 'O(n²)',       description: 'Repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order.' },
    insertion:{ label: 'Insertion Sort',fn: insertionSteps, bigO: 'O(n²)',      description: 'Builds the final sorted array one item at a time by inserting into the sorted portion.' },
    selection:{ label: 'Selection Sort',fn: selectionSteps, bigO: 'O(n²)',      description: 'Finds the minimum and moves it to the front repeatedly.' },
    merge:    { label: 'Merge Sort',    fn: mergeSteps,    bigO: 'O(n log n)',  description: 'Divide and conquer; merge sorted halves.' },
    quick:    { label: 'Quick Sort',    fn: quickSteps,    bigO: 'O(n log n)',  description: 'Partition around a pivot; recursively sort subarrays.' },
    heap:     { label: 'Heap Sort',     fn: heapSteps,     bigO: 'O(n log n)',  description: 'Build a max-heap, then repeatedly extract the max.' },
  }
  