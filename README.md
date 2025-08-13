# Algomotion

Interactive algorithm visualization suite with step-by-step animations, performance analysis, and AI-powered complexity insights.

## Features

**Sorting Arena** – Watch 11 sorting algorithms come to life with adjustable speed controls, array customization, and real-time metrics tracking (comparisons, writes, execution time)

**Pathfinding Arena** – Explore 6 pathfinding algorithms on dynamic grids with maze generation, weighted paths, diagonal movement, and heuristic options

**Complexity Explorer** – Benchmark algorithms across varying input sizes with Big-O curve overlays, multiple trial runs, and CSV export capabilities

**AI Complexity Analyzer** – Paste any code and get instant Big-O analysis, bottleneck identification, and optimization suggestions powered by AI

**Algorithm Library** – Complete reference with pseudocode, complexity tables, use cases, and interactive mini-demos for every algorithm

## Algorithms Available

**Sorting (11 algorithms):**
- **Basic:** Bubble Sort, Insertion Sort, Selection Sort
- **Efficient:** Merge Sort, Quick Sort, Heap Sort
- **Linear:** Counting Sort, Radix Sort (LSD)  
- **Hybrid:** TimSort, IntroSort
- **Educational:** Pancake Sort

**Pathfinding (6 algorithms):**
- **Unweighted:** BFS, DFS
- **Weighted:** Dijkstra, A* (Manhattan/Euclidean/Octile heuristics)
- **Specialized:** Greedy Best-First, Dial's Algorithm

## Quick Start

```bash
git clone https://github.com/Pratham2994/Algomotion.git
cd Algomotion
npm install
npm run dev
```

Open [localhost:5173](http://localhost:5173) and start exploring algorithms.

## Tech Stack

Built with React 19, Vite, Material-UI, Tailwind CSS, and Framer Motion. Deployed on Vercel with analytics and performance monitoring.

## Development

```bash
npm run dev      # Start development server
npm run build    # Build for production  
npm run preview  # Preview production build
npm run lint     # Check code quality
```

The app runs on port 5173 in development mode with hot reloading.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Open a pull request

