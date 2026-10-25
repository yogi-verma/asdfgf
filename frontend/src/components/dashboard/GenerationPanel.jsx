import { Activity, ArrowRight, Clock3 } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Loader, LoadingPanel } from '../ui/Loader.jsx'

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 shadow-lg">
      <p className="mb-1 text-[9px] font-medium text-slate-400">{label} UTC</p>
      {payload.map((item) => <p key={item.dataKey} className="text-[10px] font-semibold text-slate-700">{item.name === 'forecast' ? 'Forecast' : 'Actual'} <span className="font-medium text-slate-500">{Number(item.value).toLocaleString('en-GB', { maximumFractionDigits: 0 })} MW</span></p>)}
    </div>
  )
}

export default function GenerationPanel({ rows, dateLabel, publishTime, loading, error, mae, matchedCount, onViewAccuracy }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 px-4 py-3.5">
        <div className="min-w-0"><div className="flex items-center gap-2"><h2 className="text-[12px] font-semibold text-slate-800">Wind generation profile</h2><span className="rounded bg-slate-100 px-1.5 py-0.5 text-[8px] font-semibold text-slate-500">MW</span></div><p className="mt-1 truncate text-[9px] text-slate-400">Forecast vs actual · {dateLabel}</p></div>
        <span className="inline-flex items-center gap-1 text-[9px] text-slate-400"><Clock3 size={11} />Published {publishTime} UTC</span>
      </div>
      <div className="flex items-center justify-between px-4 pt-3">
        <div className="flex gap-3 text-[9px] font-medium text-slate-500"><span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Forecast</span><span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-sky-500" />Actual hourly mean</span></div>
        {loading && <Loader label="Updating" />}
      </div>
      <div className="h-[220px] min-w-0 px-1 pb-2 pt-3 sm:h-[250px] sm:px-3">
        {rows.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={rows} margin={{ top: 6, right: 8, bottom: 0, left: -12 }}>
          <defs><linearGradient id="windForecastFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.18} /><stop offset="95%" stopColor="#10b981" stopOpacity={0.01} /></linearGradient></defs>
          <CartesianGrid vertical={false} stroke="#edf1f3" strokeDasharray="3 5" />
          <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9 }} dy={7} interval={3} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9 }} tickFormatter={(value) => `${Math.round(value / 1000)}k`} width={30} />
          <Tooltip content={<ChartTooltip />} />
          <Area type="monotone" dataKey="forecast" name="forecast" stroke="#079669" strokeWidth={2} fill="url(#windForecastFill)" activeDot={{ r: 3, strokeWidth: 0 }} />
          <Line type="monotone" dataKey="actual" name="actual" stroke="#3b91c9" strokeWidth={1.8} dot={false} activeDot={{ r: 3, strokeWidth: 0 }} connectNulls={false} />
        </AreaChart></ResponsiveContainer> : loading ? <LoadingPanel label="Loading generation data…" /> : <div className="grid h-full place-items-center px-5 text-center text-[10px] text-slate-400">{error ? 'Resolve the connection to view this chart.' : 'No forecast points are available for this date and cutoff.'}</div>}
      </div>
      <div className="mx-3 mb-3 flex flex-col gap-2 rounded-md bg-[#f4f9f7] px-3 py-2.5 sm:mx-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-[10px] text-slate-600"><span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-emerald-100 text-emerald-700"><Activity size={12} /></span><span className="font-semibold text-slate-700">{mae === null ? 'Accuracy appears when actuals and forecasts overlap.' : `MAE ${Math.round(mae).toLocaleString('en-GB')} MW across ${matchedCount} hours`}</span></div>
        <button onClick={onViewAccuracy} className="flex items-center gap-1 self-start whitespace-nowrap text-[9px] font-semibold text-emerald-800 hover:text-emerald-950">View accuracy <ArrowRight size={11} /></button>
      </div>
    </section>
  )
}
