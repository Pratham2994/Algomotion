import { Button, Card, CardContent, CardHeader, Typography, Box } from '@mui/material'
import TimelineIcon from '@mui/icons-material/Timeline'
import RouteIcon from '@mui/icons-material/Route'
import ScienceIcon from '@mui/icons-material/Science'
import QueryStatsIcon from '@mui/icons-material/QueryStats'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function Home() {
    return (
        <div className="space-y-10">
            {/* Hero */}
            <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}  // same lift as cards
                transition={{ duration: 0.35 }}
                className="rounded-2xl border border-slate-800 bg-[#0d1422]/60 p-6 md:p-8 
                   transition-all duration-200 hover:border-cyan-300/40 
                   hover:shadow-[0_8px_28px_rgba(2,132,199,.15)]"
            >
                <div className="flex flex-col gap-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                            Algorithm Visualization Suite
                        </h1>
                        <p className="text-slate-400 mt-3">
                            Interactive, step-by-step visuals for <span className="text-slate-200">Sorting</span> and <span className="text-slate-200">Pathfinding</span> algorithms, plus a hands-on <span className="text-slate-200">Complexity Explorer</span>.
                            Features adjustable parameters, real-time animations, and clear metrics to illustrate actual vs. theoretical Big-O performance.
                        </p>
                    </div>
                </div>
            </motion.section>

            {/* Feature cards */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FeatureCard
                    icon={<TimelineIcon />}
                    title="Sorting Arena"
                    subtitle="Visualize and compare sorting algorithms in action"
                    bullets={[
                        'Step-by-step animations for 6 algorithms',
                        'Metrics tracking: comparisons, writes',
                        'Customizable speed, array size, controls'
                    ]}
                    to="/sorting"
                    cta="Open Sorting"

                />
                <FeatureCard
                    icon={<RouteIcon />}
                    title="Pathfinding Arena"
                    subtitle="Test multiple algorithms on dynamic grids"
                    bullets={[
                        'Maze & open-grid modes',
                        'BFS / Dijkstra / A* / DFS',
                        'Adjustable speed with smooth trails'
                    ]}
                    to="/pathfinding"
                    cta="Open Pathfinding"

                />
                <FeatureCard
                    icon={<QueryStatsIcon />}
                    title="Complexity Explorer"
                    subtitle="Benchmark algorithms and compare with theory"
                    bullets={[
                        'Run multiple trials per input size',
                        'Customizable seed for reproducible tests',
                        'Visualize measured times vs Big-O curves'
                    ]}
                    to="/complexity"
                    cta="Open Explorer"

                />
                <FeatureCard
                    icon={<ScienceIcon />}
                    title="Algorithm Library"
                    subtitle="Quick-reference hub for algorithms"
                    bullets={[
                        'Detailed yet concise notes per algorithm',
                        'Big-O tables with best, average, worst cases',
                        'Mini pseudocode and usage examples'
                    ]}
                    to="/library"
                    cta="Open Library"
                />
            </section>
        </div>
    )
}

/** Card with micro-interactions and right-aligned CTA */
function FeatureCard({ icon, title, subtitle, bullets, to, cta }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35 }}
            whileHover={{ y: -2 }}
        >
            <Card
                variant="outlined"
                sx={{
                    borderColor: '#1f2937',
                    background: '#0a1220',
                    transition: 'border-color .2s ease, box-shadow .2s ease, transform .2s ease',
                    '&:hover': {
                        borderColor: 'rgba(103,232,249,.45)',
                        boxShadow: '0 8px 28px rgba(2,132,199,.15)',
                    },
                }}
            >
                <CardHeader
                    avatar={<div className="text-cyan-300">{icon}</div>}
                    title={<Typography variant="h6" className="!font-semibold">{title}</Typography>}
                    subheader={<span className="text-slate-400">{subtitle}</span>}
                />
                <CardContent>
                    <Box className="flex items-center gap-6">
                        <Box className="flex-1">
                            <ul className="list-disc list-inside text-slate-300 space-y-1">
                                {bullets.map((b, i) => <li key={i}>{b}</li>)}
                            </ul>
                        </Box>
                        <Box className="shrink-0">
                            <PrimaryCTA to={to}>{cta}</PrimaryCTA>
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        </motion.div>
    )
}

function PrimaryCTA({ to, children }) {
    return (
        <Button
            component={Link}
            to={to}
            size="medium"
            endIcon={<ChevronRightIcon sx={{ fontSize: 18 }} />}
            sx={{
                borderRadius: 9999,
                px: 2.8,
                py: 1.1,
                textTransform: 'none',
                fontWeight: 700,
                letterSpacing: 0.2,
                color: '#031a1e',
                backgroundImage: 'linear-gradient(180deg, #8ff0ff 0%, #67e8f9 60%, #4ccedd 100%)',
                boxShadow: '0 6px 22px rgba(103,232,249,.28)',
                ':hover': {
                    boxShadow: '0 10px 28px rgba(103,232,249,.38)',
                    filter: 'brightness(1.04)',
                    transform: 'translateY(-1px)',
                },
                ':active': {
                    transform: 'translateY(0)',
                    filter: 'brightness(0.98)',
                },
            }}
        >
            {children}
        </Button>
    )
}
