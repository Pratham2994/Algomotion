
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
function swapIn(a, i, j, steps, metrics) {
  if (i === j) return;
  [a[i], a[j]] = [a[j], a[i]];
  metrics.writes++;
  steps.push({ type: 'swap', i, j });
}

function binarySearchPos(a, lo, hi, key, steps, metrics) {
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    metrics.comparisons++; steps.push({ type: 'compare', i: mid, j: -1 });
    if (a[mid] <= key) lo = mid + 1;
    else hi = mid - 1;
  }
  return lo;
}

function countingSteps(a0) {
  const a = a0.slice(), steps = [];
  const metrics = { comparisons: 0, writes: 0 };
  if (a.length === 0) {
    return { steps, metrics };
  }
  let min = a[0], max = a[0];
  for (const v of a) { if (v < min) min = v; if (v > max) max = v; }
  const range = max - min + 1;
  if (range > 4096) {
    return insertionSteps(a0);
  }
  const count = new Array(range).fill(0);
  for (const v of a) { count[v - min]++; }
  for (let i = 1; i < range; i++) count[i] += count[i - 1];
  const out = new Array(a.length);
  for (let i = a.length - 1; i >= 0; i--) {
    const v = a[i];
    const pos = --count[v - min];
    out[pos] = v;
  }
  for (let i = 0; i < a.length; i++) {
    a[i] = out[i];
    metrics.writes++;
    steps.push({ type: 'overwrite', i, value: a[i] });
  }
  for (let i = 0; i < a.length; i++) steps.push({ type: 'placed', i });
  return { steps, metrics };
}

function radixSteps(a0) {
  const a = a0.slice(), steps = [];
  const metrics = { comparisons: 0, writes: 0 };
  if (a.length === 0) return { steps, metrics };
  if (a.some(v => v < 0 || !Number.isInteger(v))) {
    return countingSteps(a0);
  }
  let max = 0; for (const v of a) if (v > max) max = v;
  let exp = 1;
  const base = 10;
  const n = a.length;
  const out = new Array(n);
  while (Math.floor(max / exp) > 0) {
    const count = new Array(base).fill(0);
    for (let i = 0; i < n; i++) {
      const d = Math.floor(a[i] / exp) % base;
      count[d]++;
    }
    for (let i = 1; i < base; i++) count[i] += count[i - 1];
    for (let i = n - 1; i >= 0; i--) {
      const d = Math.floor(a[i] / exp) % base;
      out[--count[d]] = a[i];
    }
    for (let i = 0; i < n; i++) {
      a[i] = out[i];
      metrics.writes++;
      steps.push({ type: 'overwrite', i, value: a[i] });
    }
    exp *= base;
  }
  for (let i = 0; i < n; i++) steps.push({ type: 'placed', i });
  return { steps, metrics };
}

function pancakeSteps(a0) {
  const a = a0.slice(), steps = [];
  const metrics = { comparisons: 0, writes: 0 };
  const n = a.length;

  function flip(k) {
    let i = 0, j = k;
    while (i < j) {
      swapIn(a, i, j, steps, metrics);
      i++; j--;
    }
  }

  for (let curr = n - 1; curr > 0; curr--) {
    let mi = 0;
    for (let i = 1; i <= curr; i++) {
      metrics.comparisons++; steps.push({ type: 'compare', i, j: mi });
      if (a[i] > a[mi]) mi = i;
    }
    if (mi === curr) continue;
    if (mi > 0) flip(mi);
    flip(curr);
  }
  for (let i = 0; i < n; i++) steps.push({ type: 'placed', i });
  return { steps, metrics };
}


