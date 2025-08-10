import {
    Card, CardHeader, CardContent, Typography, Grid, Box,
    FormControl, InputLabel, Select, MenuItem, Button, Slider, Checkbox, ListItemText
  } from '@mui/material'
  import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
  import PauseRoundedIcon from '@mui/icons-material/PauseRounded'
  import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded'
  import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
  import { SORTERS, O_CURVES } from '../../lib/benchCore'
  
  export default function CompControls(props) {
    const {
      algos, setAlgos,
      metric, setMetric,
      generator, setGenerator,
      minN, setMinN, maxN, setMaxN, points, setPoints,
      trials, setTrials, seed, setSeed,
      overlays, setOverlays, logScale, setLogScale,
      running, onRun, onPause, onReset, onExport
    } = props
  
    return (
      <Card variant="outlined" sx={{ borderColor: '#1f2937', background: '#0a1220' }}>
        <CardHeader title={<Typography variant="h6" className="!font-semibold">Controls</Typography>} sx={{ pb: 1 }} />
        <CardContent>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth size="medium">
                <InputLabel id="algos">Algorithms</InputLabel>
                <Select
                  labelId="algos" multiple value={algos} label="Algorithms"
                  onChange={(e) => setAlgos(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                  renderValue={(selected) => selected.map(k => SORTERS[k].label).join(', ')}
                  sx={{ '& .MuiSelect-select': { color: '#e2e8f0' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#374151' } }}
                >
                  {Object.keys(SORTERS).map(k => (
                    <MenuItem key={k} value={k}>
                      <Checkbox checked={algos.indexOf(k) > -1} />
                      <ListItemText primary={SORTERS[k].label} secondary={SORTERS[k].bigO} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
  
            <Grid size={{ xs: 6, md: 2 }}>
              <FormControl fullWidth size="medium">
                <InputLabel id="metric">Metric</InputLabel>
                <Select
                  labelId="metric" value={metric} label="Metric"
                  onChange={e => setMetric(e.target.value)}
                  sx={{ '& .MuiSelect-select': { color: '#e2e8f0' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#374151' } }}
                >
                  <MenuItem value="runtime">Runtime (ms)</MenuItem>
                  <MenuItem value="comparisons">Comparisons</MenuItem>
                  <MenuItem value="writes">Writes</MenuItem>
                </Select>
              </FormControl>
            </Grid>
  
            <Grid size={{ xs: 6, md: 2 }}>
              <FormControl fullWidth size="medium">
                <InputLabel id="gen">Input</InputLabel>
                <Select
                  labelId="gen" value={generator} label="Input"
                  onChange={e => setGenerator(e.target.value)}
                  sx={{ '& .MuiSelect-select': { color: '#e2e8f0' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#374151' } }}
                >
                  <MenuItem value="random">Random</MenuItem>
                  <MenuItem value="reversed">Reversed</MenuItem>
                  <MenuItem value="nearly">Nearly-sorted</MenuItem>
                  <MenuItem value="fewunique">Few unique</MenuItem>
                </Select>
              </FormControl>
            </Grid>
  
            <Grid size={{ xs: 12, md: 4 }}>
              <Box>
                <Typography variant="subtitle2" className="text-slate-300 mb-2">
                  Sizes: {minN} → {maxN}  •  Points: {points}
                </Typography>
                <Box className="flex flex-col md:flex-row gap-4">
                  <Box className="flex-1">
                    <Typography variant="caption" className="text-slate-400">Min N</Typography>
                    <Slider value={minN} min={8} max={2048} step={8} onChange={(_, v) => setMinN(v)}
                      sx={{ '& .MuiSlider-track': { backgroundColor: '#67e8f9' }, '& .MuiSlider-thumb': { backgroundColor: '#67e8f9' }, '& .MuiSlider-rail': { backgroundColor: '#374151' } }} />
                  </Box>
                  <Box className="flex-1">
                    <Typography variant="caption" className="text-slate-400">Max N</Typography>
                    <Slider value={maxN} min={minN} max={32768} step={16} onChange={(_, v) => setMaxN(v)}
                      sx={{ '& .MuiSlider-track': { backgroundColor: '#67e8f9' }, '& .MuiSlider-thumb': { backgroundColor: '#67e8f9' }, '& .MuiSlider-rail': { backgroundColor: '#374151' } }} />
                  </Box>
                  <Box className="flex-[.8]">
                    <Typography variant="caption" className="text-slate-400">Points</Typography>
                    <Slider value={points} min={3} max={5} step={1} onChange={(_, v) => setPoints(v)}
                      sx={{ '& .MuiSlider-track': { backgroundColor: '#67e8f9' }, '& .MuiSlider-thumb': { backgroundColor: '#67e8f9' }, '& .MuiSlider-rail': { backgroundColor: '#374151' } }} />
                  </Box>
                </Box>
              </Box>
            </Grid>
  
            <Grid size={{ xs: 12, md: 4 }}>
              <Box>
                <Typography variant="subtitle2" className="text-slate-300 mb-2">
                  Trials: {trials} • Seed: {seed}
                </Typography>
                <Box className="flex flex-col md:flex-row gap-4">
                  <Box className="flex-1">
                    <Typography variant="caption" className="text-slate-400">Trials per size</Typography>
                    <Slider value={trials} min={1} max={5} step={1} onChange={(_, v) => setTrials(v)}
                      sx={{ '& .MuiSlider-track': { backgroundColor: '#67e8f9' }, '& .MuiSlider-thumb': { backgroundColor: '#67e8f9' }, '& .MuiSlider-rail': { backgroundColor: '#374151' } }} />
                    <Typography variant="caption" className="text-slate-500 block mt-1">
                      More trials = smoother curves; we take the <strong>median</strong>.
                    </Typography>
                  </Box>
                  <Box className="flex-1">
                    <Typography variant="caption" className="text-slate-400">Seed</Typography>
                    <Slider value={seed} min={0} max={999} step={1} onChange={(_, v) => setSeed(v)}
                      sx={{ '& .MuiSlider-track': { backgroundColor: '#67e8f9' }, '& .MuiSlider-thumb': { backgroundColor: '#67e8f9' }, '& .MuiSlider-rail': { backgroundColor: '#374151' } }} />
                    <Typography variant="caption" className="text-slate-500 block mt-1">
                      Same seed → same random data (reproducible).
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
  
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth size="medium">
                <InputLabel id="ov">Big-O Overlays</InputLabel>
                <Select
                  labelId="ov" multiple value={overlays} label="Big-O Overlays"
                  onChange={(e) => setOverlays(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                  renderValue={(s) => s.join(', ')}
                  sx={{ '& .MuiSelect-select': { color: '#e2e8f0' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#374151' } }}
                >
                  {Object.keys(O_CURVES).map(k => (
                    <MenuItem key={k} value={k}>
                      <Checkbox checked={overlays.indexOf(k) > -1} />
                      <ListItemText primary={k} />
                    </MenuItem>
                  ))}
                </Select>
                <Typography variant="caption" className="text-slate-500 block mt-1">
                  Overlays are normalized at the first point to compare <em>shape</em>.
                </Typography>
              </FormControl>
              <Box className="mt-3">
                <Button
                  variant="outlined"
                  onClick={() => setLogScale(v => !v)}
                  sx={{ borderColor: '#67e8f9', color: '#67e8f9', '&:hover': { borderColor: '#22d3ee', color: '#22d3ee' } }}
                >
                  {logScale ? 'Y-Scale: Log' : 'Y-Scale: Linear'}
                </Button>
              </Box>
            </Grid>
  
            <Grid size={{ xs: 12, md: 4 }}>
              <Box className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                {!running ? (
                  <Button
                    onClick={onRun}
                    startIcon={<PlayArrowRoundedIcon />}
                    variant="contained"
                    sx={{ backgroundColor: '#059669', '&:hover': { backgroundColor: '#047857' } }}
                  >
                    Run
                  </Button>
                ) : (
                  <Button
                    onClick={onPause}
                    startIcon={<PauseRoundedIcon />}
                    variant="contained"
                    sx={{ backgroundColor: '#dc2626', '&:hover': { backgroundColor: '#b91c1c' } }}
                  >
                    Pause
                  </Button>
                )}
                <Button
                  onClick={onReset}
                  startIcon={<RestartAltRoundedIcon />}
                  variant="contained"
                  sx={{ backgroundColor: '#374151', '&:hover': { backgroundColor: '#1f2937' } }}
                >
                  Reset
                </Button>
                <Button
                  onClick={onExport}
                  startIcon={<DownloadRoundedIcon />}
                  variant="outlined"
                  sx={{ borderColor: '#67e8f9', color: '#67e8f9', '&:hover': { borderColor: '#22d3ee', color: '#22d3ee' } }}
                >
                  Export CSV
                </Button>
              </Box>
            </Grid>
          </Grid>
  
          <Box
            className="mt-4"
            sx={{
              background: 'rgba(30,41,59,.4)',
              border: '1px solid #1f2937',
              borderRadius: 2,
              p: 2,
            }}
          >
            <Typography variant="body2" className="text-slate-300">
              <strong>How to read:</strong> Pick algorithms and a metric, choose how inputs are generated, then sweep sizes from <em>Min → Max</em>.
              We run each size multiple times and show the <em>median</em> to reduce noise.
              Dashed <em>Big-O overlays</em> are scaled at the first point so you compare <em>growth shape</em>, not raw values.
              Use <em>Log scale</em> when lines diverge a lot.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    )
  }
  