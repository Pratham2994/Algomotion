import { Card, CardContent, Tabs, Tab, TextField, Stack } from '@mui/material'
import DataArrayRoundedIcon from '@mui/icons-material/DataArrayRounded'
import RouteRoundedIcon from '@mui/icons-material/RouteRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'

export default function LibraryTopControls({ tab, setTab, search, setSearch }){
  return (
    <Card variant="outlined" sx={{ borderColor:'#1f2937', background:'#0a1220' }}>
      <CardContent>
        <Stack direction={{ xs:'column', md:'row' }} spacing={2} alignItems={{ md:'center' }} justifyContent="space-between">
          <Tabs value={tab} onChange={(_,v)=>setTab(v)} textColor="inherit"
            sx={{
              '& .MuiTab-root': { color:'#94a3b8', textTransform:'none', fontWeight:600 },
              '& .Mui-selected': { color:'#e2e8f0' },
              '& .MuiTabs-indicator': { backgroundColor:'#67e8f9' }
            }}>
            <Tab label="All" />
            <Tab icon={<DataArrayRoundedIcon sx={{ mr:1 }} />} iconPosition="start" label="Sorting" />
            <Tab icon={<RouteRoundedIcon sx={{ mr:1 }} />} iconPosition="start" label="Pathfinding" />
          </Tabs>

          <TextField
            size="small"
            placeholder="Search algorithms, uses…"
            value={search}
            onChange={e=>setSearch(e.target.value)}
            InputProps={{ startAdornment: <SearchRoundedIcon className="mr-2 text-slate-400" /> }}
            sx={{
              minWidth: 280,
              '& .MuiOutlinedInput-root': { color:'#e2e8f0' },
              '& fieldset': { borderColor:'#334155' }
            }}
          />
        </Stack>
      </CardContent>
    </Card>
  )
}
