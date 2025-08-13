import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Card, CardHeader, CardContent, Typography, TextField, MenuItem, Button,
  Box, Stack, Chip, CircularProgress, Tooltip, IconButton, Divider,
  Snackbar, Alert, Collapse, LinearProgress
} from '@mui/material'
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded'
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded'
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'
import CodeRoundedIcon from '@mui/icons-material/CodeRounded'
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded'
import StopRoundedIcon from '@mui/icons-material/StopRounded'
import { motion, AnimatePresence } from 'framer-motion'

const LANGS = [
  'Auto-detect','JavaScript','TypeScript','Python','C++','Java','Go','Rust','C','Kotlin','Swift','PHP'
]

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } }
}
const listStagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}
const item = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } }
}

export default function AIComplexity() {
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('Auto-detect')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [errDetail, setErrDetail] = useState('')
  const [res, setRes] = useState(null)
  const [showJson, setShowJson] = useState(false)
  const [warning, setWarning] = useState('')
  const [snack, setSnack] = useState('')
  const [showErrDetail, setShowErrDetail] = useState(false)

  const abortRef = useRef(null)

  const canRun = code.trim().length > 3
  const charCount = code.length
  const tooShort = charCount > 0 && charCount < 4

  useEffect(() => {
    return () => { if (abortRef.current) abortRef.current.abort() }
  }, [])

  const headerSub = useMemo(() => (
    <span className="text-slate-400">
      Paste code → get Big-O, properties, bottlenecks, and a short summary.
    </span>
  ), [])

  async function analyze() {
    setErr(''); setErrDetail(''); setShowErrDetail(false); setRes(null); setWarning(''); setSnack('')
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    try {
      const r = await fetch('/api/complexity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language: language === 'Auto-detect' ? '' : language }),
        signal: controller.signal
      })

      let data = null
      try { data = await r.json() } catch { }

      if (!r.ok || !data?.ok) {
        const msg = (data?.error || data?.warning || r.statusText || 'Request failed')
        const details = typeof data?.details === 'string'
          ? data.details
          : (data?.details ? JSON.stringify(data.details, null, 2) : '')
        setErr(msg)
        setErrDetail(details)
        throw new Error(msg)
      }

      setRes(data.result || null)
      if (data.warning) setWarning(String(data.warning))
      setSnack('Analysis complete')

      if (window.gtag) window.gtag('event', 'ai_complexity_run', { model: 'gemini' })
    } catch (e) {
      if (e.name === 'AbortError') return
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }

  function cancelInFlight() {
    if (abortRef.current) abortRef.current.abort()
  }

  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text) } catch {}
    setSnack('Copied to clipboard')
  }

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        <Card variant="outlined" sx={{ borderColor: '#1f2937', background: '#0a1220', overflow: 'hidden' }}>
          {loading && <LinearProgress sx={{ bgcolor: '#0a1220', '& .MuiLinearProgress-bar': { bgcolor: '#06b6d4' } }} />}

          <CardHeader
            avatar={<SmartToyRoundedIcon sx={{ color: '#67e8f9' }} />}
            title={<Typography variant="h6" className="!font-semibold">AI Complexity</Typography>}
            subheader={headerSub}
          />

          <CardContent>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} className="mb-3">
              <TextField
                select
                size="small"
                label="Language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                sx={{
                  minWidth: { xs: '100%', md: 240 },
                  '& .MuiOutlinedInput-root': { color: '#e2e8f0' },
                  '& label': { color: '#94a3b8' },
                  '& fieldset': { borderColor: '#334155' },
                  '& .MuiSelect-icon': { color: '#94a3b8' }
                }}
              >
                {LANGS.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
              </TextField>

              <Box flex={1} />

              <Stack direction="row" spacing={1}>
                {!loading ? (
                  <>
                    <Button
                      variant="outlined"
                      onClick={() => { setCode(''); setRes(null); setErr(''); setErrDetail(''); setWarning(''); setShowJson(false); setShowErrDetail(false); }}
                      startIcon={<RestartAltRoundedIcon />}
                      sx={{ borderColor: '#94a3b8', color: '#cbd5e1', '&:hover': { borderColor: '#cbd5e1' } }}
                    >
                      Clear
                    </Button>
                    <Button
                      variant="contained"
                      disabled={!canRun || loading}
                      onClick={analyze}
                      sx={{ backgroundColor: '#06b6d4', '&:hover': { backgroundColor: '#0891b2' }, fontWeight: 800 }}
                    >
                      Analyze
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outlined"
                    onClick={cancelInFlight}
                    startIcon={<StopRoundedIcon />}
                    sx={{ borderColor: '#fda4af', color: '#fecaca', '&:hover': { borderColor: '#fecaca', background: 'rgba(248,113,113,.06)' } }}
                  >
                    Cancel
                  </Button>
                )}
              </Stack>
            </Stack>

            <TextField
              multiline minRows={12} maxRows={28} fullWidth
              placeholder="// Paste your function or algorithm here"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              helperText={
                <span className={`text-xs ${tooShort ? 'text-rose-300' : 'text-slate-400'}`}>
                  {charCount} characters {tooShort ? '— need at least 4 to analyze' : ''}
                </span>
              }
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#e2e8f0',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
                },
                '& textarea': { lineHeight: 1.38, fontSize: 14 },
                '& fieldset': { borderColor: '#334155' },
                '& .MuiFormHelperText-root': { marginLeft: 0 }
              }}
            />

            <AnimatePresence initial={false}>
              {err && (
                <motion.div variants={fadeUp} initial="hidden" animate="show" exit={{ opacity: 0, y: -6 }} className="mt-3">
                  <Alert
                    severity="error"
                    variant="outlined"
                    sx={{
                      borderColor: 'rgba(244,63,94,.35)',
                      bgcolor: 'rgba(136,19,55,.18)',
                      color: '#fecaca'
                    }}
                    action={
                      errDetail
                        ? (
                          <Tooltip title="Show details">
                            <IconButton size="small" onClick={() => setShowErrDetail(s => !s)} sx={{ color: '#fecaca' }}>
                              <HelpOutlineRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )
                        : null
                    }
                  >
                    {err}
                  </Alert>
                  <Collapse in={showErrDetail} timeout="auto">
                    <Box className="mt-2 rounded-lg border border-rose-800/40 bg-rose-900/15 p-3 text-rose-200 text-xs overflow-auto">
                      <pre className="whitespace-pre-wrap">{errDetail}</pre>
                    </Box>
                  </Collapse>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence initial={false}>
              {warning && !err && (
                <motion.div variants={fadeUp} initial="hidden" animate="show" exit={{ opacity: 0, y: -6 }} className="mt-3">
                  <Alert
                    severity="warning"
                    variant="outlined"
                    sx={{
                      borderColor: 'rgba(234,179,8,.35)',
                      bgcolor: 'rgba(202,138,4,.15)',
                      color: '#fde68a'
                    }}
                  >
                    {warning}
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {res && !err && (
                <motion.div
                  key="result"
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, y: -8 }}
                  className="mt-4 grid gap-6"
                >
                  <Card variant="outlined" sx={{ borderColor: '#1f2937', background: '#0b1322' }}>
                    <CardContent>
                      <motion.div variants={listStagger} initial="hidden" animate="show">
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" className="mb-3">
                          {res.algorithmName && (
                            <motion.div variants={item}>
                              <Chip size="small" className="!bg-slate-800 !text-slate-200 !border !border-slate-600" label={res.algorithmName} />
                            </motion.div>
                          )}
                          {res.category && (
                            <motion.div variants={item}>
                              <Chip size="small" className="!bg-slate-800 !text-slate-200 !border !border-slate-600" label={res.category} />
                            </motion.div>
                          )}
                          {res.paradigm && (
                            <motion.div variants={item}>
                              <Chip size="small" className="!bg-slate-800 !text-slate-200 !border !border-slate-600" label={res.paradigm} />
                            </motion.div>
                          )}
                          {typeof res.stable === 'boolean' && (
                            <motion.div variants={item}>
                              <Chip size="small" className="!bg-slate-800 !text-emerald-300 !border !border-slate-600" label={`Stable: ${res.stable ? 'yes' : 'no'}`} />
                            </motion.div>
                          )}
                          {typeof res.inPlace === 'boolean' && (
                            <motion.div variants={item}>
                              <Chip size="small" className="!bg-slate-800 !text-sky-300 !border !border-slate-600" label={`In-place: ${res.inPlace ? 'yes' : 'no'}`} />
                            </motion.div>
                          )}
                        </Stack>
                      </motion.div>

                      <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <motion.div variants={fadeUp} initial="hidden" animate="show">
                          <div className="text-slate-300 font-medium mb-2">Time Complexity</div>
                          <div className="rounded-lg border border-slate-700 bg-slate-900 p-3 text-slate-200 text-sm">
                            <div>Best: {res?.timeComplexity?.bestCase || '—'}</div>
                            <div>Average: {res?.timeComplexity?.averageCase || '—'}</div>
                            <div>Worst: {res?.timeComplexity?.worstCase || '—'}</div>
                          </div>
                        </motion.div>

                        <motion.div variants={fadeUp} initial="hidden" animate="show">
                          <div className="text-slate-300 font-medium mb-2">Space</div>
                          <div className="rounded-lg border border-slate-700 bg-slate-900 p-3 text-slate-200 text-sm">
                            <div>Space: {res?.spaceComplexity || '—'}</div>
                            {Array.isArray(res?.primaryDataStructures) && res.primaryDataStructures.length > 0 && (
                              <div className="mt-2">
                                <div className="text-slate-400 text-xs mb-1">Primary structures</div>
                                <div className="flex gap-1.5 flex-wrap">
                                  {res.primaryDataStructures.map((d, i) => (
                                    <Chip key={i} size="small" className="!bg-slate-800 !text-slate-200 !border !border-slate-600" label={d} />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </Box>

                      <Box className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <KeyList title="Bottlenecks" items={res?.bottlenecks} />
                        <KeyList title="Assumptions" items={res?.assumptions} />
                        <KeyList title="Optimizations" items={res?.possibleOptimizations} />
                        <KeyList title="Common Use Cases" items={res?.commonUseCases} />
                      </Box>

                      <Divider sx={{ my: 4, borderColor: '#334155' }} />
                      <motion.div variants={fadeUp} initial="hidden" animate="show">
                        <Box
                          sx={{
                            mt: 2.5,                         
                            p: { xs: 2, sm: 3 },
                            borderRadius: 2,
                            bgcolor: 'rgba(148,163,184,0.06)',
                            border: '1px solid',
                            borderColor: 'rgba(51,65,85,0.8)',
                            mb: 1.5
                          }}
                        >
                          <Typography variant="body2" className="text-slate-300 whitespace-pre-wrap">
                            {res.summary || 'No summary returned.'}
                          </Typography>
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{ color: '#94a3b8', fontStyle: 'italic', display: 'block', mt: 0.5 }}
                        >
                          Note: LLM-generated analysis may not always be accurate. Please verify results.
                        </Typography>
                      </motion.div>

                      {/* Pseudocode */}
                      {res.pseudocode && (
                        <>
                          <Divider sx={{ my: 3, borderColor: '#334155' }} />
                          <div className="text-slate-300 font-medium mb-2">Pseudocode</div>
                          <motion.div variants={fadeUp} initial="hidden" animate="show" className="rounded-lg border border-slate-700 bg-slate-900 overflow-auto">
                            <pre className="text-slate-200 text-sm p-3 min-w-[280px]">{res.pseudocode}</pre>
                          </motion.div>
                        </>
                      )}

                      {/* Footer actions */}
                      <Box className="mt-3 flex items-center gap-2">
                        <Tooltip title="Copy summary">
                          <IconButton
                            size="small"
                            onClick={() => copy(res.summary || '')}
                            sx={{ color: '#e2e8f0', '&:hover': { color: '#67e8f9', background: 'rgba(103,232,249,.08)' } }}
                          >
                            <ContentCopyRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title={showJson ? 'Hide JSON' : 'Show JSON'}>
                          <IconButton
                            size="small"
                            onClick={() => setShowJson(v => !v)}
                            sx={{ color: '#e2e8f0', '&:hover': { color: '#67e8f9', background: 'rgba(103,232,249,.08)' } }}
                          >
                            <CodeRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>

                      <AnimatePresence initial={false}>
                        {showJson && (
                          <motion.div
                            key="json"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 rounded-lg border border-slate-700 bg-slate-900 overflow-hidden"
                          >
                            <Box className="p-2 flex justify-end">
                              <Button size="small" variant="text" onClick={() => copy(JSON.stringify(res, null, 2))} sx={{ color: '#67e8f9' }}>
                                Copy JSON
                              </Button>
                            </Box>
                            <pre className="text-slate-200 text-xs px-3 pb-3">{JSON.stringify(res, null, 2)}</pre>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>

      <Snackbar
        open={!!snack}
        autoHideDuration={2200}
        onClose={() => setSnack('')}
        message={snack}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  )
}

function KeyList({ title, items }) {
  if (!Array.isArray(items) || items.length === 0) {
    return (
      <Box>
        <div className="text-slate-300 font-medium mb-2">{title}</div>
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-3 text-slate-500 text-sm">—</div>
      </Box>
    )
  }
  return (
    <Box>
      <div className="text-slate-300 font-medium mb-2">{title}</div>
      <motion.ul
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }}
        initial="hidden"
        animate="show"
        className="rounded-lg border border-slate-700 bg-slate-900 p-3 text-slate-200 text-sm list-disc list-inside space-y-1"
      >
        {items.map((x, i) => (
          <motion.li key={i} variants={{ hidden: { opacity: 0, x: -6 }, show: { opacity: 1, x: 0, transition: { duration: 0.18 } } }}>
            {x}
          </motion.li>
        ))}
      </motion.ul>
    </Box>
  )
}
