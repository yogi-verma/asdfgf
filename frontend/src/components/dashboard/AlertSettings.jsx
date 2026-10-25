import { useEffect, useState } from 'react'
import { BellRing, ChevronDown, ChevronUp, TriangleAlert } from 'lucide-react'

const defaults = { mae: '1000', coverage: '80', staleMinutes: '30', autoRefresh: false }
function savedSettings() {
  try { return { ...defaults, ...JSON.parse(localStorage.getItem('gridbricks-alert-settings') || '{}') } }
  catch { return defaults }
}

export default function AlertSettings({ mae, coverage, loading, fetchedAt, onAutoRefreshChange }) {
  const [settings, setSettings] = useState(savedSettings)
  const [open, setOpen] = useState(false)
  const [clock, setClock] = useState(0)
  useEffect(() => { try { localStorage.setItem('gridbricks-alert-settings', JSON.stringify(settings)) } catch { /* Settings remain usable for this session when storage is unavailable. */ } }, [settings])
  useEffect(() => { onAutoRefreshChange?.(settings.autoRefresh) }, [settings.autoRefresh, onAutoRefreshChange])
  useEffect(() => { const timer = setInterval(() => setClock(Date.now()), 60000); return () => clearInterval(timer) }, [])
  const highError = !loading && mae != null && mae > Number(settings.mae)
  const lowCoverage = !loading && coverage < Number(settings.coverage)
  const ageMinutes = fetchedAt ? Math.max(0, Math.floor((clock - new Date(fetchedAt).getTime()) / 60000)) : null
  const stale = ageMinutes != null && ageMinutes > Number(settings.staleMinutes)
  return <section className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-700"><BellRing size={17}/></span><div><h2 className="text-sm font-semibold text-slate-900">Forecast alerts</h2><p className="mt-0.5 text-xs text-slate-500">Thresholds are saved in this browser.</p></div></div><button aria-expanded={open} onClick={()=>setOpen(!open)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700">{open?'Edit thresholds':'Alert settings'}{open?<ChevronUp size={15}/>:<ChevronDown size={15}/>}</button></div>
    {(highError || lowCoverage || stale) && <div role="status" aria-live="polite" className="mx-5 mb-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><TriangleAlert size={17} className="mt-0.5 shrink-0"/><div><p className="font-semibold">{stale ? 'Source data has not refreshed recently' : highError && lowCoverage ? 'Forecast error and data coverage need attention' : highError ? 'Forecast error is above your threshold' : 'Matched data coverage is below your threshold'}</p><p className="mt-0.5 text-xs">Current MAE: {mae == null ? '—' : `${Math.round(mae).toLocaleString('en-GB')} MW`} · matched coverage: {Math.round(coverage)}%{stale ? ` · last fetch ${ageMinutes} minutes ago` : ''}.</p></div></div>}
    {open && <div className="grid gap-4 border-t border-slate-100 px-5 py-4 sm:grid-cols-2"><label className="grid gap-1.5 text-xs font-semibold text-slate-600">Alert when MAE exceeds (MW)<input type="number" min="0" step="100" value={settings.mae} onChange={(e)=>setSettings((old)=>({...old,mae:e.target.value}))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-normal"/></label><label className="grid gap-1.5 text-xs font-semibold text-slate-600">Alert when matched coverage falls below (%)<input type="number" min="0" max="100" value={settings.coverage} onChange={(e)=>setSettings((old)=>({...old,coverage:e.target.value}))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-normal"/></label><label className="grid gap-1.5 text-xs font-semibold text-slate-600">Alert when last successful fetch is older than (minutes)<input type="number" min="1" step="5" value={settings.staleMinutes} onChange={(e)=>setSettings((old)=>({...old,staleMinutes:e.target.value}))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-normal"/></label><label className="flex min-h-10 items-center gap-2 self-end text-xs font-semibold text-slate-700"><input type="checkbox" checked={Boolean(settings.autoRefresh)} onChange={(e)=>setSettings((old)=>({...old,autoRefresh:e.target.checked}))} className="h-4 w-4 accent-emerald-700"/>Refresh data automatically every 5 minutes</label><p className="text-xs text-slate-500 sm:col-span-2">Alerts appear in this dashboard when thresholds are breached. Auto-refresh may make requests to Elexon every five minutes. No external notifications are sent.</p></div>}
  </section>
}
