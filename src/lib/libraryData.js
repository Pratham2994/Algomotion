export const COMPLEXITY = {
    sorting: [
      {
        name: 'Bubble Sort', key: 'bubble',
        best: 'O(n)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)',
        blurb: 'Swap adjacent out-of-order pairs repeatedly; largest “bubbles” to the end each pass.',
        props: ['Stable', 'In-place', 'Adaptive (nearly-sorted)'],
        pseudo: [
          'bubbleSort(a):',
          '  n = length(a)',
          '  // Invariant after each pass: a[n-pass .. n-1] is sorted largest-to-end',
          '  repeat:',
          '    swapped = false',
          '    for i in 0 .. n-2:',
          '      // compare adjacent pair',
          '      if a[i] > a[i+1]:',
          '        swap(a[i], a[i+1])        // adjacent swap preserves equal-order ⇒ stable',
          '        swapped = true',
          '    n = n - 1                      // last item is now in correct place',
          '  until swapped == false            // early exit on already/nearly-sorted'
        ],
        uses: [
          'Teaching stability and local swapping behavior',
          'Tiny arrays that are almost sorted (early exit helps)',
          'As a sanity-check pass after other transforms'
        ],
        openLink: '/sorting?algo=bubble'
      },
      {
        name: 'Insertion Sort', key: 'insertion',
        best: 'O(n)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)',
        blurb: 'Builds a sorted prefix; inserts each next element by shifting larger items right.',
        props: ['Stable', 'In-place', 'Adaptive (works well when nearly sorted)'],
        pseudo: [
          'insertionSort(a):',
          '  // Invariant: a[0..i-1] is sorted before processing a[i]',
          '  for i in 1 .. n-1:',
          '    key = a[i]',
          '    j = i - 1',
          '    // shift items > key one step to the right',
          '    while j >= 0 and a[j] > key:',
          '      a[j+1] = a[j]',
          '      j = j - 1',
          '    a[j+1] = key                    // insert maintains stability',
          '  // Great when inversions are few; used as small-run finisher'
        ],
        uses: [
          'Small arrays or tail stages inside hybrid sorts (e.g., TimSort, introsort)',
          'Online insertion into a sorted buffer (auto-complete lists)',
          'Datasets that are almost sorted (few inversions)'
        ],
        openLink: '/sorting?algo=insertion'
      },
      {
        name: 'Selection Sort', key: 'selection',
        best: 'O(n²)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)',
        blurb: 'Repeatedly select min from the suffix and place it at the front.',
        props: ['Not stable (unless specialized)', 'In-place', 'Deterministic swaps ≤ n−1'],
        pseudo: [
          'selectionSort(a):',
          '  // Invariant: a[0..i-1] contains the i smallest items in order',
          '  for i in 0 .. n-2:',
          '    minIdx = i',
          '    for j in i+1 .. n-1:',
          '      if a[j] < a[minIdx]: minIdx = j',
          '    if minIdx != i: swap(a[i], a[minIdx])   // at most n-1 swaps overall',
        ],
        uses: [
          'When writes must be minimized (EEPROM/flash with limited write cycles)',
          'Very small fixed-size arrays in embedded contexts',
          'Pedagogical contrast with stability vs. write count'
        ],
        openLink: '/sorting?algo=selection'
      },
      {
        name: 'Merge Sort', key: 'merge',
        best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)',
        blurb: 'Divide array in halves, sort each, and merge stably.',
        props: ['Stable (typical array implementation)', 'Not in-place (arrays)', 'Cache-friendly sequential merging'],
        pseudo: [
          'mergeSort(a, lo, hi):',
          '  if lo >= hi: return',
          '  mid = (lo + hi) // 2',
          '  mergeSort(a, lo, mid)',
          '  mergeSort(a, mid+1, hi)',
          '  merge(a, lo, mid, hi)',
          '',
          'merge(a, lo, mid, hi):',
          '  // Merge two sorted ranges a[lo..mid], a[mid+1..hi]',
          '  L = a[lo..mid], R = a[mid+1..hi]',
          '  i = 0; j = 0; k = lo',
          '  while i < len(L) and j < len(R):',
          '    if L[i] <= R[j]: a[k] = L[i]; i++',
          '    else:             a[k] = R[j]; j++',
          '    k++',
          '  // copy leftovers',
          '  while i < len(L): a[k++] = L[i++]',
          '  while j < len(R): a[k++] = R[j++]'
        ],
        uses: [
          'External sorting on disk / streams (sequential IO)',
          'Linked lists (can be done in O(1) extra space, naturally stable)',
          'Stable sort requirement in data pipelines'
        ],
        openLink: '/sorting?algo=merge'
      },
      {
        name: 'Quick Sort', key: 'quick',
        best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n²)', space: 'O(log n)',
        blurb: 'Partition around a pivot, recurse on partitions; great cache locality.',
        props: ['Not stable (typical)', 'In-place (partitioning)', 'Great cache behavior'],
        pseudo: [
          'quickSort(a, lo, hi):',
          '  if lo >= hi: return',
          '  p = partition(a, lo, hi)          // choose pivot; Lomuto shown here',
          '  quickSort(a, lo, p-1)',
          '  quickSort(a, p+1, hi)',
          '',
          'partition(a, lo, hi):',
          '  pivot = a[hi]',
          '  i = lo',
          '  for j in lo .. hi-1:',
          '    if a[j] <= pivot:',
          '      swap(a[i], a[j])               // move small/equal to left',
          '      i++',
          '  swap(a[i], a[hi])                  // pivot to final position',
          '  return i',
          '// Practical: use randomized/median-of-3 pivot; switch to insertion for small ranges'
        ],
        uses: [
          'General-purpose in-memory sort (std::sort/introsort core in many libs)',
          'Query engines / partition-based joins',
          'Fast dedup/partition steps in data processing'
        ],
        openLink: '/sorting?algo=quick'
      },
      {
        name: 'Heap Sort', key: 'heap',
        best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(1)',
        blurb: 'Build a max-heap, repeatedly move max to the end.',
        props: ['Not stable', 'In-place', 'Worst-case O(n log n)'],
        pseudo: [
          'heapSort(a):',
          '  buildMaxHeap(a)',
          '  for end = n-1 down to 1:',
          '    swap(a[0], a[end])               // move max to end',
          '    siftDown(a, 0, end)              // restore heap in a[0..end-1]',
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
          '    swap(a[i], a[largest]); i = largest'
        ],
        uses: [
          'Memory-tight environments needing guaranteed O(n log n) and O(1) extra space',
          'Top-K / priority scheduling building blocks (heaps themselves)',
          'Streaming selection where partial order is enough'
        ],
        openLink: '/sorting?algo=heap'
      }
    ],
    path: [
      {
        name: 'BFS', key: 'bfs',
        best: 'O(V+E)', avg: 'O(V+E)', worst: 'O(V+E)', space: 'O(V)',
        blurb: 'Expands by distance layers; shortest paths on unweighted graphs.',
        props: ['Finds shortest paths (unweighted)', 'Complete on finite graphs'],
        pseudo: [
          'bfs(G, s, t):',
          '  Q = queue(); Q.push(s)',
          '  seen = { s }; parent = {}',
          '  while Q not empty:',
          '    v = Q.pop()',
          '    if v == t: break                 // reach goal with shortest distance',
          '    for u in neighbors(v):',
          '      if u not in seen:',
          '        seen.add(u); parent[u] = v; Q.push(u)',
          '  // Reconstruct path t→s via parent if t was reached'
        ],
        uses: [
          'Shortest hops in social/communication networks',
          'Minimum moves in board puzzles (unweighted grids)',
          'Level-order traversal in trees'
        ],
        openLink: '/pathfinding?algo=bfs'
      },
      {
        name: 'DFS', key: 'dfs',
        best: 'O(V+E)', avg: 'O(V+E)', worst: 'O(V+E)', space: 'O(V)',
        blurb: 'Depth-first exploration; great for structure discovery (not shortest).',
        props: ['Low overhead', 'Good for structure (not distances)'],
        pseudo: [
          'dfs_iter(G, s):                      // iterative to avoid deep recursion',
          '  S = stack([s]); seen = { s }',
          '  while S not empty:',
          '    v = S.pop()',
          '    // process v here (preorder)',
          '    for u in neighbors(v):',
          '      if u not in seen: seen.add(u); S.push(u)',
          '',
          'dfs_rec(G, v):                        // recursive variant',
          '  seen.add(v)',
          '  for u in neighbors(v):',
          '    if u not in seen: dfs_rec(G, u)'
        ],
        uses: [
          'Cycle detection, connected components, articulation points',
          'Topological sort on DAGs',
          'Backtracking search (mazes, constraint problems)'
        ],
        openLink: '/pathfinding?algo=dfs'
      },
      {
        name: 'Dijkstra', key: 'dijkstra',
        best: 'O(E log V)', avg: 'O(E log V)', worst: 'O(E log V)', space: 'O(V)',
        blurb: 'Shortest paths with non-negative weights using a min-heap.',
        props: ['Optimal with non-negative weights', 'Label-setting (settled distances)'],
        pseudo: [
          'dijkstra(G, s):',
          '  dist[v] = +inf for all v; dist[s] = 0',
          '  parent = {}',
          '  PQ = min-heap of (dist, v); push (0, s)',
          '  while PQ not empty:',
          '    (d, v) = pop_min(PQ)',
          '    if d > dist[v]: continue          // skip stale entries',
          '    for (v→u, w) in edges:',
          '      nd = dist[v] + w',
          '      if nd < dist[u]:',
          '        dist[u] = nd; parent[u] = v',
          '        push (nd, u) into PQ',
          '  // parent gives shortest paths tree'
        ],
        uses: [
          'Road-routing / GPS with non-negative edge costs',
          'Network latency/capacity planning',
          'Weighted grid pathfinding when A* has weak/no heuristic'
        ],
        openLink: '/pathfinding?algo=dijkstra'
      },
      {
        name: 'A*', key: 'astar',
        best: 'O(E)', avg: 'O(E)', worst: 'O(E)', space: 'O(V)',
        blurb: 'Best-first search with heuristic h; optimal if h is admissible & consistent.',
        props: ['Optimal with admissible heuristic', 'Often much faster than Dijkstra'],
        pseudo: [
          'a_star(G, s, t, h):                    // h(u) ≤ true distance(u,t)',
          '  g[v] = +inf; f[v] = +inf',
          '  g[s] = 0;  f[s] = h(s, t)',
          '  open = min-heap ordered by f; push (f[s], s)',
          '  parent = {}',
          '  while open not empty:',
          '    (fv, v) = pop_min(open)',
          '    if v == t: break',
          '    for (v→u, w) in edges:',
          '      tentative = g[v] + w',
          '      if tentative < g[u]:',
          '        g[u] = tentative',
          '        f[u] = g[u] + h(u, t)         // h guides search toward t',
          '        parent[u] = v; push (f[u], u)',
          '  // path via parent if t reached'
        ],
        uses: [
          'Game AI/path planning on grids (Manhattan/Octile/Euclid heuristics)',
          'Robotics navigation with map heuristics',
          'Any weighted shortest path where good heuristics exist'
        ],
        openLink: '/pathfinding?algo=astar'
      }
    ]
  }
  
  export const COMPLEXITY_ROWS = [
    { name: 'O(1)',       desc: 'Constant time' },
    { name: 'O(log n)',   desc: 'Logarithmic (binary search, heap ops)' },
    { name: 'O(n)',       desc: 'Linear (single pass)' },
    { name: 'O(n log n)', desc: 'Divide & conquer / heap or well-partitioned quicksort' },
    { name: 'O(n²)',      desc: 'Quadratic (double loop, many simple sorts)' },
  ]
  