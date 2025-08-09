// src/lib/libraryData.js
export const COMPLEXITY = {
    sorting: [
      {
        name: 'Bubble Sort', key: 'bubble', best: 'O(n)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)',
        blurb: 'Swap adjacent out-of-order pairs repeatedly until sorted.',
        pseudo: [
          'bubbleSort(a):',
          '  n = length(a)',
          '  repeat:',
          '    swapped = false',
          '    for i = 0 .. n-2:',
          '      if a[i] > a[i+1]:',
          '        swap(a[i], a[i+1])',
          '        swapped = true',
          '    n = n - 1           // last item is in place',
          '  until swapped == false'
        ],
        uses: ['Teaching stability/adjacent swaps', 'Tiny nearly-sorted inputs'],
        openLink: '/sorting?algo=bubble'
      },
      {
        name: 'Insertion Sort', key: 'insertion', best: 'O(n)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)',
        blurb: 'Builds a sorted prefix by inserting each next element into place.',
        pseudo: [
          'insertionSort(a):',
          '  for i = 1 .. n-1:',
          '    key = a[i]',
          '    j = i - 1',
          '    while j >= 0 and a[j] > key:',
          '      a[j+1] = a[j]      // shift right',
          '      j = j - 1',
          '    a[j+1] = key         // stable insert'
        ],
        uses: ['Small arrays', 'Nearly sorted data', 'As last mile in TimSort'],
        openLink: '/sorting?algo=insertion'
      },
      {
        name: 'Selection Sort', key: 'selection', best: 'O(n²)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)',
        blurb: 'Select the min from the unsorted suffix and place it at the front.',
        pseudo: [
          'selectionSort(a):',
          '  for i = 0 .. n-2:',
          '    minIdx = i',
          '    for j = i+1 .. n-1:',
          '      if a[j] < a[minIdx]:',
          '        minIdx = j',
          '    if minIdx != i:',
          '      swap(a[i], a[minIdx])'
        ],
        uses: ['When swaps are expensive but comparisons are cheap'],
        openLink: '/sorting?algo=selection'
      },
      {
        name: 'Merge Sort', key: 'merge', best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)',
        blurb: 'Divide and conquer; merge two sorted halves.',
        pseudo: [
          'mergeSort(a, lo, hi):',
          '  if lo >= hi: return',
          '  mid = (lo + hi) // 2',
          '  mergeSort(a, lo, mid)',
          '  mergeSort(a, mid+1, hi)',
          '  merge(a, lo, mid, hi)',
          '',
          'merge(a, lo, mid, hi):',
          '  L = a[lo..mid], R = a[mid+1..hi]',
          '  i = 0; j = 0; k = lo',
          '  while i < len(L) and j < len(R):',
          '    if L[i] <= R[j]: a[k] = L[i]; i++',
          '    else:             a[k] = R[j]; j++',
          '    k++',
          '  copy remaining of L then R into a'
        ],
        uses: ['Linked lists', 'External sorting', 'Stable sort needs'],
        openLink: '/sorting?algo=merge'
      },
      {
        name: 'Quick Sort', key: 'quick', best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n²)', space: 'O(log n)',
        blurb: 'Partition around a pivot; sort partitions recursively.',
        pseudo: [
          'quickSort(a, lo, hi):',
          '  if lo >= hi: return',
          '  p = partition(a, lo, hi)   // Lomuto',
          '  quickSort(a, lo, p-1)',
          '  quickSort(a, p+1, hi)',
          '',
          'partition(a, lo, hi):',
          '  pivot = a[hi]',
          '  i = lo',
          '  for j = lo .. hi-1:',
          '    if a[j] <= pivot:',
          '      swap(a[i], a[j])',
          '      i++',
          '  swap(a[i], a[hi])',
          '  return i'
        ],
        uses: ['In-place fast sort; great cache behavior', 'Databases / std::sort core'],
        openLink: '/sorting?algo=quick'
      },
      {
        name: 'Heap Sort', key: 'heap', best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(1)',
        blurb: 'Build a max-heap; repeatedly pop the max to the end.',
        pseudo: [
          'heapSort(a):',
          '  buildMaxHeap(a)',
          '  for end = n-1 down to 1:',
          '    swap(a[0], a[end])',
          '    siftDown(a, 0, end)   // heap size shrinks',
          '',
          'buildMaxHeap(a):',
          '  for i = floor(n/2)-1 down to 0:',
          '    siftDown(a, i, n)',
          '',
          'siftDown(a, i, size):',
          '  while true:',
          '    l = 2*i + 1; r = 2*i + 2',
          '    if l >= size: break',
          '    largest = (r < size and a[r] > a[l]) ? r : l',
          '    if a[i] >= a[largest]: break',
          '    swap(a[i], a[largest])',
          '    i = largest'
        ],
        uses: ['Worst-case O(n log n) with O(1) extra space'],
        openLink: '/sorting?algo=heap'
      }
    ],
    path: [
      {
        name: 'BFS', key: 'bfs', best: 'O(V+E)', avg: 'O(V+E)', worst: 'O(V+E)', space: 'O(V)',
        blurb: 'Layer-by-layer expansion; shortest path on unweighted graphs.',
        pseudo: [
          'bfs(G, s, t):',
          '  Q = queue(); Q.push(s)',
          '  seen = {s}; parent = {}',
          '  while Q not empty:',
          '    v = Q.pop()',
          '    if v == t: break',
          '    for u in neighbors(v):',
          '      if u not in seen:',
          '        seen.add(u); parent[u] = v; Q.push(u)',
          '  // reconstruct path from parent if t reached'
        ],
        uses: ['Unweighted shortest path', 'Social graphs / hops'],
        openLink: '/pathfinding?algo=bfs'
      },
      {
        name: 'DFS', key: 'dfs', best: 'O(V+E)', avg: 'O(V+E)', worst: 'O(V+E)', space: 'O(V)',
        blurb: 'Depth-first exploration; not optimal for shortest path.',
        pseudo: [
          'dfs_iter(G, s):           // iterative (avoids deep recursion)',
          '  S = stack([s]); seen = {s}',
          '  while S not empty:',
          '    v = S.pop()',
          '    // process v (preorder)',
          '    for u in neighbors(v):',
          '      if u not in seen:',
          '        seen.add(u); S.push(u)',
          '',
          '// Recursive variant:',
          'dfs_rec(G, v):',
          '  seen.add(v)',
          '  for u in neighbors(v):',
          '    if u not in seen: dfs_rec(G, u)'
        ],
        uses: ['Cycle detection', 'Topological sort', 'Connected components'],
        openLink: '/pathfinding?algo=bfs' // (kept exactly as your original)
      },
      {
        name: 'Dijkstra', key: 'dijkstra', best: 'O(E log V)', avg: 'O(E log V)', worst: 'O(E log V)', space: 'O(V)',
        blurb: 'Non-negative edge weights; optimal shortest path.',
        pseudo: [
          'dijkstra(G, s):',
          '  dist[v] = +inf for all v; dist[s] = 0',
          '  parent = {}',
          '  PQ = min-heap of (dist, v); push (0, s)',
          '  while PQ not empty:',
          '    (d, v) = pop_min(PQ)',
          '    if d > dist[v]: continue   // stale',
          '    for (v -> u, w) in edges:',
          '      if dist[v] + w < dist[u]:',
          '        dist[u] = dist[v] + w',
          '        parent[u] = v',
          '        push (dist[u], u) into PQ',
          '  // path from parent if needed'
        ],
        uses: ['Maps / routing', 'Weighted grids'],
        openLink: '/pathfinding?algo=dijkstra'
      },
      {
        name: 'A*', key: 'astar', best: 'O(E)', avg: 'O(E)', worst: 'O(E)', space: 'O(V)',
        blurb: 'Best-first using heuristic; fast on well-heuristic’d graphs.',
        pseudo: [
          'a_star(G, s, t, h):       // h is admissible heuristic',
          '  g[v] = +inf; g[s] = 0',
          '  f[v] = +inf; f[s] = h(s, t)',
          '  open = min-heap by f; push (f[s], s)',
          '  parent = {}',
          '  while open not empty:',
          '    (fv, v) = pop_min(open)',
          '    if v == t: break',
          '    for (v -> u, w) in edges:',
          '      tentative = g[v] + w',
          '      if tentative < g[u]:',
          '        g[u] = tentative',
          '        f[u] = g[u] + h(u, t)',
          '        parent[u] = v',
          '        push (f[u], u) into open',
          '  // reconstruct path from parent'
        ],
        uses: ['Game AI', 'Path planners (octile/Euclid/Manhattan)'],
        openLink: '/pathfinding?algo=astar'
      }
    ]
  }
  
  export const COMPLEXITY_ROWS = [
    { name: 'O(1)',        desc: 'Constant time' },
    { name: 'O(log n)',    desc: 'Logarithmic (binary search tree height)' },
    { name: 'O(n)',        desc: 'Linear (single pass)' },
    { name: 'O(n log n)',  desc: 'Divide & conquer (merge/quick typical)' },
    { name: 'O(n²)',       desc: 'Quadratic (double loop)' },
  ]
  