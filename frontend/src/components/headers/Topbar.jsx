import { Menu } from 'lucide-react'
import { Loader } from '../ui/Loader.jsx'

export default function Topbar({ page, onMenu, error, loading }) {
  return (
    <header className="sticky top-0 z-30 h-[58px] border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between px-4 sm:px-6 2xl:px-8">
        <div className="flex min-w-0 items-center gap-2.5">
          <button onClick={onMenu} aria-label="Open menu" className="grid h-8 w-8 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 lg:hidden"><Menu size={16} /></button>
          <p className="truncate text-[12px] text-slate-400">GridBricks <span className="mx-2 text-slate-300">/</span><span className="font-semibold text-[#284b79]">{page === 'Overview' ? 'Market overview' : page}</span></p>
        </div>
        <div className="flex items-center gap-3">
          {loading && <Loader label="Syncing" className="hidden sm:inline-flex" />}
          <span className={`inline-flex h-8 items-center gap-2 rounded-full border px-3 text-[11px] font-semibold ${error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-100 bg-emerald-50/80 text-emerald-700'}`}>
            <span className={`h-2 w-2 rounded-full ${loading ? 'animate-pulse bg-amber-500' : error ? 'bg-rose-500' : 'bg-emerald-500'}`} />{error ? 'Elexon unavailable' : loading ? 'Updating Elexon' : 'Elexon BMRS connected'}
          </span>
        </div>
      </div>
    </header>
  )
}
