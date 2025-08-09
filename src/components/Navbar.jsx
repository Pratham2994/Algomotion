import { useEffect, useState } from 'react'
import {
  AppBar, Toolbar, Box, IconButton, Drawer, List, ListItemButton, ListItemText, Divider
} from '@mui/material'
import InsightsIcon from '@mui/icons-material/Insights'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { NavLink, Link, useLocation } from 'react-router-dom'

const linkBase =
  "relative px-3 py-2 rounded-md text-slate-200 text-lg hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300/60 focus-visible:outline-offset-2"

const activeLink =
  "text-cyan-300 font-bold after:absolute after:left-3 after:right-3 after:-bottom-1 after:h-[2px] after:rounded-full after:bg-cyan-300 after:transition-[transform,opacity] after:duration-200 after:opacity-100 after:scale-100"

const inactiveUnderline =
  "after:absolute after:left-3 after:right-3 after:-bottom-1 after:h-[2px] after:rounded-full after:bg-cyan-300/0 after:opacity-0 after:scale-75"

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/sorting', label: 'Sorting' },
  { to: '/pathfinding', label: 'Pathfinding' },
  { to: '/complexity', label: 'Complexity' },
  { to: '/library', label: 'Library' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // close drawer on route change
  useEffect(() => { setOpen(false) }, [location.pathname])

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
      <Toolbar className="max-w-6xl w-full mx-auto gap-2">
        {/* Brand */}
        <Box className="flex items-center gap-2">
          <Link to="/" aria-label="Algomotion home" className="flex items-center gap-2">
            <InsightsIcon sx={{ color: '#67e8f9' }} />
            <span className="font-bold tracking-wide text-2xl text-white">Algomotion</span>
          </Link>
        </Box>

        <Box className="flex-1" />

        {/* Desktop links (unchanged) */}
        <Box className="hidden md:flex items-center gap-1">
          {NAV.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `${linkBase} ${isActive ? activeLink : inactiveUnderline}`}
            >
              {label}
            </NavLink>
          ))}
        </Box>

        {/* Mobile hamburger */}
        <Box className="md:hidden">
          <IconButton
            aria-label="Open navigation"
            onClick={() => setOpen(true)}
            sx={{ color: '#e2e8f0' }}
          >
            <MenuRoundedIcon />
          </IconButton>
        </Box>
      </Toolbar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            width: '80vw',
            maxWidth: 360,
            backgroundColor: '#0b1220',
            borderLeft: '1px solid #1f2937'
          }
        }}
      >
        <Box className="flex items-center justify-between px-3 py-2">
          <Box className="flex items-center gap-2">
            <InsightsIcon sx={{ color: '#67e8f9' }} />
            <span className="font-bold tracking-wide text-xl text-white">Algomotion</span>
          </Box>
          <IconButton aria-label="Close navigation" onClick={() => setOpen(false)} sx={{ color: '#e2e8f0' }}>
            <CloseRoundedIcon />
          </IconButton>
        </Box>
        <Divider sx={{ borderColor: '#1f2937' }} />
        <List sx={{ py: 1 }}>
          {NAV.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} style={{ textDecoration: 'none' }}>
              {({ isActive }) => (
                <ListItemButton
                  sx={{
                    px: 2.25,
                    '&:hover': { backgroundColor: 'rgba(148,163,184,.06)' },
                    ...(isActive ? { backgroundColor: 'rgba(103,232,249,.08)' } : {})
                  }}
                >
                  <ListItemText
                    primary={label}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 700 : 600,
                      color: isActive ? '#67e8f9' : '#e2e8f0'
                    }}
                  />
                </ListItemButton>
              )}
            </NavLink>
          ))}
        </List>
      </Drawer>
    </AppBar>
  )
}
