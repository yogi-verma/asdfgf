import { useEffect, useMemo, useState } from 'react'
import {
  Activity, ArrowRight, Bell, CalendarDays,
  CircleHelp, Clock3, Cloud, Download, ExternalLink, Gauge,
  LayoutDashboard, Menu, MoreHorizontal, RefreshCw, Search, Settings2,
  ShieldCheck, Wind, Zap,
} from 'lucide-react'
import {
  Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis,
} from 'recharts'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function Logo() {
  return <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-400 text-slate-950"><Wind size={20} strokeWidth={2.5} /></div><div><p className="text-[15px] font-semibold tracking-tight text-white">gridbricks</p><p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">energy intelligence</p></div></div>
}

function NavItem({ icon: Icon, label, active, onClick }) {
  return <button onClick={onClick} className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] transition ${active ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'}`}><Icon size={17} className={active ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'} /><span className="flex-1">{label}</span>{active && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}</button>
}

function MetricCard({ icon: Icon, label, value, unit, note, accent = 'emerald' }) {
  return <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.025)]">
    <div className="flex items-start justify-between"><div className="flex items-center gap-2 text-[12px] font-medium text-slate-500"><span className={`grid h-8 w-8 place-items-center rounded-lg ${accent === 'blue' ? 'bg-sky-50 text-sky-600' : 'bg-emerald-50 text-emerald-700'}`}><Icon size={16} /></span>{label}</div><MoreHorizontal size={17} className="text-slate-300" /></div>
    <div className="mt-5 flex items-baseline gap-1.5"><span className="text-[28px] font-semibold tracking-[-0.04em] text-slate-900">{value}</span><span className="text-xs font-medium text-slate-400">{unit}</span></div>
    <p className="mt-2 text-[11px] text-slate-400">{note}</p>
  </div>
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-xl"><p className="mb-1 text-[10px] font-medium text-slate-400">{label} UTC</p>{payload.map(item => <p key={item.dataKey} className="text-[11px] font-semibold text-slate-700">{item.name === 'forecast' ? 'Forecast' : 'Actual'} <span className="ml-1 font-medium text-slate-500">{Number(item.value).toLocaleString('en-GB', { maximumFractionDigits: 0 })} MW</span></p>)}</div>
}

function numberOrNull(value) {
  return value === null || value === undefined ? null : Number(value)
}

function formatMW(value) {
  return value === null || !Number.isFinite(value) ? '—' : Math.round(value).toLocaleString('en-GB')
}

function buildHourlyComparison(actualRows, forecastRows) {
  const actualByHour = new Map()
  for (const row of actualRows) {
    const generation = numberOrNull(row.generation)
    if (generation === null) continue
    const hour = new Date(row.startTime).toISOString().slice(0, 13) + ':00:00Z'
    const bucket = actualByHour.get(hour) || []
    bucket.push(generation)
    actualByHour.set(hour, bucket)
  }

  return forecastRows.map(row => {
    const timestamp = new Date(row.startTime)
    const key = timestamp.toISOString().slice(0, 13) + ':00:00Z'
    const hour = actualByHour.get(key) || []
    const actual = hour.length ? hour.reduce((sum, value) => sum + value, 0) / hour.length : null
    const forecast = numberOrNull(row.generation)
    return {
      key,
      time: timestamp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }),
      forecast,
      actual,
      difference: forecast !== null && actual !== null ? forecast - actual : null,
      absoluteError: forecast !== null && actual !== null ? Math.abs(forecast - actual) : null,
      absolutePercentageError: forecast !== null && actual !== null && actual !== 0 ? Math.abs((forecast - actual) / actual) * 100 : null,
    }
  })
}

