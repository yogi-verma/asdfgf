import { Activity, Gauge, LayoutDashboard, MoreHorizontal, Settings2, ShieldCheck, Wind, X } from 'lucide-react'

const primaryLinks = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Wind forecasts', icon: Wind },
  { label: 'Forecast accuracy', icon: Gauge },
]
const dataLinks = [
  { label: 'Elexon BMRS', icon: Activity },
  { label: 'Data quality', icon: ShieldCheck },
]

function NavigationLink({ item, active, onClick }) {
  const Icon = item.icon
  return (
    <button onClick={onClick} className={`group flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[12px] font-medium transition ${active ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}>
      <Icon size={16} className={active ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'} />
      <span className="flex-1">{item.label}</span>
      {active && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
    </button>
  )
}

export default function Sidebar({ active, onNavigate, open, onClose, loading, error }) {
  return (
    <>
      {open && <button aria-label="Close navigation" onClick={onClose} className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[1px] lg:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[224px] flex-col border-r border-white/5 bg-[#101b2b] px-3 py-4 text-white shadow-2xl transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:translate-x-0 lg:shadow-none ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-10 items-center justify-between px-1.5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-400 text-[#0b1726]"><Wind size={17} strokeWidth={2.5} /></span>
            <span><span className="block text-[14px] font-semibold tracking-tight">gridbricks</span><span className="block text-[8px] font-semibold uppercase tracking-[0.17em] text-slate-500">Energy intelligence</span></span>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-white/10 lg:hidden" aria-label="Close menu"><X size={17} /></button>
        </div>

        <nav className="mt-7" aria-label="Main navigation">
          <p className="mb-2 px-2.5 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">Workspace</p>
          <div className="space-y-1">{primaryLinks.map((item) => <NavigationLink key={item.label} item={item} active={active === item.label} onClick={() => { onNavigate(item.label); onClose() }} />)}</div>
          <p className="mb-2 mt-6 px-2.5 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">Data</p>
          <div className="space-y-1">{dataLinks.map((item) => <NavigationLink key={item.label} item={item} active={active === item.label} onClick={() => { onNavigate(item.label); onClose() }} />)}</div>
        </nav>

        <div className="mt-auto">
          <div className="rounded-lg border border-white/[0.07] bg-white/[0.04] p-3">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-200"><span className={`h-1.5 w-1.5 rounded-full ${loading ? 'animate-pulse bg-amber-400' : error ? 'bg-rose-400' : 'bg-emerald-400'}`} />{loading ? 'Connecting to Elexon' : error ? 'Connection issue' : 'Elexon connected'}</div>
            <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">National wind · FUELHH + WINDFOR</p>
          </div>
          <button className="mt-2 flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[11px] font-medium text-slate-400 hover:bg-white/5 hover:text-white"><Settings2 size={15} />Settings</button>
          <div className="mt-2 flex items-center gap-2 border-t border-white/10 px-1.5 pt-3">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-700 text-[10px] font-bold">GB</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold">GridBricks workspace</span><span className="block text-[9px] text-slate-500">UK power desk</span></span>
            <MoreHorizontal size={15} className="text-slate-500" />
          </div>
        </div>
      </aside>
    </>
  )
}
