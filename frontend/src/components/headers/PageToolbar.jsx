import { CalendarDays, CircleHelp, Clock3, Download, ExternalLink, RefreshCw } from 'lucide-react'

export default function PageToolbar({ page, date, decisionTime, onDateChange, onDecisionTimeChange, onRefresh, onExport, disabledExport, loading, error, apiBase }) {
  return (
    <>
      <section className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div className="min-w-0">
          <p className="mb-1.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />UK day-ahead · Wind</p>
          <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.035em] text-slate-900 sm:text-[25px]">{page === 'Overview' ? 'Market overview' : page}</h1>
          <p className="mt-1 text-[11px] text-slate-500">Wind generation outlook and forecast performance for the GB system.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-end">
          <label className="flex h-9 min-w-0 items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 text-[11px] font-medium text-slate-600 shadow-sm"><CalendarDays size={14} className="shrink-0 text-slate-400" /><input aria-label="Delivery date" type="date" min="2026-01-01" max="2026-01-31" value={date} onChange={(event) => onDateChange(event.target.value)} className="w-full min-w-0 bg-transparent text-[11px] outline-none sm:w-[118px]" /></label>
          <label className="flex h-9 min-w-0 flex-col justify-center rounded-md border border-slate-200 bg-white px-2.5 shadow-sm"><span className="text-[8px] font-bold uppercase tracking-wide text-slate-400">Cutoff · UTC</span><input aria-label="Forecast decision cutoff in UTC" type="time" value={decisionTime} onChange={(event) => onDecisionTimeChange(event.target.value)} className="w-full bg-transparent text-[11px] font-medium leading-tight text-slate-700 outline-none sm:w-[78px]" /></label>
          <button onClick={onRefresh} className="flex h-9 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-[11px] font-medium text-slate-600 shadow-sm hover:bg-slate-50"><RefreshCw size={13} className={loading ? 'animate-spin text-emerald-600' : 'text-slate-400'} />Refresh</button>
          <button onClick={onExport} disabled={disabledExport} className="flex h-9 items-center justify-center gap-1.5 rounded-md bg-[#14243a] px-3 text-[11px] font-semibold text-white shadow-sm hover:bg-[#203954] disabled:cursor-not-allowed disabled:opacity-40"><Download size={13} />Export</button>
        </div>
      </section>
      <div className={`mt-4 flex flex-col gap-2 rounded-lg border px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between ${error ? 'border-rose-200 bg-rose-50/80' : 'border-slate-200 bg-white'}`}>
        <div className="flex min-w-0 items-start gap-2"><span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${error ? 'bg-rose-100 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>{error ? <CircleHelp size={12} /> : <Clock3 size={12} />}</span>
          <p className={`text-[10px] leading-relaxed ${error ? 'text-rose-900' : 'text-slate-600'}`}>{error ? <><strong>Could not load Elexon data.</strong> {error} Check that the backend is running at {apiBase}.</> : <><strong className="text-slate-800">Forecast selection.</strong> Latest forecast published on D-1 by {decisionTime} UTC. Hourly WINDFOR is compared with the mean of available half-hourly FUELHH actuals.</>}</p>
        </div>
        <a href="https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream" target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1.5 pl-7 text-[10px] font-semibold text-emerald-800 hover:text-emerald-950 sm:pl-0">Elexon source <ExternalLink size={11} /></a>
      </div>
    </>
  )
}
