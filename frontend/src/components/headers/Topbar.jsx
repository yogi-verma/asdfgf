import { Bell, Menu, Search } from 'lucide-react'

export default function Topbar({ page, onMenu, error }) {
  return (
    <header className="sticky top-0 z-30 h-[52px] border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="flex h-full items-center justify-between px-4 sm:px-6 xl:px-8">
        <div className="flex min-w-0 items-center gap-2.5">
          <button onClick={onMenu} aria-label="Open menu" className="grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100 lg:hidden"><Menu size={17} /></button>
          <p className="truncate text-[11px] text-slate-400">GridBricks <span className="mx-1 text-slate-300">/</span><span className="font-semibold text-slate-700">{page === 'Overview' ? 'Market overview' : page}</span></p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`hidden h-7 items-center gap-1.5 rounded-md border px-2.5 text-[10px] font-medium sm:inline-flex ${error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-100 bg-emerald-50 text-emerald-700'}`}><span className={`h-1.5 w-1.5 rounded-full ${error ? 'bg-rose-500' : 'bg-emerald-500'}`} />{error ? 'Connection issue' : 'Elexon BMRS'}</span>
          <button aria-label="Search" className="grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100"><Search size={16} /></button>
          <button aria-label="Notifications" className="relative grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100"><Bell size={16} /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-white" /></button>
          <span className="ml-1 grid h-7 w-7 place-items-center rounded-full border border-slate-200 bg-white text-[9px] font-bold text-slate-600">GB</span>
        </div>
      </div>
    </header>
  )
}
