import { Download } from 'lucide-react'
import { useState } from 'react'

function format(value) {
  return value === null || value === undefined ? '—' : Math.round(value).toLocaleString('en-GB')
}

export default function HourlyTable({ rows, dateLabel, loading, onExport }) {
  const [expanded, setExpanded] = useState(false)
  const visibleRows = expanded ? rows : rows.slice(0, 8)
  return (
    <section className="mt-4 min-w-0 overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <div><h2 className="text-[12px] font-semibold text-slate-800">Hourly comparison</h2><p className="mt-0.5 text-[9px] text-slate-400">WINDFOR forecast and matching FUELHH actuals · {dateLabel}</p></div>
        <button onClick={onExport} disabled={!rows.length} className="flex h-7 items-center gap-1.5 rounded-md border border-slate-200 px-2 text-[9px] font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"><Download size={11} />CSV</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] text-left">
          <thead><tr className="bg-slate-50/80 text-[8px] font-bold uppercase tracking-[0.08em] text-slate-400"><th className="px-4 py-2.5">Delivery time</th><th className="px-3 py-2.5">Forecast</th><th className="px-3 py-2.5">Actual mean</th><th className="px-3 py-2.5">Error</th><th className="px-3 py-2.5">Absolute error</th><th className="px-4 py-2.5 text-right">APE</th></tr></thead>
          <caption className="sr-only">Hourly wind forecast and actual comparison for {dateLabel}</caption><tbody>{visibleRows.map((row) => <tr key={row.key} className="border-t border-slate-100 text-[10px] hover:bg-slate-50/60"><th scope="row" className="px-4 py-2.5 text-left font-semibold text-slate-700">{row.time} <span className="font-normal text-slate-400">UTC</span></th><td className="px-3 py-2.5 tabular-nums text-slate-600">{format(row.forecast)} <span className="text-[9px] text-slate-400">MW</span></td><td className="px-3 py-2.5 tabular-nums text-slate-600">{format(row.actual)} <span className="text-[9px] text-slate-400">MW</span></td><td className={`px-3 py-2.5 tabular-nums font-medium ${row.difference === null ? 'text-slate-400' : row.difference > 0 ? 'text-amber-700' : 'text-sky-700'}`}>{row.difference === null ? '—' : `${row.difference > 0 ? '+' : ''}${format(row.difference)} MW`}</td><td className="px-3 py-2.5 tabular-nums text-slate-600">{row.absoluteError === null ? '—' : `${format(row.absoluteError)} MW`}</td><td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{row.absolutePercentageError === null ? '—' : `${row.absolutePercentageError.toFixed(1)}%`}</td></tr>)}</tbody>
        </table>
      </div>
      <div className="flex flex-col gap-2 border-t border-slate-100 px-4 py-3 text-[11px] text-slate-500 sm:flex-row sm:items-center sm:justify-between"><span>{loading ? 'Loading…' : `Showing ${visibleRows.length} of ${rows.length} hourly periods`}</span><div className="flex items-center gap-4"><span>Actuals aggregated from half-hourly FUELHH data</span>{rows.length > 8 && <button aria-expanded={expanded} onClick={() => setExpanded(!expanded)} className="font-semibold text-emerald-800 hover:text-emerald-950">{expanded ? 'Show fewer' : 'Show all periods'}</button>}</div></div>
    </section>
  )
}
