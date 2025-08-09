// src/components/pathfinding/PathControls.jsx
import {
    Box, Card, CardContent, CardHeader, Typography,
    Slider, Select, MenuItem, FormControl, InputLabel,
    Button, ButtonGroup, Grid
} from '@mui/material'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import PauseRoundedIcon from '@mui/icons-material/PauseRounded'
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded'
import SkipNextRoundedIcon from '@mui/icons-material/SkipNextRounded'
import ShuffleRoundedIcon from '@mui/icons-material/ShuffleRounded'

export default function PathControls({
    algo, setAlgo,
    mode, setMode, obst, setObst, braid, setBraid,
    rows, setRows, cols, setCols, speed, setSpeed,
    astarHeur, setAstarHeur, diagonals, setDiagonals,
    weighted, setWeighted, randomTies, setRandomTies,
    running, run, pause, applyOneStep, reset, randomize
}) {
    return (
        <Card variant="outlined" sx={{ borderColor: '#1f2937', background: '#0a1220' }}>
            <CardHeader title={<Typography variant="h6" className="!font-semibold">Controls</Typography>} sx={{ pb: 1 }} />
            <CardContent>
                <Grid container spacing={4}>
                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth size="medium">
                            <InputLabel id="algo">Algorithm</InputLabel>
                            <Select labelId="algo" label="Algorithm" value={algo} onChange={e => setAlgo(e.target.value)}
                                sx={{ '& .MuiSelect-select': { color: '#e2e8f0' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#374151' } }}>
                                <MenuItem value="bfs">BFS</MenuItem>
                                <MenuItem value="dfs">DFS</MenuItem>
                                <MenuItem value="dijkstra">Dijkstra</MenuItem>
                                <MenuItem value="astar">A*</MenuItem>
                                <MenuItem value="greedy">Greedy</MenuItem>
                                <MenuItem value="dials">Dial's</MenuItem>

                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Mode */}
                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth size="medium">
                            <InputLabel id="mode">Mode</InputLabel>
                            <Select labelId="mode" label="Mode" value={mode} onChange={e => setMode(e.target.value)}
                                sx={{ '& .MuiSelect-select': { color: '#e2e8f0' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#374151' } }}>
                                <MenuItem value="maze">Maze</MenuItem>
                                <MenuItem value="open">Open Field</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Obstacles (open only) */}
                    <Grid item xs={12} md={3}>
                        <Box>
                            <Typography variant="subtitle2" className="text-slate-300 mb-2">
                                Obstacles: {(obst * 100) | 0}% {mode === 'open' ? '' : '(open mode only)'}
                            </Typography>
                            <Slider value={obst} min={0} max={0.5} step={0.01} onChange={(_, v) => setObst(v)} disabled={mode !== 'open'}
                                sx={{
                                    '& .MuiSlider-track': { backgroundColor: mode === 'open' ? '#67e8f9' : '#374151' },
                                    '& .MuiSlider-thumb': { backgroundColor: mode === 'open' ? '#67e8f9' : '#374151' },
                                    '& .MuiSlider-rail': { backgroundColor: '#374151' }
                                }} />
                        </Box>
                    </Grid>

                    {/* Braid (maze only) */}
                    <Grid item xs={12} md={3}>
                        <Box>
                            <Typography variant="subtitle2" className="text-slate-300 mb-2">
                                Braid: {(braid * 100) | 0}% {mode === 'maze' ? '' : '(maze mode only)'}
                            </Typography>
                            <Slider value={braid} min={0} max={0.5} step={0.01} onChange={(_, v) => setBraid(v)} disabled={mode !== 'maze'}
                                sx={{
                                    '& .MuiSlider-track': { backgroundColor: mode === 'maze' ? '#67e8f9' : '#374151' },
                                    '& .MuiSlider-thumb': { backgroundColor: mode === 'maze' ? '#67e8f9' : '#374151' },
                                    '& .MuiSlider-rail': { backgroundColor: '#374151' }
                                }} />
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <Box>
                            <Typography variant="subtitle2" className="text-slate-300 mb-2">Rows: {rows}</Typography>
                            <Slider value={rows} min={9} max={51} step={2} onChange={(_, v) => setRows(v)}
                                sx={{ '& .MuiSlider-track': { backgroundColor: '#67e8f9' }, '& .MuiSlider-thumb': { backgroundColor: '#67e8f9' }, '& .MuiSlider-rail': { backgroundColor: '#374151' } }} />
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Box>
                            <Typography variant="subtitle2" className="text-slate-300 mb-2">Cols: {cols}</Typography>
                            <Slider value={cols} min={9} max={73} step={2} onChange={(_, v) => setCols(v)}
                                sx={{ '& .MuiSlider-track': { backgroundColor: '#67e8f9' }, '& .MuiSlider-thumb': { backgroundColor: '#67e8f9' }, '& .MuiSlider-rail': { backgroundColor: '#374151' } }} />
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Box>
                            <Typography variant="subtitle2" className="text-slate-300 mb-2">Speed: {speed}x</Typography>
                            <Slider value={speed} min={0.25} max={100} step={1} onChange={(_, v) => setSpeed(v)}
                                sx={{ '& .MuiSlider-track': { backgroundColor: '#67e8f9' }, '& .MuiSlider-thumb': { backgroundColor: '#67e8f9' }, '& .MuiSlider-rail': { backgroundColor: '#374151' } }} />
                        </Box>
                    </Grid>

                    {/* Divergence */}
                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth size="medium">
                            <InputLabel id="heur" disabled={algo !== 'astar'}>A* Heuristic</InputLabel>
                            <Select labelId="heur" label="A* Heuristic" value={astarHeur} onChange={e => setAstarHeur(e.target.value)} disabled={algo !== 'astar'}
                                sx={{ '& .MuiSelect-select': { color: '#e2e8f0' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#374151' } }}>
                                <MenuItem value="manhattan">Manhattan</MenuItem>
                                <MenuItem value="euclid">Euclidean</MenuItem>
                                <MenuItem value="octile">Octile (8-way)</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <Box className="flex flex-col gap-2">
                            <Button variant="outlined" onClick={() => setDiagonals(v => !v)}
                                sx={{ borderColor: '#67e8f9', color: '#67e8f9', '&:hover': { borderColor: '#22d3ee', color: '#22d3ee' } }}>
                                {diagonals ? 'Diagonals: ON' : 'Diagonals: OFF'}
                            </Button>
                            <Button variant="outlined" onClick={() => setWeighted(v => !v)}
                                sx={{ borderColor: '#67e8f9', color: '#67e8f9', '&:hover': { borderColor: '#22d3ee', color: '#22d3ee' } }}>
                                {weighted ? 'Weighted Cells: ON' : 'Weighted Cells: OFF'}
                            </Button>
                            <Button variant="outlined" onClick={() => setRandomTies(v => !v)}
                                sx={{ borderColor: '#67e8f9', color: '#67e8f9', '&:hover': { borderColor: '#22d3ee', color: '#22d3ee' } }}>
                                {randomTies ? 'Random Tie-Breaks: ON' : 'Random Tie-Breaks: OFF'}
                            </Button>
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <div className="flex flex-col gap-3">
                            <Button variant="outlined" startIcon={<ShuffleRoundedIcon />} onClick={randomize} fullWidth
                                sx={{ borderColor: '#67e8f9', color: '#67e8f9', '&:hover': { borderColor: '#22d3ee', color: '#22d3ee' } }}>
                                New Grid
                            </Button>
                            <ButtonGroup variant="contained" fullWidth>
                                {!running ? (
                                    <Button onClick={run} startIcon={<PlayArrowRoundedIcon />} sx={{ backgroundColor: '#059669', '&:hover': { backgroundColor: '#047857' } }}>Run</Button>
                                ) : (
                                    <Button onClick={pause} startIcon={<PauseRoundedIcon />} sx={{ backgroundColor: '#dc2626', '&:hover': { backgroundColor: '#b91c1c' } }}>Pause</Button>
                                )}
                                <Button onClick={applyOneStep} startIcon={<SkipNextRoundedIcon />} sx={{ backgroundColor: '#7c3aed', '&:hover': { backgroundColor: '#6d28d9' } }}>Step</Button>
                                <Button onClick={reset} startIcon={<RestartAltRoundedIcon />} sx={{ backgroundColor: '#374151', '&:hover': { backgroundColor: '#1f2937' } }}>Reset</Button>
                            </ButtonGroup>
                        </div>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    )
}
