import { useMemo, useState } from 'react'
import { GitCompareArrows } from 'lucide-react'

function mean(values) { return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null }

export default function VintageComparison({ rawRows, actualRows, deliveryDate, cutoff }) {
  const validPublications = useMemo(() => [...new Set(rawRows.filter((row) => {
    if (!row.startTime || !row.publishTime) return false
    const delivery = new Date(row.startTime)
    const published = new Date(row.publishTime)
    const priorDay = new Date(`${deliveryDate}T00:00:00Z`); priorDay.setUTCDate(priorDay.getUTCDate() - 1)
    return delivery.toISOString().slice(0, 10) === deliveryDate && published <= new Date(`${priorDay.toISOString().slice(0, 10)}T${cutoff}:00Z`)
  }).map((row) => row.publishTime))].sort(), [rawRows, deliveryDate, cutoff])
  const [first, setFirst] = useState('')
  const [second, setSecond] = useState('')
  const selectedFirst = validPublications.includes(first) ? first : validPublications[0] || ''
  const selectedSecond = validPublications.includes(second) ? second : validPublications.at(-1) || ''
  const actualByHour = useMemo(() => {
    const grouped = new Map()
    for (const row of actualRows) {
      if (row.generation === null || row.generation === undefined) continue
      if (!row.startTime || !Number.isFinite(Number(row.generation))) continue
      const key = new Date(row.startTime).toISOString().slice(0, 13)
      grouped.set(key, [...(grouped.get(key) || []), Number(row.generation)])
    }
    return new Map([...grouped].map(([key, values]) => [key, mean(values)]))
  }, [actualRows])
  const summarize = (publication) => {
    const rows = rawRows.filter((row) => row.publishTime === publication && row.startTime && new Date(row.startTime).toISOString().slice(0, 10) === deliveryDate)
    const values = rows.filter((row) => row.generation !== null && row.generation !== undefined).map((row) => ({ time: new Date(row.startTime).toISOString().slice(11, 16), forecast: Number(row.generation), actual: actualByHour.get(new Date(row.startTime).toISOString().slice(0, 13)) })).filter((row) => Number.isFinite(row.forecast))
    const errors = values.flatMap((row) => row.actual == null ? [] : [Math.abs(row.forecast - row.actual)])
    return { values, mae: mean(errors), count: errors.length }
  }
  const left = summarize(selectedFirst)
  const right = summarize(selectedSecond)
  const stamp = (value) => value ? new Date(value).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC' : '—'
  return <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4"><span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-violet-700"><GitCompareArrows size={17}/></span><div><h2 className="text-sm font-semibold text-slate-900">Forecast vintage comparison</h2><p className="mt-1 text-xs text-slate-500">Compare how published forecast revisions changed for the same delivery day.</p></div></div>
    {validPublications.length < 2 ? <p className="p-5 text-sm text-slate-500">At least two forecast publication times are needed for a vintage comparison. The selected API window returned {validPublications.length} vintage{validPublications.length === 1 ? '' : 's'}.</p> : <>
      <div className="grid gap-3 p-5 sm:grid-cols-2"><label className="grid gap-1.5 text-xs font-semibold text-slate-600">Earlier vintage<select aria-label="Earlier forecast vintage" value={selectedFirst} onChange={(e)=>setFirst(e.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal">{validPublications.map((p)=><option key={p} value={p}>{stamp(p)}</option>)}</select></label><label className="grid gap-1.5 text-xs font-semibold text-slate-600">Later vintage<select aria-label="Later forecast vintage" value={selectedSecond} onChange={(e)=>setSecond(e.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal">{validPublications.map((p)=><option key={p} value={p}>{stamp(p)}</option>)}</select></label></div>
      <div className="grid gap-3 px-5 pb-5 sm:grid-cols-2">{[{title:'Earlier publication', publication:selectedFirst, data:left},{title:'Later publication', publication:selectedSecond, data:right}].map((item)=><article key={item.title} className="rounded-xl border border-slate-100 bg-slate-50/70 p-4"><p className="text-xs font-semibold text-slate-500">{item.title}</p><p className="mt-1 text-sm font-semibold text-slate-800">{stamp(item.publication)}</p><div className="mt-3 flex gap-6"><div><p className="text-[10px] text-slate-500">MAE</p><p className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900">{item.data.mae == null ? '—' : `${Math.round(item.data.mae).toLocaleString('en-GB')} MW`}</p></div><div><p className="text-[10px] text-slate-500">Matched hours</p><p className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900">{item.data.count}</p></div></div></article>)}</div>
      <div className="overflow-x-auto border-t border-slate-100"><table className="w-full min-w-[520px] text-left text-xs"><caption className="sr-only">Forecast value differences between selected publication vintages</caption><thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500"><tr><th scope="col" className="px-5 py-3">Hour UTC</th><th scope="col" className="px-5 py-3">Earlier forecast</th><th scope="col" className="px-5 py-3">Later forecast</th><th scope="col" className="px-5 py-3">Revision</th></tr></thead><tbody>{left.values.slice(0,24).map((row)=>{const newer=right.values.find((v)=>v.time===row.time);const delta=newer?newer.forecast-row.forecast:null;return <tr key={row.time} className="border-t border-slate-100"><th scope="row" className="px-5 py-3 font-medium text-slate-700">{row.time}</th><td className="px-5 py-3 tabular-nums">{Math.round(row.forecast).toLocaleString('en-GB')} MW</td><td className="px-5 py-3 tabular-nums">{newer?`${Math.round(newer.forecast).toLocaleString('en-GB')} MW`:'—'}</td><td className={`px-5 py-3 tabular-nums ${delta==null?'text-slate-400':delta>0?'text-amber-700':'text-sky-700'}`}>{delta==null?'—':`${delta>0?'+':''}${Math.round(delta).toLocaleString('en-GB')} MW`}</td></tr>})}</tbody></table></div>
    </>}
    <p className="border-t border-slate-100 px-5 py-3 text-[11px] text-slate-400">Only publication times within the selected D−1 decision cutoff are included. All values are from WINDFOR.</p>
  </section>
}
