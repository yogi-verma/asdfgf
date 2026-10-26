import { Activity, ArrowRight, Clock3 } from 'lucide-react'
import { useState } from 'react'
import { Area, AreaChart, Brush, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Loader, LoadingPanel } from '../ui/Loader.jsx'

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 shadow-lg">
      <p className="mb-1 text-[10px] font-medium text-slate-400">{label} UTC</p>
      {payload.map((item) => <p key={item.dataKey} className="text-[10px] font-semibold text-slate-700">{item.name === 'forecast' ? 'Forecast' : item.name === 'actual' ? 'Actual' : 'Indicative MAE range'} <span className="font-medium text-slate-500">{Array.isArray(item.value) ? `${Math.round(item.value[0]).toLocaleString('en-GB')}–${Math.round(item.value[1]).toLocaleString('en-GB')} MW` : `${Number(item.value).toLocaleString('en-GB', { maximumFractionDigits: 0 })} MW`}</span></p>)}
    </div>
  )
}

export default function GenerationPanel({ rows, dateLabel, publishTime, loading, error, mae, matchedCount, confidenceError, onViewAccuracy }) {
  const [showForecast, setShowForecast] = useState(true)
  const [showActual, setShowActual] = useState(true)
  const chartRows = rows.map((row) => ({ ...row, confidenceBand: confidenceError == null || row.forecast == null ? null : [Math.max(0, row.forecast - confidenceError), row.forecast + confidenceError] }))
  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.025]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5">
        <div className="min-w-0"><div className="flex items-center gap-2.5"><h2 className="text-[15px] font-semibold tracking-tight text-slate-900">Wind generation profile</h2><span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">MW</span></div><p className="mt-1.5 truncate text-[12px] text-slate-500">Forecast vs actual · {dateLabel}</p></div>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-500"><Clock3 size={13} />Published {publishTime} UTC</span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-3.5 sm:px-5">
        <div className="flex flex-wrap gap-2 text-[11px] font-medium"><button type="button" aria-pressed={showForecast} onClick={()=>setShowForecast(!showForecast)} className={`flex min-h-8 items-center gap-2 rounded-lg px-2.5 transition ${showForecast?'bg-[#eaf0fa] text-[#355b91]':'bg-slate-100 text-slate-500'}`}><span className="h-2 w-2 rounded-full bg-[#4f78bb]"/>Forecast</button><button type="button" aria-pressed={showActual} onClick={()=>setShowActual(!showActual)} className={`flex min-h-8 items-center gap-2 rounded-lg px-2.5 transition ${showActual?'bg-teal-50 text-teal-800':'bg-slate-100 text-slate-500'}`}><span className="h-2 w-2 rounded-full bg-teal-500"/>Actual hourly mean</button><span className="inline-flex items-center gap-2 px-1 text-slate-500"><span className="h-2 w-2 rounded-sm bg-blue-100 ring-1 ring-blue-200"/>Indicative range · ± daily MAE</span></div>
        {loading && <Loader label="Updating" />}
      </div>
      <div className="h-[250px] min-w-0 px-1 pb-2 pt-3 sm:h-[280px] sm:px-3">
        {rows.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={chartRows} accessibilityLayer aria-label="Wind generation forecast and actuals with MAE range" margin={{ top: 6, right: 8, bottom: 0, left: -12 }}>
          <defs><linearGradient id="windForecastFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4f78bb" stopOpacity={0.2} /><stop offset="95%" stopColor="#4f78bb" stopOpacity={0.01} /></linearGradient></defs>
          <CartesianGrid vertical={false} stroke="#edf1f3" strokeDasharray="3 5" />
          <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#84918d', fontSize: 11 }} dy={9} interval={3} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#84918d', fontSize: 11 }} tickFormatter={(value) => `${Math.round(value / 1000)}k`} width={38} />
          <Tooltip content={<ChartTooltip />} />
          {showForecast && <Area type="monotone" dataKey="confidenceBand" name="confidence" stroke="none" fill="#4f78bb" fillOpacity={0.13} connectNulls={false} isAnimationActive={false} />}
          {showForecast && <Area type="monotone" dataKey="forecast" name="forecast" stroke="#416da9" strokeWidth={2.2} fill="url(#windForecastFill)" activeDot={{ r: 3, strokeWidth: 0 }} />}
          {showActual && <Line type="monotone" dataKey="actual" name="actual" stroke="#1da8a0" strokeWidth={1.9} dot={false} activeDot={{ r: 3, strokeWidth: 0 }} connectNulls={false} />}
          {rows.length > 8 && <Brush dataKey="time" height={22} stroke="#416da9" fill="#f5f8fd" travellerWidth={9} ariaLabel="Zoom chart by delivery time" />}
        </AreaChart></ResponsiveContainer> : loading ? <LoadingPanel label="Loading generation data…" /> : <div className="grid h-full place-items-center px-5 text-center text-[10px] text-slate-400">{error ? 'Resolve the connection to view this chart.' : 'No forecast points are available for this date and cutoff.'}</div>}
      </div>
      <div className="mx-3.5 mb-3.5 flex flex-col gap-2 rounded-xl border border-blue-100 bg-[#f4f7fc] px-3.5 py-2.5 sm:mx-4 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 text-[12px] text-slate-600"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#e3ebf8] text-[#355b91]"><Activity size={15} /></span><span className="font-semibold text-slate-700">{mae === null ? 'Accuracy appears when actuals and forecasts overlap.' : `MAE ${Math.round(mae).toLocaleString('en-GB')} MW across ${matchedCount} hours`}</span></div>
        <button onClick={onViewAccuracy} className="flex items-center gap-1.5 self-start whitespace-nowrap text-[11px] font-semibold text-[#355b91] hover:text-[#203b67]">View accuracy <ArrowRight size={14} /></button>
      </div>
    </section>
  )
}
