// src/components/sorting/SortControls.jsx
import {
    Box, Card, CardContent, CardHeader, Typography,
    Slider, Select, MenuItem, FormControl, InputLabel, Button, ButtonGroup, Grid
  } from '@mui/material'
  import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
  import PauseRoundedIcon from '@mui/icons-material/PauseRounded'
  import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded'
  import SkipNextRoundedIcon from '@mui/icons-material/SkipNextRounded'
  import ShuffleRoundedIcon from '@mui/icons-material/ShuffleRounded'
  
  export default function SortControls({
    algo, setAlgo, n, setN, speed, setSpeed,
    running, run, pause, applyOneStep, reset, randomize
  }) {
    return (
      <Card variant="outlined" sx={{ borderColor: '#1f2937', background: '#0a1220' }}>
        <CardHeader
          title={<Typography variant="h6" className="!font-semibold">Controls</Typography>}
          sx={{ pb: 1 }}
        />
        <CardContent>
          <Grid container spacing={4}>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="medium">
                <InputLabel id="algo-label">Algorithm</InputLabel>
                <Select
                  labelId="algo-label"
                  label="Algorithm"
                  value={algo}
                  onChange={e => setAlgo(e.target.value)}
                  sx={{
                    '& .MuiSelect-select': { color: '#e2e8f0' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#374151' }
                  }}
                >
                  <MenuItem value="bubble">Bubble Sort</MenuItem>
                  <MenuItem value="insertion">Insertion Sort</MenuItem>
                  <MenuItem value="selection">Selection Sort</MenuItem>
                  <MenuItem value="merge">Merge Sort</MenuItem>
                  <MenuItem value="quick">Quick Sort</MenuItem>
                  <MenuItem value="heap">Heap Sort</MenuItem>
                  <MenuItem value="counting">Counting Sort</MenuItem>
                  <MenuItem value="radix">Radix Sort</MenuItem>
                  <MenuItem value="pancake">Pancake Sort</MenuItem>
                  <MenuItem value="tim">Tim Sort</MenuItem>
                  <MenuItem value="intro">Intro Sort</MenuItem>

                </Select>
              </FormControl>
            </Grid>
  
            <Grid item xs={12} md={3}>
              <Box>
                <Typography variant="subtitle2" className="text-slate-300 mb-2">
                  Array Size: {n}
                </Typography>
                <Slider
                  value={n} min={5} max={100} step={2} onChange={(_, v) => setN(v)}
                  size="medium"
                  sx={{
                    '& .MuiSlider-track': { backgroundColor: '#67e8f9' },
                    '& .MuiSlider-thumb': { backgroundColor: '#67e8f9' },
                    '& .MuiSlider-rail': { backgroundColor: '#374151' }
                  }}
                />
              </Box>
            </Grid>
  
            <Grid item xs={12} md={3}>
              <Box>
                <Typography variant="subtitle2" className="text-slate-300 mb-2">
                  Speed: {speed}x
                </Typography>
                <Slider
                  value={speed} min={0.25} max={5} step={0.25} onChange={(_, v) => setSpeed(v)}
                  size="medium"
                  sx={{
                    '& .MuiSlider-track': { backgroundColor: '#67e8f9' },
                    '& .MuiSlider-thumb': { backgroundColor: '#67e8f9' },
                    '& .MuiSlider-rail': { backgroundColor: '#374151' }
                  }}
                />
              </Box>
            </Grid>
  
            <Grid item xs={12} md={3}>
              <div className="flex flex-col gap-3">
                <Button
                  variant="outlined"
                  startIcon={<ShuffleRoundedIcon />}
                  onClick={randomize}
                  fullWidth
                  sx={{
                    borderColor: '#67e8f9',
                    color: '#67e8f9',
                    '&:hover': { borderColor: '#22d3ee', color: '#22d3ee' }
                  }}
                >
                  New Array
                </Button>
  
                <ButtonGroup variant="contained" fullWidth>
                  {!running ? (
                    <Button
                      onClick={run}
                      startIcon={<PlayArrowRoundedIcon />}
                      sx={{ backgroundColor: '#059669', '&:hover': { backgroundColor: '#047857' } }}
                    >
                      Run
                    </Button>
                  ) : (
                    <Button
                      onClick={pause}
                      startIcon={<PauseRoundedIcon />}
                      sx={{ backgroundColor: '#dc2626', '&:hover': { backgroundColor: '#b91c1c' } }}
                    >
                      Pause
                    </Button>
                  )}
                  <Button
                    onClick={applyOneStep}
                    startIcon={<SkipNextRoundedIcon />}
                    sx={{ backgroundColor: '#7c3aed', '&:hover': { backgroundColor: '#6d28d9' } }}
                  >
                    Step
                  </Button>
                  <Button
                    onClick={reset}
                    startIcon={<RestartAltRoundedIcon />}
                    sx={{ backgroundColor: '#374151', '&:hover': { backgroundColor: '#1f2937' } }}
                  >
                    Reset
                  </Button>
                </ButtonGroup>
              </div>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    )
  }
  