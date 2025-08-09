import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, createTheme, CssBaseline, Container, Box } from '@mui/material'
import Navbar from './components/Navbar.jsx'
import Home from './pages/Home.jsx'
import Sorting from './pages/Sorting.jsx'
import Pathfinding from './pages/Pathfinding.jsx'
import Complexity from './pages/Complexity.jsx'
import Library from './pages/Library.jsx'
const theme = createTheme({
  palette: { mode: 'dark' },
  shape: { borderRadius: 12 },
})  

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box className="min-h-screen bg-gradient-to-b from-[#0b0f1a] to-[#0a0d16]">
        <Navbar />
        <Container maxWidth="lg" className="py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/sorting" element={<Sorting />} />
            <Route path="/pathfinding" element={<Pathfinding />} />
            <Route path="/complexity" element={<Complexity />} />
            <Route path="/library" element={<Library />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Container>
      </Box>
    </ThemeProvider>
  )
}
