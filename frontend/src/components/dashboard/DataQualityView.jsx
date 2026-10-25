import { useEffect, useState } from 'react'
import { Loader } from '../ui/Loader.jsx'

function QualityCard({ label, value, detail, healthy }) {
  return <article className="rounded-lg border border-slate-200/80 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"><div className="flex items-center justify-between gap-2"><h3 className="text-[10px] font-semibold text-slate-500">{label}</h3><span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${healthy ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{healthy ? 'OK' : 'CHECK'}</span></div><p className="mt-2 text-[20px] font-semibold leading-none tracking-tight text-slate-900 tabular-nums">{value}</p><p className="mt-1.5 text-[9px] text-slate-400">{detail}</p></article>
}

export default function DataQualityView({ actualRows, forecastRows, comparison, matched, loading, fetchedAt, forecastPublishedAt }) {
  const [clock, setClock] = useState(0)
  useEffect(() => { const timer = setInterval(() => setClock(Date.now()), 60000); return () => clearInterval(timer) }, [])
  const actualStarts = actualRows.map((row) => row.startTime).filter(Boolean)
  const forecastStarts = forecastRows.map((row) => row.startTime).filter(Boolean)
  const uniqueActuals = new Set(actualStarts).size
  const uniqueForecasts = new Set(forecastStarts).size
  const actualMissingValues = actualRows.filter((row) => row.generation === null || row.generation === undefined).length
  const forecastMissingValues = forecastRows.filter((row) => row.generation === null || row.generation === undefined).length
  const expectedActuals = 48
  const expectedForecasts = 24
  const actualCoverage = Math.min(100, Math.round((uniqueActuals / expectedActuals) * 100))
  const forecastCoverage = Math.min(100, Math.round((uniqueForecasts / expectedForecasts) * 100))
  const matchCoverage = comparison.length ? Math.round((matched.length / comparison.length) * 100) : 0
  const duplicateCount = actualStarts.length - uniqueActuals + forecastStarts.length - uniqueForecasts
  const expectedActualStart = new Set(Array.from({ length: expectedActuals }, (_, index) => `${dateKey(actualStarts[0])}${String(Math.floor(index / 2)).padStart(2, '0')}:${index % 2 ? '30' : '00'}:00Z`))
  const actualStartSet = new Set(actualStarts.map((start) => new Date(start).toISOString().replace('.000Z', 'Z')))
  const missingActualIntervals = actualStarts.length ? [...expectedActualStart].filter((start) => !actualStartSet.has(start)).length : expectedActuals
  const lastActual = actualStarts.length ? actualStarts.reduce((latest, value) => value > latest ? value : latest) : null
  const dataAgeMinutes = fetchedAt && clock ? Math.max(0, Math.round((clock - new Date(fetchedAt).getTime()) / 60000)) : null
  const complete = !loading && actualCoverage === 100 && forecastCoverage === 100 && missingActualIntervals === 0 && actualMissingValues === 0 && forecastMissingValues === 0 && duplicateCount === 0
  return (
    <>
      <section className="mt-4 rounded-lg border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-[12px] font-semibold text-slate-800">Daily data quality</h2><p className="mt-0.5 text-[9px] text-slate-400">Completeness and consistency checks for the selected date</p></div><span className={`rounded-full px-2 py-1 text-[9px] font-bold ${complete ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{loading ? <Loader label="Checking data" /> : complete ? 'ALL CHECKS PASSED' : 'REVIEW DATA'}</span></div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <QualityCard label="Actual interval coverage" value={`${actualCoverage}%`} detail={`${uniqueActuals} of ${expectedActuals} half-hour periods`} healthy={actualCoverage === 100} />
          <QualityCard label="Forecast interval coverage" value={`${forecastCoverage}%`} detail={`${uniqueForecasts} of ${expectedForecasts} hourly periods`} healthy={forecastCoverage === 100} />
          <QualityCard label="Matched forecast hours" value={`${matchCoverage}%`} detail={`${matched.length} matched of ${comparison.length} forecasts`} healthy={comparison.length > 0 && matchCoverage === 100} />
          <QualityCard label="Duplicate timestamps" value={duplicateCount} detail="Repeated start times across source data" healthy={duplicateCount === 0} />
          <QualityCard label="Missing actual intervals" value={missingActualIntervals} detail="Missing half-hourly FUELHH timestamps" healthy={missingActualIntervals === 0} />
        </div>
      </section>
      <section className="mt-4 rounded-lg border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <h2 className="text-[12px] font-semibold text-slate-800">Validation details</h2>
        <div className="mt-3 divide-y divide-slate-100">
          <div className="flex items-center justify-between gap-3 py-2 text-[10px]"><span className="text-slate-600">FUELHH generation values present</span><span className={actualMissingValues ? 'font-semibold text-amber-700' : 'font-semibold text-emerald-700'}>{actualRows.length - actualMissingValues} / {actualRows.length}{actualMissingValues ? ` · ${actualMissingValues} missing` : ' · complete'}</span></div>
          <div className="flex items-center justify-between gap-3 py-2 text-[10px]"><span className="text-slate-600">WINDFOR generation values present</span><span className={forecastMissingValues ? 'font-semibold text-amber-700' : 'font-semibold text-emerald-700'}>{forecastRows.length - forecastMissingValues} / {forecastRows.length}{forecastMissingValues ? ` · ${forecastMissingValues} missing` : ' · complete'}</span></div>
          <div className="flex items-center justify-between gap-3 py-2 text-[10px]"><span className="text-slate-600">Expected granularity</span><span className="font-medium text-slate-600">FUELHH 30 min · WINDFOR 60 min</span></div>
          <div className="flex items-center justify-between gap-3 py-2 text-[10px]"><span className="text-slate-600">Data loading status</span><span className={loading ? 'font-semibold text-amber-700' : 'font-semibold text-emerald-700'}>{loading ? 'Updating from Elexon' : 'Loaded'}</span></div>
          <div className="flex items-center justify-between gap-3 py-2 text-[10px]"><span className="text-slate-600">Last successful fetch</span><span className="font-medium text-slate-600">{fetchedAt ? `${dataAgeMinutes} min ago · ${new Date(fetchedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC` : 'Not yet fetched'}</span></div>
          <div className="flex items-center justify-between gap-3 py-2 text-[10px]"><span className="text-slate-600">Latest WINDFOR publication</span><span className="font-medium text-slate-600">{forecastPublishedAt ? new Date(forecastPublishedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC' : '—'}</span></div>
          <div className="flex items-center justify-between gap-3 py-2 text-[10px]"><span className="text-slate-600">Latest FUELHH delivery interval</span><span className="font-medium text-slate-600">{lastActual ? new Date(lastActual).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC' : '—'}</span></div>
        </div>
      </section>
    </>
  )
}

function dateKey(value) {
  return value ? new Date(value).toISOString().slice(0, 10) + 'T' : ''
}
