import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { ThemeProvider, createTheme, CssBaseline, Container, Box } from '@mui/material'
import Navbar from './components/Navbar.jsx'
import Home from './pages/Home.jsx'
import Sorting from './pages/Sorting.jsx'
import Pathfinding from './pages/Pathfinding.jsx'
import Complexity from './pages/Complexity.jsx'
import Library from './pages/Library.jsx'
import Footer from './components/Footer.jsx'
import AIComplexity from './pages/AIComplexity.jsx'
const theme = createTheme({
  palette: { mode: 'dark' },
  shape: { borderRadius: 12 },
})

function GAListener() {
  const location = useLocation()
  useEffect(() => {
    if (!import.meta.env.PROD) return 
    if (window.gtag) {
      window.gtag('config', 'G-G7XR6NHMTX', {
        page_path: location.pathname + location.search,
      })
    }
  }, [location])
  return null
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box className="min-h-screen bg-gradient-to-b from-[#0b0f1a] to-[#0a0d16]">
        <Navbar />
        <Container
          maxWidth="lg"
          className="py-8"
          sx={{ px: { xs: 2, sm: 3, md: 2 } }}
        >
          <GAListener /> 
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/sorting" element={<Sorting />} />
            <Route path="/pathfinding" element={<Pathfinding />} />
            <Route path="/complexity" element={<Complexity />} />
            <Route path="/library" element={<Library />} />
            <Route path="/ai-complexity" element={<AIComplexity />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Container>
        <div id="footer-sentinel" style={{ height: 1 }} />
        <Footer />
      </Box>
    </ThemeProvider>
  )
}
