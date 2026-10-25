import { useState } from 'react'
import { Activity, CalendarRange, Play, TrendingDown } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const MIN_DATE = '2026-01-01'
const MAX_DATE = '2026-01-31'

function dayList(from, to) {
  const days = []
  const cursor = new Date(`${from}T00:00:00Z`)
  const end = new Date(`${to}T00:00:00Z`)
  while (cursor <= end && days.length < 31) {
    days.push(cursor.toISOString().slice(0, 10))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return days
}

async function json(url) {
  const response = await fetch(url)
  const result = await response.json()
  if (!response.ok) throw new Error(result.detail || `Request failed (${response.status})`)
  return result
}

function mean(values) { return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null }

function summarize(actual, forecast, date, priorActual, decisionTime) {
  const actualByHour = new Map()
  for (const row of actual) {
    if (row.generation === null || row.generation === undefined) continue
    const value = Number(row.generation)
    if (!Number.isFinite(value)) continue
    const key = new Date(row.startTime).toISOString().slice(0, 13)
    actualByHour.set(key, [...(actualByHour.get(key) || []), value])
  }
  const priorByHour = new Map()
  const priorValues = new Map()
  for (const row of priorActual) {
    if (row.generation === null || row.generation === undefined) continue
    const value = Number(row.generation)
    if (!row.startTime || !Number.isFinite(value)) continue
    const hour = new Date(row.startTime).toISOString().slice(11, 13)
    priorValues.set(hour, [...(priorValues.get(hour) || []), value])
  }
  for (const [hour, values] of priorValues) priorByHour.set(hour, mean(values))
  const selected = new Map()
  for (const row of forecast) {
    const decisionDay = new Date(`${date}T00:00:00Z`); decisionDay.setUTCDate(decisionDay.getUTCDate() - 1)
    if (!row.startTime || !row.publishTime || new Date(row.publishTime) > new Date(`${decisionDay.toISOString().slice(0, 10)}T${decisionTime}:00Z`)) continue
    if (new Date(row.startTime).toISOString().slice(0, 10) !== date) continue
    const key = new Date(row.startTime).toISOString().slice(0, 13)
    const existing = selected.get(key)
    if (!existing || row.publishTime > existing.publishTime) selected.set(key, row)
  }
  const paired = [...selected.entries()].flatMap(([key, row]) => {
    const values = actualByHour.get(key)
    if (row.generation === null || row.generation === undefined) return []
    const f = Number(row.generation)
    if (!values?.length || !Number.isFinite(f)) return []
    const actualMean = mean(values)
    const priorMean = priorByHour.get(key.slice(11, 13))
    return [{ error: Math.abs(f - actualMean), baselineError: priorMean == null ? null : Math.abs(priorMean - actualMean), hour: Number(key.slice(11, 13)), forecast: f, difference: f - actualMean }]
  })
  return { date, mae: mean(paired.map((row) => row.error)), baselineMae: mean(paired.map((row) => row.baselineError).filter(Number.isFinite)), periods: paired.length, conditions: paired }
}

export default function BacktestView({ decisionTime = '23:59' }) {
  const [from, setFrom] = useState('2026-01-01')
  const [to, setTo] = useState('2026-01-07')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function runBacktest() {
    if (from > to) { setError('Start date must be on or before the end date.'); return }
    setLoading(true); setError('')
    try {
      const days = dayList(from, to)
      const data = []
      for (let offset = 0; offset < days.length; offset += 4) {
        const batch = await Promise.all(days.slice(offset, offset + 4).map(async (date) => {
        const actualUrl = new URL(`${API_BASE}/datasets/FUELHH/stream`, window.location.origin)
        actualUrl.searchParams.set('settlementDateFrom', date); actualUrl.searchParams.set('settlementDateTo', date); actualUrl.searchParams.set('fuelType', 'WIND')
        const start = new Date(`${date}T00:00:00Z`); start.setUTCDate(start.getUTCDate() - 2)
        const forecastUrl = new URL(`${API_BASE}/datasets/WINDFOR/stream`, window.location.origin)
        const cutoffDay = new Date(`${date}T00:00:00Z`); cutoffDay.setUTCDate(cutoffDay.getUTCDate() - 1)
        forecastUrl.searchParams.set('publishDateTimeFrom', start.toISOString()); forecastUrl.searchParams.set('publishDateTimeTo', `${cutoffDay.toISOString().slice(0, 10)}T${decisionTime}:00.000Z`)
        const priorDate = new Date(`${date}T00:00:00Z`); priorDate.setUTCDate(priorDate.getUTCDate() - 1)
        const prior = priorDate.toISOString().slice(0, 10)
        const priorUrl = new URL(`${API_BASE}/datasets/FUELHH/stream`, window.location.origin)
        priorUrl.searchParams.set('settlementDateFrom', prior); priorUrl.searchParams.set('settlementDateTo', prior); priorUrl.searchParams.set('fuelType', 'WIND')
        const [actual, forecast, priorActual] = await Promise.all([json(actualUrl), json(forecastUrl), json(priorUrl)])
        return summarize(actual, forecast, date, priorActual, decisionTime)
        }))
        data.push(...batch)
      }
      setResults(data)
    } catch (e) { setError(e.message || 'Backtest could not be completed.'); setResults([]) }
    finally { setLoading(false) }
  }

  const allErrors = results.filter((row) => row.mae !== null)
  const overall = mean(allErrors.map((row) => row.mae))
  const baselineOverall = mean(allErrors.map((row) => row.baselineMae).filter(Number.isFinite))
  const matched = allErrors.reduce((sum, row) => sum + row.periods, 0)
  const conditionRows = results.flatMap((row) => row.conditions || [])
  const conditionGroups = [
    ...Array.from({ length: 4 }, (_, index) => { const start = index * 6; return { label: `${String(start).padStart(2, '0')}:00–${String(start + 6).padStart(2, '0')}:00 UTC`, rows: conditionRows.filter((row) => row.hour >= start && row.hour < start + 6) } }),
    { label: 'Low output · under 5 GW', rows: conditionRows.filter((row) => row.forecast < 5000) },
    { label: 'Mid output · 5–10 GW', rows: conditionRows.filter((row) => row.forecast >= 5000 && row.forecast < 10000) },
    { label: 'High output · 10 GW or more', rows: conditionRows.filter((row) => row.forecast >= 10000) },
  ]
  return <div className="mt-6 space-y-5">
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><CalendarRange size={19}/></span><div><h2 className="text-base font-semibold text-slate-900">Historical forecast backtest</h2><p className="mt-1 text-sm text-slate-500">Compare day-ahead forecasts with actual generation across a selected period.</p></div></div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="grid gap-1.5 text-xs font-semibold text-slate-600">From<input aria-label="Backtest start date" type="date" min={MIN_DATE} max={MAX_DATE} value={from} onChange={(e) => setFrom(e.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-normal"/></label>
        <label className="grid gap-1.5 text-xs font-semibold text-slate-600">To<input aria-label="Backtest end date" type="date" min={MIN_DATE} max={MAX_DATE} value={to} onChange={(e) => setTo(e.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-normal"/></label>
        <button onClick={runBacktest} disabled={loading} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#173b31] px-4 text-sm font-semibold text-white disabled:opacity-50"><Play size={15}/>{loading ? 'Running backtest…' : 'Run backtest'}</button>
      </div>
      <p className="mt-3 text-xs text-slate-400">The available source-data window is 1–31 January 2026. Days without matched observations are omitted from the score.</p>
      {error && <p role="alert" className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    </section>
    {results.length > 0 && <>
      <section aria-label="Backtest summary" className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-semibold text-slate-500">Mean daily MAE</p><p className="mt-2 text-3xl font-semibold tabular-nums text-slate-950">{overall === null ? '—' : Math.round(overall).toLocaleString('en-GB')} <span className="text-sm text-slate-400">MW</span></p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-semibold text-slate-500">Previous-day baseline MAE</p><p className="mt-2 text-3xl font-semibold tabular-nums text-slate-950">{baselineOverall === null ? '—' : Math.round(baselineOverall).toLocaleString('en-GB')} <span className="text-sm text-slate-400">MW</span></p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-semibold text-slate-500">Matched hourly periods</p><p className="mt-2 text-3xl font-semibold tabular-nums text-slate-950">{matched}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-semibold text-slate-500">Days scored</p><p className="mt-2 text-3xl font-semibold tabular-nums text-slate-950">{allErrors.length}<span className="text-sm text-slate-400"> / {results.length}</span></p></article>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><div className="flex items-center gap-2"><TrendingDown size={17} className="text-emerald-700"/><h2 className="text-sm font-semibold text-slate-900">Daily mean absolute error</h2></div><div className="mt-4 h-64" role="img" aria-label="Chart of mean absolute error by day"><ResponsiveContainer width="100%" height="100%"><AreaChart data={results} margin={{left:0,right:12,top:12,bottom:0}}><defs><linearGradient id="backtestFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.2}/><stop offset="100%" stopColor="#10b981" stopOpacity={0.02}/></linearGradient></defs><CartesianGrid vertical={false} stroke="#e9efec" strokeDasharray="4 4"/><XAxis dataKey="date" tickFormatter={(v)=>v.slice(5)} tick={{fontSize:11,fill:'#64748b'}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:11,fill:'#64748b'}} axisLine={false} tickLine={false} unit=" MW" width={58}/><Tooltip formatter={(value)=>[`${Math.round(value).toLocaleString('en-GB')} MW`,'MAE']} labelFormatter={(v)=>`Delivery date ${v}`}/><Area dataKey="mae" name="MAE" connectNulls={false} stroke="#07875e" strokeWidth={2} fill="url(#backtestFill)"/></AreaChart></ResponsiveContainer></div><p className="mt-3 text-xs text-slate-400">Daily scores are averaged equally; the overall score is the mean of scored days. Use the period count to interpret sparse coverage.</p></section>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><h2 className="border-b border-slate-100 px-5 py-4 text-sm font-semibold text-slate-900">Performance by time and output across selected period</h2><div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th scope="col" className="px-5 py-3">Condition</th><th scope="col" className="px-5 py-3">Matched hours</th><th scope="col" className="px-5 py-3">MAE</th><th scope="col" className="px-5 py-3">Bias</th></tr></thead><tbody>{conditionGroups.map((group) => { const bias = mean(group.rows.map((row) => row.difference)); return <tr key={group.label} className="border-t border-slate-100"><th scope="row" className="px-5 py-3 font-medium text-slate-700">{group.label}</th><td className="px-5 py-3 tabular-nums">{group.rows.length}</td><td className="px-5 py-3 tabular-nums">{group.rows.length ? `${Math.round(mean(group.rows.map((row) => row.error))).toLocaleString('en-GB')} MW` : '—'}</td><td className={`px-5 py-3 tabular-nums ${bias == null ? 'text-slate-400' : bias > 0 ? 'text-amber-700' : 'text-sky-700'}`}>{bias == null ? '—' : `${bias > 0 ? '+' : ''}${Math.round(bias).toLocaleString('en-GB')} MW`}</td></tr>})}</tbody></table></div><p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">Output bands use forecast generation. Hourly groups are in UTC.</p></section>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><h2 className="border-b border-slate-100 px-5 py-4 text-sm font-semibold text-slate-900">Daily results</h2><div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th scope="col" className="px-5 py-3">Delivery date</th><th scope="col" className="px-5 py-3">WINDFOR MAE</th><th scope="col" className="px-5 py-3">Previous-day baseline</th><th scope="col" className="px-5 py-3">Matched hours</th><th scope="col" className="px-5 py-3">Status</th></tr></thead><tbody>{results.map((row)=><tr key={row.date} className="border-t border-slate-100"><th scope="row" className="px-5 py-3 font-medium text-slate-700">{row.date}</th><td className="px-5 py-3 tabular-nums">{row.mae===null?'—':`${Math.round(row.mae).toLocaleString('en-GB')} MW`}</td><td className="px-5 py-3 tabular-nums">{row.baselineMae===null?'—':`${Math.round(row.baselineMae).toLocaleString('en-GB')} MW`}</td><td className="px-5 py-3 tabular-nums">{row.periods}</td><td className="px-5 py-3">{row.periods ? <span className="text-emerald-700">Scored</span> : <span className="text-amber-700">No matches</span>}</td></tr>)}</tbody></table></div></section>
    </>}
    {!results.length && !loading && !error && <section className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center"><div><Activity className="mx-auto text-slate-400"/><p className="mt-3 text-sm font-medium text-slate-700">Run a backtest to review historical performance</p><p className="mt-1 text-xs text-slate-500">Choose a date range above to compare forecasts with actuals.</p></div></section>}
  </div>
}
