# Algomotion

A modern React application built with Vite, featuring Material-UI components, Tailwind CSS styling, and smooth animations powered by Framer Motion.

## 🚀 Features

- **Sorting Arena** - Interactive visualization of 6 sorting algorithms (Bubble, Insertion, Selection, Merge, Quick, Heap) with step-by-step animations, customizable speed, and performance metrics
- **Pathfinding Arena** - Visualize pathfinding algorithms (BFS, DFS, Dijkstra, A*) on dynamic grids with maze generation and open field modes
- **Complexity Explorer** - Benchmark algorithms across input sizes with Big-O curve overlays and customizable test parameters
- **Algorithm Library** - Comprehensive reference with pseudocode, complexity analysis, and real-world use cases for each algorithm
- **Interactive Controls** - Adjustable speed, array sizes, grid dimensions, and algorithm parameters in real-time
- **Performance Metrics** - Track comparisons, writes, visited nodes, path length, and execution time
- **Multiple Input Types** - Test algorithms on random, reversed, nearly-sorted, and few-unique data sets
- **Visual Feedback** - Color-coded animations showing algorithm progress with smooth transitions
- **Export Capabilities** - Download benchmark results as CSV for further analysis
- **Responsive Design** - Works seamlessly across desktop and mobile devices

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (version 18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Algomotion
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

## 🏃‍♂️ Available Scripts

In the project directory, you can run:

### `npm run dev`
Runs the app in development mode.\
Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm run build`
Builds the app for production to the `dist` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

### `npm run preview`
Locally preview the production build. This will serve the built files from the `dist` folder.

### `npm run lint`
Runs ESLint to check for code quality issues and enforce coding standards.

## 🏗️ Project Structure

```
Algomotion/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable React components
│   ├── pages/             # Page components and routing
│   ├── App.jsx            # Main application component
│   ├── main.jsx           # Application entry point
│   └── index.css          # Global styles
├── package.json           # Dependencies and scripts
├── vite.config.js         # Vite configuration
├── eslint.config.js       # ESLint configuration
└── .gitignore            # Git ignore rules
```

## 🛠️ Tech Stack

- **Frontend Framework**: React 19
- **Build Tool**: Vite
- **UI Library**: Material-UI (MUI)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Routing**: React Router DOM
- **Charts**: Recharts
- **Code Quality**: ESLint
- **Package Manager**: npm/yarn

## 🎨 Styling

This project uses a combination of:
- **Material-UI (MUI)** for component library and theming
- **Tailwind CSS** for utility-first styling
- **Framer Motion** for animations and transitions

## 📦 Dependencies

### Production Dependencies
- `@emotion/react` & `@emotion/styled` - CSS-in-JS styling
- `@mui/material` & `@mui/icons-material` - Material-UI components
- `framer-motion` - Animation library
- `react-router-dom` - Client-side routing
- `recharts` - Chart library
- `tailwindcss` - Utility-first CSS framework

### Development Dependencies
- `@vitejs/plugin-react` - Vite React plugin
- `eslint` - Code linting
- `vite` - Build tool and dev server

## 🚀 Deployment

The easiest way to deploy your React app is to use the [Vite](https://vitejs.dev/) build process.

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy the `dist` folder**
   The `dist` folder contains your production-ready application.

### Popular deployment platforms:
- **Vercel**: Connect your GitHub repository for automatic deployments
- **Netlify**: Drag and drop the `dist` folder
- **GitHub Pages**: Use GitHub Actions for automatic deployment
- **Firebase Hosting**: Use Firebase CLI for deployment

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:
1. Check the [Issues](https://github.com/yourusername/Algomotion/issues) page
2. Create a new issue with a detailed description
3. Include steps to reproduce the problem

---

**Happy coding! 🎉**
