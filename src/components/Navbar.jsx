import { useEffect, useState } from 'react'
import { AppBar, Toolbar, Box } from '@mui/material'
import InsightsIcon from '@mui/icons-material/Insights'
import { NavLink } from 'react-router-dom'
const linkBase = "relative px-3 py-2 rounded-md text-slate-200 text-lg hover:text-white transition-colors"
const activeLink = "text-cyan-300 font-bold after:absolute after:left-3 after:right-3 after:-bottom-1 after:h-[2px] after:rounded-full after:bg-cyan-300"
export default function Navbar() {
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 4)
        onScroll()
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    return (
        <AppBar
            position="sticky"
            elevation={scrolled ? 3 : 0}
            sx={{
                transition: 'background .25s ease, box-shadow .25s ease, border-color .25s ease',
                background: scrolled ? 'rgba(9,12,20,.92)' : 'transparent',
                backdropFilter: scrolled ? 'blur(10px)' : 'none',
                borderBottom: scrolled ? '1px solid #1f2937' : '1px solid transparent',
            }}
        >
            <Toolbar className="max-w-6xl w-full mx-auto">
                <Box className="flex items-center gap-2">
                    <InsightsIcon sx={{ color: '#67e8f9' }} />
                    <span className="font-bold tracking-wide text-2xl text-white">Algomotion</span>
                </Box>

                <Box className="flex-1" />

                <Box className="hidden md:flex items-center gap-1">
                    {/* Use NavLink's built-in isActive; 'end' makes '/' exact */}
                    <NavLink
                        to="/"
                        end
                        className={({ isActive }) => `${linkBase} ${isActive ? activeLink : ""}`}
                    >
                        Home
                    </NavLink>

                    <NavLink
                        to="/sorting"
                        className={({ isActive }) => `${linkBase} ${isActive ? activeLink : ""}`}
                    >
                        Sorting
                    </NavLink>

                    <NavLink
                        to="/pathfinding"
                        className={({ isActive }) => `${linkBase} ${isActive ? activeLink : ""}`}
                    >
                        Pathfinding
                    </NavLink>
                    <NavLink
                        to="/complexity"
                        className={({ isActive }) => `${linkBase} ${isActive ? activeLink : ""}`}
                    >
                        Complexity
                    </NavLink>

                    <NavLink
                        to="/library"
                        className={({ isActive }) => `${linkBase} ${isActive ? activeLink : ""}`}
                    >
                        Library
                    </NavLink>
       
                </Box>
            </Toolbar>
        </AppBar>
    )
}