function downloadComparisonCsv(rows, deliveryDate) {
  const content = [
    'deliveryDate,timeUtc,forecastMw,actualHourlyMeanMw,differenceMw,absoluteErrorMw,absolutePercentageError',
    ...rows.map(row => [deliveryDate, row.time, row.forecast ?? '', row.actual ?? '', row.difference ?? '', row.absoluteError ?? '', row.absolutePercentageError ?? ''].join(',')),
  ].join('\n')
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `gridbricks-wind-${deliveryDate}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

async function fetchJson(url, signal) {
  const response = await fetch(url, { signal })
  const payload = await response.json()
  if (!response.ok) throw new Error(payload.detail || `Request failed (${response.status})`)
  return payload
}

function App() {
  const [activeNav, setActiveNav] = useState('Overview')
  const [date, setDate] = useState('2026-01-15')
  const [decisionTime, setDecisionTime] = useState('23:59')
  const [mobileNav, setMobileNav] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [actualRows, setActualRows] = useState([])
  const [forecastRows, setForecastRows] = useState([])
  const [forecastMetadata, setForecastMetadata] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navItems = [
    { label: 'Overview', icon: LayoutDashboard }, { label: 'Wind forecasts', icon: Wind },
    { label: 'Forecast accuracy', icon: Gauge },
  ]
  const pageTitle = activeNav === 'Overview' ? 'Market overview' : activeNav
  const displayDate = useMemo(() => new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }), [date])

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setLoading(true)
      setError('')
      const queryDate = encodeURIComponent(date)
      const queryTime = encodeURIComponent(decisionTime)
      try {
        const [actual, forecast] = await Promise.all([
          fetchJson(`${API_BASE}/api/actual-generation?delivery_date=${queryDate}`, controller.signal),
          fetchJson(`${API_BASE}/api/forecast-generation?delivery_date=${queryDate}&decision_time=${queryTime}`, controller.signal),
        ])
        setActualRows(actual.rows || [])
        setForecastRows(forecast.rows || [])
        setForecastMetadata(forecast)
      } catch (fetchError) {
        if (fetchError.name !== 'AbortError') {
          setError(fetchError.message || 'Could not load Elexon generation data.')
          setActualRows([])
          setForecastRows([])
          setForecastMetadata(null)
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    load()
    return () => controller.abort()
  }, [date, decisionTime, refreshKey])

  const comparison = useMemo(() => buildHourlyComparison(actualRows, forecastRows), [actualRows, forecastRows])
  const matchedRows = useMemo(() => comparison.filter(row => row.actual !== null && row.forecast !== null), [comparison])
  const metrics = useMemo(() => {
    const average = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null
    const forecastAverage = average(comparison.map(row => row.forecast).filter(value => value !== null))
    const actualAverage = average(matchedRows.map(row => row.actual))
    const mae = average(matchedRows.map(row => row.absoluteError))
    const mape = average(matchedRows.map(row => row.absolutePercentageError).filter(value => value !== null))
    const bias = average(matchedRows.map(row => row.difference))
    const categories = [0, 0, 0, 0]
    matchedRows.forEach(row => {
      if (row.absolutePercentageError === null) return
      if (row.absolutePercentageError < 2) categories[0] += 1
      else if (row.absolutePercentageError < 5) categories[1] += 1
      else if (row.absolutePercentageError < 10) categories[2] += 1
      else categories[3] += 1
    })
    return { forecastAverage, actualAverage, mae, mape, bias, categories }
  }, [comparison, matchedRows])

  const latestPublishTime = forecastMetadata?.latestPublishTime
    ? new Date(forecastMetadata.latestPublishTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
    : '—'
  const distribution = [
    { label: 'Under 2% error', color: 'bg-emerald-500' }, { label: '2–5% error', color: 'bg-sky-500' },
    { label: '5–10% error', color: 'bg-amber-400' }, { label: 'Over 10% error', color: 'bg-rose-400' },
  ].map((item, index) => ({ ...item, value: matchedRows.length ? Math.round(metrics.categories[index] / matchedRows.length * 100) : 0 }))

  return <div className="min-h-screen bg-[#f5f7f8] text-slate-900 antialiased">
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col bg-[#111c2e] px-4 py-5 transition-transform lg:translate-x-0 ${mobileNav ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between px-2"><Logo /><button onClick={() => setMobileNav(false)} className="rounded-lg p-2 text-slate-400 lg:hidden" aria-label="Close menu">×</button></div>
      <div className="mt-9 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">Workspace</div>
      <nav className="mt-3 space-y-1">{navItems.map(item => <NavItem key={item.label} {...item} active={activeNav === item.label} onClick={() => { setActiveNav(item.label); setMobileNav(false) }} />)}</nav>
      <div className="mt-9 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">Data</div>
      <div className="mt-3 space-y-1"><NavItem icon={Activity} label="Elexon BMRS" active={activeNav === 'Elexon BMRS'} onClick={() => setActiveNav('Elexon BMRS')} /><NavItem icon={ShieldCheck} label="Data quality" active={activeNav === 'Data quality'} onClick={() => setActiveNav('Data quality')} /></div>
      <div className="mt-auto">
        <div className="mb-5 rounded-xl border border-slate-700/70 bg-slate-800/60 p-3.5"><div className="flex items-center gap-2 text-xs font-medium text-slate-200"><span className={`h-2 w-2 rounded-full ${loading ? 'animate-pulse bg-amber-400' : error ? 'bg-rose-400' : 'bg-emerald-400'}`} />{loading ? 'Connecting to Elexon' : error ? 'Data connection issue' : 'Elexon connected'}</div><p className="mt-2 text-[11px] leading-relaxed text-slate-400">National wind generation · FUELHH + WINDFOR</p></div>
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] text-slate-400 hover:bg-slate-800/60 hover:text-white"><Settings2 size={17} className="text-slate-500" />Settings</button>
        <div className="mt-3 flex items-center gap-3 border-t border-slate-700/70 px-2 pt-4"><div className="grid h-8 w-8 place-items-center rounded-full bg-slate-700 text-[11px] font-semibold text-slate-100">GB</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-white">GridBricks workspace</p><p className="mt-0.5 text-[10px] text-slate-500">UK power desk</p></div><MoreHorizontal size={17} className="text-slate-500" /></div>
      </div>
    </aside>
    {mobileNav && <button onClick={() => setMobileNav(false)} aria-label="Close navigation overlay" className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden" />}
    <main className="min-h-screen lg:pl-[248px]">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl"><div className="mx-auto flex h-[66px] max-w-[1480px] items-center justify-between px-4 sm:px-7 xl:px-10"><div className="flex items-center gap-3"><button onClick={() => setMobileNav(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open menu"><Menu size={19} /></button><div className="hidden h-5 w-px bg-slate-200 sm:block" /><p className="text-xs text-slate-400">GridBricks <span className="mx-1.5">/</span><span className="font-medium text-slate-700">{pageTitle}</span></p></div><div className="flex items-center gap-2"><div className={`hidden items-center gap-2 rounded-lg border px-3 py-2 text-[11px] md:flex ${error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-100 bg-emerald-50 text-emerald-700'}`}><span className={`h-1.5 w-1.5 rounded-full ${error ? 'bg-rose-500' : 'bg-emerald-500'}`} />{error ? 'Connection issue' : 'Elexon BMRS'}</div><button aria-label="Search" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Search size={17} /></button><button aria-label="Notifications" className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Bell size={17} /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-white" /></button><div className="ml-1 grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white text-[10px] font-bold text-slate-600">GB</div></div></div></header>
      <div className="mx-auto max-w-[1480px] px-4 py-7 sm:px-7 sm:py-9 xl:px-10">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.13em] text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />UK day-ahead · Wind</div><h1 className="text-[27px] font-semibold tracking-[-0.04em] text-slate-900 sm:text-[32px]">{pageTitle}</h1><p className="mt-1.5 text-[13px] text-slate-500">Wind generation outlook and forecast performance for the GB system.</p></div><div className="flex flex-wrap items-end gap-2"><label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 shadow-sm"><CalendarDays size={15} className="text-slate-400" /><input aria-label="Delivery date" type="date" min="2026-01-01" max="2026-01-31" value={date} onChange={event => setDate(event.target.value)} className="w-[125px] bg-transparent text-xs outline-none" /></label><label className="flex h-10 flex-col justify-center gap-0.5 rounded-lg border border-slate-200 bg-white px-3 shadow-sm"><span className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">Decision cutoff · UTC</span><input aria-label="Forecast decision cutoff in UTC" type="time" value={decisionTime} onChange={event => setDecisionTime(event.target.value)} className="w-[82px] bg-transparent text-xs font-medium text-slate-600 outline-none" /></label><button onClick={() => setRefreshKey(value => value + 1)} className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"><RefreshCw size={14} className={loading ? 'animate-spin text-slate-400' : 'text-slate-400'} />Refresh</button><button onClick={() => downloadComparisonCsv(comparison, date)} disabled={!comparison.length} className="flex h-10 items-center gap-2 rounded-lg bg-[#14243a] px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#203954] disabled:cursor-not-allowed disabled:opacity-40"><Download size={14} />Export</button></div></div>
        <div className={`mt-6 flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${error ? 'border-rose-200 bg-rose-50/70' : 'border-sky-200/80 bg-sky-50/70'}`}><div className="flex items-start gap-2.5"><div className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${error ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'}`}>{error ? <CircleHelp size={13} /> : <Clock3 size={13} />}</div><p className={`text-[11px] leading-relaxed ${error ? 'text-rose-900' : 'text-sky-900'}`}>{error ? <><span className="font-semibold">Could not load Elexon data.</span> {error} Check that the FastAPI backend is running at {API_BASE}.</> : <><span className="font-semibold">Forecast selection.</span> Showing the latest forecast published on the day before delivery, at or before {decisionTime} UTC. Actuals are from FUELHH; the UI averages its two half-hourly values to compare with each hourly WINDFOR point.</>}</p></div><a href="https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream" target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1.5 pl-7 text-[11px] font-semibold text-sky-800 hover:text-sky-950 sm:pl-0">Elexon source <ExternalLink size={12} /></a></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard icon={Wind} label="Avg. forecast output" value={formatMW(metrics.forecastAverage)} unit="MW" note="Hourly WINDFOR points · selected day" /><MetricCard icon={Zap} label="Avg. actual output" value={formatMW(metrics.actualAverage)} unit="MW" note="Mean of matched hourly actuals" accent="blue" /><MetricCard icon={Gauge} label="Mean absolute error" value={formatMW(metrics.mae)} unit="MW" note={`${matchedRows.length} matched hourly periods`} /><MetricCard icon={Clock3} label="Latest publish time" value={latestPublishTime} unit="UTC" note={forecastMetadata?.decisionCutoff ? `Cutoff ${decisionTime} · previous day` : 'No forecast published by cutoff'} accent="blue" /></div>
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.75fr)_minmax(290px,0.85fr)]">
          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.025)]"><div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-start sm:px-6"><div><div className="flex items-center gap-2"><h2 className="text-[14px] font-semibold text-slate-800">Wind generation profile</h2><span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">MW</span></div><p className="mt-1 text-[11px] text-slate-400">Forecast compared with actual generation · {displayDate}</p></div><div className="flex items-center gap-1.5 text-[10px] text-slate-400"><Clock3 size={12} />Latest publish · {latestPublishTime} UTC</div></div>
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4 sm:px-6"><div className="flex gap-4 text-[10px] font-medium text-slate-500"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" />Forecast</span><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-sky-500" />Actual hourly mean</span></div>{loading && <span className="text-[10px] text-slate-400">Loading Elexon data…</span>}</div>
            <div className="h-[270px] w-full px-2 pb-3 pt-3 sm:h-[310px] sm:px-4">{comparison.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={comparison} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}><defs><linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.15} /><stop offset="95%" stopColor="#10b981" stopOpacity={0.01} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#edf1f3" strokeDasharray="3 5" /><XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={10} interval={3} /><Tooltip content={<ChartTooltip />} /><Area type="monotone" dataKey="forecast" name="forecast" stroke="#10a879" strokeWidth={2.5} fill="url(#forecastFill)" activeDot={{ r: 4, strokeWidth: 0 }} /><Line type="monotone" dataKey="actual" name="actual" stroke="#3996d4" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} connectNulls={false} /></AreaChart></ResponsiveContainer> : <div className="grid h-full place-items-center px-6 text-center text-xs text-slate-400">{loading ? 'Loading generation data…' : error ? 'Resolve the data connection to view this chart.' : 'No forecast points are available for this date and cutoff.'}</div>}</div>
            <div className="mx-5 mb-5 flex flex-col gap-2 rounded-xl bg-[#f7faf9] px-4 py-3 sm:mx-6 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2 text-[11px] text-slate-600"><span className="grid h-6 w-6 place-items-center rounded-md bg-emerald-100 text-emerald-700"><Activity size={13} /></span><span className="font-semibold text-slate-800">{metrics.mae === null ? 'Accuracy will appear when actuals and forecasts overlap.' : `MAE ${formatMW(metrics.mae)} MW across ${matchedRows.length} hourly periods`}</span></div><button onClick={() => setActiveNav('Forecast accuracy')} className="flex items-center gap-1 text-left text-[10px] font-semibold text-emerald-700 hover:text-emerald-900">Explore accuracy <ArrowRight size={12} /></button></div>
          </section>
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.025)] sm:p-6"><div className="flex items-start justify-between"><div><h2 className="text-[14px] font-semibold text-slate-800">Forecast accuracy</h2><p className="mt-1 text-[11px] text-slate-400">Absolute percentage error · selected day</p></div><MoreHorizontal size={17} className="text-slate-300" /></div>
            <div className="mt-6 flex items-end justify-between"><div><p className="text-[30px] font-semibold tracking-[-0.04em] text-slate-900">{metrics.mape === null ? '—' : metrics.mape.toFixed(1)}<span className="ml-1 text-base font-medium text-slate-400">%</span></p><p className="mt-1 text-[10px] text-slate-400">Mean absolute percentage error</p></div><span className="mb-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">{matchedRows.length ? `${matchedRows.length} periods` : 'No matched data'}</span></div>
            <div className="mt-7 space-y-2.5">{distribution.map(row => <div key={row.label} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"><span className="flex items-center gap-2 text-[10px] text-slate-500"><span className={`h-2 w-2 rounded-full ${row.color}`} />{row.label}</span><span className="text-[10px] font-semibold tabular-nums text-slate-700">{row.value}%</span></div>)}</div>
            <div className="mt-7 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5"><div><p className="text-[10px] text-slate-400">Forecast bias</p><p className="mt-1 text-sm font-semibold text-slate-800">{metrics.bias === null ? '—' : `${metrics.bias > 0 ? '+' : ''}${formatMW(metrics.bias)}`} <span className="text-[10px] font-medium text-slate-400">MW</span></p></div><div><p className="text-[10px] text-slate-400">Data coverage</p><p className="mt-1 text-sm font-semibold text-slate-800">{comparison.length ? `${(matchedRows.length / comparison.length * 100).toFixed(0)}` : '—'}<span className="text-[10px] font-medium text-slate-400">%</span></p></div></div>
          </section>
        </div>
        <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.025)]"><div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:px-6"><div><div className="flex items-center gap-2"><h2 className="text-[14px] font-semibold text-slate-800">Hourly comparison</h2><span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">60 min</span></div><p className="mt-1 text-[11px] text-slate-400">WINDFOR is hourly; actuals show the mean of the two matching FUELHH half-hours.</p></div><button onClick={() => downloadComparisonCsv(comparison, date)} disabled={!comparison.length} className="flex h-8 items-center gap-1.5 self-start rounded-lg border border-slate-200 px-2.5 text-[10px] font-medium text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:self-auto"><Download size={13} />Export CSV</button></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left"><thead><tr className="bg-slate-50/80 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400"><th className="px-6 py-3">Delivery time</th><th className="px-4 py-3">Wind forecast</th><th className="px-4 py-3">Actual hourly mean</th><th className="px-4 py-3">Forecast error</th><th className="px-4 py-3">Absolute error</th><th className="px-6 py-3 text-right">MAPE</th></tr></thead><tbody>{comparison.slice(0, 8).map(row => <tr key={row.key} className="border-t border-slate-100 text-[11px] hover:bg-slate-50/60"><td className="px-6 py-3.5 font-semibold text-slate-700">{row.time} <span className="ml-1 font-normal text-slate-400">UTC</span></td><td className="px-4 py-3.5 tabular-nums text-slate-600">{formatMW(row.forecast)} <span className="text-[10px] text-slate-400">MW</span></td><td className="px-4 py-3.5 tabular-nums text-slate-600">{formatMW(row.actual)} <span className="text-[10px] text-slate-400">MW</span></td><td className={`px-4 py-3.5 tabular-nums font-medium ${row.difference === null ? 'text-slate-400' : row.difference > 0 ? 'text-amber-700' : 'text-sky-700'}`}>{row.difference === null ? '—' : `${row.difference > 0 ? '+' : ''}${formatMW(row.difference)} MW`}</td><td className="px-4 py-3.5 tabular-nums text-slate-600">{row.absoluteError === null ? '—' : `${formatMW(row.absoluteError)} MW`}</td><td className="px-6 py-3.5 text-right tabular-nums text-slate-600">{row.absolutePercentageError === null ? '—' : `${row.absolutePercentageError.toFixed(1)}%`}</td></tr>)}</tbody></table></div>
          <div className="flex flex-col gap-2 border-t border-slate-100 px-5 py-3.5 text-[10px] text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6"><span>{loading ? 'Loading…' : `Showing ${Math.min(comparison.length, 8)} of ${comparison.length} hourly periods`} · {displayDate}</span><div className="flex items-center gap-3"><span>Actuals from FUELHH</span><span className="h-3 w-px bg-slate-200" /><span>Forecasts from WINDFOR</span></div></div>
        </section>
        <footer className="flex flex-col gap-2 py-6 text-[10px] text-slate-400 sm:flex-row sm:items-center sm:justify-between"><span>GridBricks · Energy decisions, made clearer.</span><span className="flex items-center gap-1.5"><Cloud size={12} />Sources: Elexon BMRS · Data timestamps shown in UTC</span></footer>
      </div>
    </main>
  </div>
}

export default App
