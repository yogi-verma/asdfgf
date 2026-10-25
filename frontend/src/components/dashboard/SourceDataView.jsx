import { useState } from 'react'
import { ExternalLink } from 'lucide-react'

function stamp(value) {
  return value ? new Date(value).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) : '—'
}

export default function SourceDataView({ actualRows, forecastRows, dateLabel, decisionTime, loading }) {
  const [dataset, setDataset] = useState('actual')
  const rows = dataset === 'actual' ? actualRows : forecastRows
  return (
    <section className="mt-4 overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5">
        <div><h2 className="text-[12px] font-semibold text-slate-800">Elexon BMRS datasets</h2><p className="mt-0.5 text-[9px] text-slate-400">National wind records · {dateLabel} · forecasts selected by {decisionTime} UTC cutoff</p></div>
        <div className="flex rounded-md bg-slate-100 p-0.5"><button onClick={() => setDataset('actual')} className={`rounded px-2.5 py-1 text-[9px] font-semibold ${dataset === 'actual' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>FUELHH actuals</button><button onClick={() => setDataset('forecast')} className={`rounded px-2.5 py-1 text-[9px] font-semibold ${dataset === 'forecast' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>WINDFOR forecasts</button></div>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-2">
        <div className="rounded-md border border-slate-100 bg-slate-50/70 p-3"><p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">Dataset</p><p className="mt-1 text-[12px] font-semibold text-slate-800">{dataset === 'actual' ? 'FUELHH · WIND' : 'WINDFOR · Wind forecast'}</p><p className="mt-1 text-[9px] text-slate-500">{dataset === 'actual' ? 'Half-hourly national generation actuals' : 'Hourly national wind generation forecast'}</p></div>
        <div className="rounded-md border border-slate-100 bg-slate-50/70 p-3"><p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">Records returned</p><p className="mt-1 text-[12px] font-semibold tabular-nums text-slate-800">{rows.length.toLocaleString('en-GB')}</p><p className="mt-1 text-[9px] text-slate-500">{loading ? 'Refreshing from Elexon…' : 'Filtered to selected delivery date'}</p></div>
      </div>
      <div className="overflow-x-auto"><table className="w-full min-w-[580px] text-left"><thead><tr className="bg-slate-50 text-[8px] font-bold uppercase tracking-wider text-slate-400"><th className="px-4 py-2.5">Start time · UTC</th><th className="px-4 py-2.5">Generation</th><th className="px-4 py-2.5">Publish time</th><th className="px-4 py-2.5">Settlement period</th></tr></thead><tbody>
        {rows.slice(0, 20).map((row, index) => <tr key={`${row.startTime}-${row.publishTime || index}`} className="border-t border-slate-100 text-[10px]"><td className="px-4 py-2.5 font-medium text-slate-700">{stamp(row.startTime)}</td><td className="px-4 py-2.5 tabular-nums text-slate-700">{row.generation === null ? '—' : `${Number(row.generation).toLocaleString('en-GB')} MW`}</td><td className="px-4 py-2.5 text-slate-500">{stamp(row.publishTime)}</td><td className="px-4 py-2.5 text-slate-500">{row.settlementPeriod ?? '—'}</td></tr>)}
        {rows.length === 0 && <tr><td colSpan="4" className="px-4 py-8 text-center text-[10px] text-slate-400">{loading ? 'Loading source data…' : 'No records returned for this date.'}</td></tr>}
      </tbody></table></div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-2.5 text-[9px] text-slate-400"><span>Showing {Math.min(rows.length, 20)} of {rows.length} source records</span><a href={dataset === 'actual' ? 'https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream' : 'https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream'} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-emerald-800">API documentation <ExternalLink size={10} /></a></div>
    </section>
  )
}
