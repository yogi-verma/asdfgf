function displayTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
}

export default function ForecastTable({ rows, dateLabel, loading }) {
  return (
    <section className="mt-4 overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="border-b border-slate-100 px-4 py-3"><h2 className="text-[12px] font-semibold text-slate-800">Selected forecast periods</h2><p className="mt-0.5 text-[9px] text-slate-400">WINDFOR values available for {dateLabel}</p></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left"><thead><tr className="bg-slate-50 text-[8px] font-bold uppercase tracking-wider text-slate-400"><th className="px-4 py-2.5">Delivery time · UTC</th><th className="px-4 py-2.5">Forecast generation</th><th className="px-4 py-2.5">Published · UTC</th><th className="px-4 py-2.5">Dataset</th></tr></thead>
        <tbody>{rows.slice(0, 12).map((row) => <tr key={`${row.startTime}-${row.publishTime}`} className="border-t border-slate-100 text-[10px]"><td className="px-4 py-2.5 font-medium text-slate-700">{displayTime(row.startTime)}</td><td className="px-4 py-2.5 font-semibold tabular-nums text-slate-800">{row.generation === null ? '—' : `${Math.round(Number(row.generation)).toLocaleString('en-GB')} MW`}</td><td className="px-4 py-2.5 text-slate-500">{displayTime(row.publishTime)}</td><td className="px-4 py-2.5 text-slate-500">WINDFOR</td></tr>)}</tbody>
      </table></div>
      <div className="border-t border-slate-100 px-4 py-2 text-[9px] text-slate-400">{loading ? 'Loading forecast…' : `Showing ${Math.min(rows.length, 12)} of ${rows.length} periods`}</div>
    </section>
  )
}
