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
    <button onClick={onClick} aria-current={active ? 'page' : undefined} className={`group relative flex h-10 w-full items-center gap-2.5 rounded-xl px-3 text-left text-[11px] font-medium transition ${active ? 'bg-[#eaf0fa] text-[#244574] shadow-sm shadow-slate-900/[0.04]' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
      <Icon size={17} strokeWidth={1.8} className={active ? 'text-[#416da9]' : 'text-slate-400 group-hover:text-slate-700'} />
      <span className="flex-1">{item.label}</span>
      {active && <span className="h-1.5 w-1.5 rounded-full bg-[#4f78bb]" />}
    </button>
  )
}

export default function Sidebar({ active, onNavigate, open, onClose, loading, error }) {
  return (
    <>
      {open && <button aria-label="Close navigation" onClick={onClose} className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[1px] lg:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-[248px] flex-col border-r border-slate-200/80 bg-white px-4 py-4 text-slate-900 shadow-2xl transition-transform duration-200 lg:sticky lg:top-0 lg:h-dvh lg:min-h-0 lg:overflow-y-auto lg:translate-x-0 lg:shadow-none ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-11 items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#254574] text-white shadow-sm shadow-blue-950/15"><Wind size={20} strokeWidth={2.1} /></span>
            <span><span className="block text-[14px] font-semibold tracking-tight text-[#1b3153]">gridbricks</span><span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.13em] text-slate-400">Energy intelligence</span></span>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 lg:hidden" aria-label="Close menu"><X size={17} /></button>
        </div>

        <nav className="mt-5" aria-label="Main navigation">
          <p className="mb-2 px-3 text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400">Workspace</p>
          <div className="space-y-0.5">{primaryLinks.map((item) => <NavigationLink key={item.label} item={item} active={active === item.label} onClick={() => { onNavigate(item.label); onClose() }} />)}</div>
          <p className="mb-2 mt-4 px-3 text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400">Data</p>
          <div className="space-y-0.5">{dataLinks.map((item) => <NavigationLink key={item.label} item={item} active={active === item.label} onClick={() => { onNavigate(item.label); onClose() }} />)}</div>
        </nav>

        <div className="mt-auto">
          <div className="rounded-xl border border-slate-200 bg-[#f7f9fc] p-3">
            <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-700"><span className={`h-2 w-2 rounded-full ${loading ? 'animate-pulse bg-amber-400' : error ? 'bg-rose-500' : 'bg-emerald-500'}`} />{loading ? 'Connecting to Elexon' : error ? 'Connection issue' : 'Elexon connected'}</div>
            <p className="mt-1.5 text-[9px] leading-relaxed text-slate-500">National wind · FUELHH + WINDFOR</p>
          </div>
          <div className="mt-2 flex items-center gap-2.5 border-t border-slate-200 px-1 pt-3">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#eaf0fa] text-[10px] font-bold text-[#355b91]">GB</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-semibold text-slate-700">GridBricks workspace</span><span className="block text-[9px] text-slate-400">UK power desk</span></span>
            <MoreHorizontal size={15} className="text-slate-500" />
          </div>
        </div>
      </aside>
    </>
  )
}