function timSteps(a0) {
  const a = a0.slice(), steps = [];
  const metrics = { comparisons: 0, writes: 0 };
  const n = a.length;
  if (n <= 1) { steps.push({ type: 'placed', i: 0 }); return { steps, metrics }; }

  const RUN = 32;

  function pushOverwrite(i, v) { a[i] = v; metrics.writes++; steps.push({ type: 'overwrite', i, value: v }); }

  function reverse(lo, hi) {
    while (lo < hi) { swapIn(a, lo++, hi--, steps, metrics); }
  }

  function countRun(lo) {
    let hi = lo + 1;
    if (hi >= n) return lo + 1;
    metrics.comparisons++; steps.push({ type: 'compare', i: lo, j: hi });
    if (a[hi] < a[lo]) { 
      while (hi < n) {
        metrics.comparisons++; steps.push({ type: 'compare', i: hi - 1, j: hi });
        if (!(a[hi] < a[hi - 1])) break;
        hi++;
      }
      reverse(lo, hi - 1);
    } else { 
      while (hi < n) {
        metrics.comparisons++; steps.push({ type: 'compare', i: hi - 1, j: hi });
        if (!(a[hi] >= a[hi - 1])) break;
        hi++;
      }
    }
    return hi;
  }

  function insertionRun(lo, hi) {
    for (let i = lo + 1; i <= hi; i++) {
      const key = a[i];
      let pos = binarySearchPos(a, lo, i - 1, key, steps, metrics);
      for (let j = i; j > pos; j--) {
        pushOverwrite(j, a[j - 1]);
      }
      pushOverwrite(pos, key);
    }
  }

  function merge(lo, mid, hi) {
    const L = a.slice(lo, mid + 1);
    const R = a.slice(mid + 1, hi + 1);
    let i = 0, j = 0, k = lo;
    while (i < L.length && j < R.length) {
      metrics.comparisons++; steps.push({ type: 'compare', i: lo + i, j: mid + 1 + j });
      if (L[i] <= R[j]) { pushOverwrite(k++, L[i++]); }
      else { pushOverwrite(k++, R[j++]); }
    }
    while (i < L.length) { pushOverwrite(k++, L[i++]); }
    while (j < R.length) { pushOverwrite(k++, R[j++]); }
  }

  for (let i = 0; i < n;) {
    let runEnd = countRun(i);           
    const runLen = runEnd - i;
    const targetEnd = Math.min(i + Math.max(RUN, runLen) - 1, n - 1);
    insertionRun(i, targetEnd);
    i = targetEnd + 1;
  }

  for (let size = RUN; size < n; size <<= 1) {
    for (let lo = 0; lo < n; lo += (size << 1)) {
      const mid = Math.min(lo + size - 1, n - 1);
      const hi = Math.min(lo + (size << 1) - 1, n - 1);
      if (mid < hi) merge(lo, mid, hi);
    }
  }

  for (let i = 0; i < n; i++) steps.push({ type: 'placed', i });
  return { steps, metrics };
}


