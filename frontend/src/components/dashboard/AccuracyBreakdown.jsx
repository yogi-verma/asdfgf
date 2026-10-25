function average(values) { return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null }

function Bucket({ title, rows }) {
  const mae = average(rows.map((row) => row.absoluteError).filter(Number.isFinite))
  const bias = average(rows.map((row) => row.difference).filter(Number.isFinite))
  return <div className="flex items-center justify-between gap-3 border-t border-slate-100 py-3 first:border-0"><div><p className="text-sm font-medium text-slate-800">{title}</p><p className="mt-0.5 text-xs text-slate-500">{rows.length} matched hours</p></div><div className="text-right"><p className="text-sm font-semibold tabular-nums text-slate-800">{mae == null ? '—' : `${Math.round(mae).toLocaleString('en-GB')} MW`} <span className="text-[10px] font-normal text-slate-400">MAE</span></p><p className={`mt-0.5 text-xs tabular-nums ${bias == null ? 'text-slate-400' : bias > 0 ? 'text-amber-700' : 'text-sky-700'}`}>Bias {bias == null ? '—' : `${bias > 0 ? '+' : ''}${Math.round(bias).toLocaleString('en-GB')} MW`}</p></div></div>
}

export default function AccuracyBreakdown({ rows }) {
  const byHour = Array.from({ length: 4 }, (_, index) => {
    const start = index * 6
    return { title: `${String(start).padStart(2,'0')}:00–${String(start + 6).padStart(2,'0')}:00 UTC`, rows: rows.filter((row) => Number(row.time?.slice(0,2)) >= start && Number(row.time?.slice(0,2)) < start + 6) }
  })
  const byLoad = [
    { title: 'Low output · under 5 GW', rows: rows.filter((r) => r.forecast < 5000) },
    { title: 'Mid output · 5–10 GW', rows: rows.filter((r) => r.forecast >= 5000 && r.forecast < 10000) },
    { title: 'High output · 10 GW or more', rows: rows.filter((r) => r.forecast >= 10000) },
  ]
  return <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div><h2 className="text-sm font-semibold text-slate-900">Performance by time and output level</h2><p className="mt-1 text-xs text-slate-500">Daily slices help reveal where forecast errors are concentrated.</p></div><div className="mt-4 grid gap-6 lg:grid-cols-2"><div><h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Time of day</h3>{byHour.map((bucket)=><Bucket key={bucket.title} {...bucket}/>)}</div><div><h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Forecast output</h3>{byLoad.map((bucket)=><Bucket key={bucket.title} {...bucket}/>)}</div></div><p className="mt-4 border-t border-slate-100 pt-3 text-[11px] text-slate-400">Output bands are descriptive slices of the selected day; use historical backtesting for a broader sample.</p></section>
}
