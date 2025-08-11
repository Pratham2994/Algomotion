// src/components/Footer.jsx
import { useEffect, useRef, useState } from 'react'
import { Box, Container, IconButton, Tooltip, Typography } from '@mui/material'
import GitHubIcon from '@mui/icons-material/GitHub'
import LinkedInIcon from '@mui/icons-material/LinkedIn'

const H = 44 // consistent bar height

export default function Footer() {
  const [atBottom, setAtBottom] = useState(true)
  const ticking = useRef(false)

  useEffect(() => {
    const calc = () => {
      const doc = document.documentElement
      const body = document.body
      const scrollY = window.scrollY || doc.scrollTop
      const viewH = window.innerHeight || doc.clientHeight
      const fullH = Math.max(
        body.scrollHeight, body.offsetHeight,
        doc.scrollHeight, doc.offsetHeight, doc.clientHeight
      )
      // small threshold to account for sub-pixel rounding
      setAtBottom(scrollY + viewH >= fullH - 2)
    }

    const onScroll = () => {
      if (!ticking.current) {
        ticking.current = true
        requestAnimationFrame(() => { calc(); ticking.current = false })
      }
    }

    calc()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  // Shared inner content
  const Inner = (
    <Container maxWidth="lg" sx={{ px: { xs: 1.5, sm: 2, md: 0 } }}>
      <Box className="flex items-center justify-between gap-3" sx={{ height: H, px: 1.5 }}>
        <Typography
          variant="body2"
          className="text-slate-400"
          sx={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          Built by <span className="text-slate-200 font-semibold">Pratham Panchal</span>
        </Typography>

        <Box className="flex items-center">
          <Tooltip title="LinkedIn">
            <IconButton
              aria-label="LinkedIn"
              component="a"
              href="https://www.linkedin.com/in/pratham-panchal-abcd2994/"
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              sx={{ color: '#e2e8f0', '&:hover': { color: '#67e8f9', background: 'rgba(103,232,249,.08)' } }}
            >
              <LinkedInIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="GitHub">
            <IconButton
              aria-label="GitHub"
              component="a"
              href="https://github.com/Pratham2994"
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              sx={{ color: '#e2e8f0', '&:hover': { color: '#67e8f9', background: 'rgba(103,232,249,.08)' } }}
            >
              <GitHubIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Container>
  )

  return (
    <>
      {/* Static, embedded spacer/footer — always occupies space to prevent overlap.
          We just fade its contents in at bottom. */}
      <Box
        component="footer"
        aria-hidden={!atBottom}
        sx={{
          borderTop: '1px solid #1f2937',
          position: 'static',
          minHeight: H,
        }}
      >
        <Box
          sx={{
            opacity: atBottom ? 1 : 0,           // <-- only opacity changes
            transition: 'opacity .18s ease',
          }}
        >
          {Inner}
        </Box>
      </Box>

      {/* Floating overlay — never affects layout; fades out at bottom. */}
      <Box
        sx={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 12,
          zIndex: 1200,
          pointerEvents: 'none',
        }}
      >
        <Box
          sx={{
            mx: 'auto',
            maxWidth: 'lg',
            pointerEvents: 'auto',
            border: '1px solid #1f2937',
            background: 'rgba(9,12,20,.85)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            boxShadow: '0 10px 30px rgba(0,0,0,.35)',
            opacity: atBottom ? 0 : 1,           // <-- only opacity changes
            transform: atBottom ? 'translateY(6px)' : 'translateY(0)',
            transition: 'opacity .18s ease, transform .18s ease',
          }}
        >
          {Inner}
        </Box>
      </Box>
    </>
  )
}
