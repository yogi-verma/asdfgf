import { Activity, Gauge, LayoutDashboard, MoreHorizontal, ShieldCheck, Wind, X, History } from 'lucide-react'

const primaryLinks = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Wind forecasts', icon: Wind },
  { label: 'Forecast accuracy', icon: Gauge },
  { label: 'Backtesting', icon: History },
]
const dataLinks = [
  { label: 'Elexon BMRS', icon: Activity },
  { label: 'Data quality', icon: ShieldCheck },
]

function NavigationLink({ item, active, onClick }) {
  const Icon = item.icon
  return (
    <button onClick={onClick} aria-current={active ? 'page' : undefined} className={`group flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] font-medium transition ${active ? 'bg-[#183c32] text-white shadow-sm' : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-100'}`}>
      <Icon size={17} strokeWidth={1.8} className={active ? 'text-emerald-300' : 'text-slate-500 group-hover:text-slate-300'} />
      <span className="flex-1">{item.label}</span>
      {active && <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />}
    </button>
  )
}

export default function Sidebar({ active, onNavigate, open, onClose, loading, error }) {
  return (
    <>
      {open && <button aria-label="Close navigation" onClick={onClose} className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[1px] lg:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col border-r border-white/[0.06] bg-[#111b24] px-4 py-5 text-white shadow-2xl transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:translate-x-0 lg:shadow-none ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-11 items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-400 text-[#0b1726]"><Wind size={19} strokeWidth={2.3} /></span>
            <span><span className="block text-[15px] font-semibold tracking-tight">gridbricks</span><span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-500">Energy intelligence</span></span>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-white/10 lg:hidden" aria-label="Close menu"><X size={17} /></button>
        </div>

        <nav className="mt-9" aria-label="Main navigation">
          <p className="mb-2.5 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Workspace</p>
          <div className="space-y-1">{primaryLinks.map((item) => <NavigationLink key={item.label} item={item} active={active === item.label} onClick={() => { onNavigate(item.label); onClose() }} />)}</div>
          <p className="mb-2.5 mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Data</p>
          <div className="space-y-1">{dataLinks.map((item) => <NavigationLink key={item.label} item={item} active={active === item.label} onClick={() => { onNavigate(item.label); onClose() }} />)}</div>
        </nav>

        <div className="mt-auto">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.035] p-3.5">
            <div className="flex items-center gap-2.5 text-[12px] font-semibold text-slate-200"><span className={`h-2 w-2 rounded-full ${loading ? 'animate-pulse bg-amber-400' : error ? 'bg-rose-400' : 'bg-emerald-400'}`} />{loading ? 'Connecting to Elexon' : error ? 'Connection issue' : 'Elexon connected'}</div>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">National wind · FUELHH + WINDFOR</p>
          </div>
          <div className="mt-3 flex items-center gap-2.5 border-t border-white/10 px-1 pt-4">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-700 text-[10px] font-bold">GB</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold">GridBricks workspace</span><span className="block text-[9px] text-slate-500">UK power desk</span></span>
            <MoreHorizontal size={15} className="text-slate-500" />
          </div>
        </div>
      </aside>
    </>
  )
}