function introSteps(a0) {
  const a = a0.slice(), steps = [];
  const metrics = { comparisons: 0, writes: 0 };
  const n = a.length;
  if (n <= 1) { steps.push({ type: 'placed', i: 0 }); return { steps, metrics }; }

  const INSERT_CUTOFF = 16;
  const maxDepth = Math.floor(Math.log2(Math.max(2, n))) * 2;

  function insertion(lo, hi) {
    for (let i = lo + 1; i <= hi; i++) {
      const key = a[i];
      let pos = binarySearchPos(a, lo, i - 1, key, steps, metrics);
      for (let j = i; j > pos; j--) {
        a[j] = a[j - 1]; metrics.writes++; steps.push({ type: 'overwrite', i: j, value: a[j] });
      }
      a[pos] = key; metrics.writes++; steps.push({ type: 'overwrite', i: pos, value: key });
    }
  }

  function heapify(lo, hi) {
    const size = hi - lo + 1;
    function sift(i) {
      while (true) {
        const l = 2 * i + 1, r = 2 * i + 2;
        if (l >= size) break;
        let big = l;
        metrics.comparisons++; steps.push({ type: 'compare', i: lo + l, j: lo + r < lo + size ? lo + r : lo + l });
        if (r < size && a[lo + r] > a[lo + l]) big = r;
        metrics.comparisons++; steps.push({ type: 'compare', i: lo + i, j: lo + big });
        if (a[lo + i] >= a[lo + big]) break;
        swapIn(a, lo + i, lo + big, steps, metrics);
        i = big;
      }
    }
    for (let i = ((size >> 1) - 1); i >= 0; i--) sift(i);
  }

  function heapSort(lo, hi) {
    heapify(lo, hi);
    for (let end = hi; end > lo; end--) {
      swapIn(a, lo, end, steps, metrics);
      const size = end - lo;
      function sift(i) {
        while (true) {
          const l = 2 * i + 1, r = 2 * i + 2;
          if (l >= size) break;
          let big = l;
          metrics.comparisons++; steps.push({ type: 'compare', i: lo + l, j: lo + r < lo + size ? lo + r : lo + l });
          if (r < size && a[lo + r] > a[lo + l]) big = r;
          metrics.comparisons++; steps.push({ type: 'compare', i: lo + i, j: lo + big });
          if (a[lo + i] >= a[lo + big]) break;
          swapIn(a, lo + i, lo + big, steps, metrics);
          i = big;
        }
      }
      sift(0);
    }
  }

  function partition(lo, hi) {
    const pivot = a[hi];
    let i = lo;
    for (let j = lo; j < hi; j++) {
      metrics.comparisons++; steps.push({ type: 'compare', i: j, j: hi });
      if (a[j] <= pivot) {
        if (i !== j) swapIn(a, i, j, steps, metrics);
        i++;
      }
    }
    if (i !== hi) swapIn(a, i, hi, steps, metrics);
    return i;
  }

  function sort(lo, hi, depthLeft) {
    while (lo < hi) {
      const len = hi - lo + 1;
      if (len <= INSERT_CUTOFF) { insertion(lo, hi); return; }
      if (depthLeft === 0) { heapSort(lo, hi); return; }
      const p = partition(lo, hi);
      if (p - 1 - lo < hi - (p + 1)) {
        sort(lo, p - 1, depthLeft - 1);
        lo = p + 1;
      } else {
        sort(p + 1, hi, depthLeft - 1);
        hi = p - 1;
      }
    }
  }

  sort(0, n - 1, maxDepth);
  for (let i = 0; i < n; i++) steps.push({ type: 'placed', i });
  return { steps, metrics };
}


export const EMITTERS = {
  bubble: { label: 'Bubble Sort', fn: bubbleSteps, bigO: 'O(n²)', description: 'Repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order.' },
  insertion: { label: 'Insertion Sort', fn: insertionSteps, bigO: 'O(n²)', description: 'Builds the final sorted array one item at a time by inserting into the sorted portion.' },
  selection: { label: 'Selection Sort', fn: selectionSteps, bigO: 'O(n²)', description: 'Finds the minimum and moves it to the front repeatedly.' },
  merge: { label: 'Merge Sort', fn: mergeSteps, bigO: 'O(n log n)', description: 'Divide and conquer; merge sorted halves.' },
  quick: { label: 'Quick Sort', fn: quickSteps, bigO: 'O(n log n)', description: 'Partition around a pivot; recursively sort subarrays.' },
  heap: { label: 'Heap Sort', fn: heapSteps, bigO: 'O(n log n)', description: 'Build a max-heap, then repeatedly extract the max.' },
  counting: {
    label: 'Counting Sort', bigO: 'O(n + k)', fn: countingSteps,
    description: 'Linear-time for small integer ranges; stable. Falls back if range is huge.'
  },

  radix: {
    label: 'Radix Sort (LSD)', bigO: 'O(k·n)', fn: radixSteps,
    description: 'Digit-by-digit stable sort (non-negative integers). Uses base 10.'
  },

  pancake: {
    label: 'Pancake Sort', bigO: 'O(n²)', fn: pancakeSteps,
    description: 'Sort by prefix “flips”. Great for visualization; not used in practice.'
  },
  tim: {
    label: 'TimSort', bigO: 'O(n log n)', fn: timSteps,
    description: 'Hybrid of runs + insertion and merging. Used by Python/Java’s Arrays.sort for objects.'
  },

  intro: {
    label: 'IntroSort', bigO: 'O(n log n)', fn: introSteps,
    description: 'Quicksort with depth limit → heapsort; insertion for tiny ranges. Used by C++ std::sort.'
  },
};
