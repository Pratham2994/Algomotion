import { Box, Stack, Typography } from '@mui/material'
import ScienceRoundedIcon from '@mui/icons-material/ScienceRounded'

export default function LibraryHeader() {
  return (
    <Box className="rounded-2xl border border-slate-800 bg-[#0d1422]/60 p-4 sm:p-6 md:p-8">
      <Stack direction="row" spacing={2} alignItems="center" className="mb-2">
        <ScienceRoundedIcon sx={{ color: '#67e8f9' }} />
        <Typography
          variant="h4"
          className="!font-bold leading-tight text-[22px] sm:text-[26px] md:text-[32px]"
        >
          Algorithm Library
        </Typography>
      </Stack>
      <Typography className="text-slate-400">
        The theory companion to your visualizers: concise notes, pseudocode, complexities, mini-demos,
        and real-world context for sorting and pathfinding.
      </Typography>
    </Box>
  )
}
