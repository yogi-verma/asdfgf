const spinnerSizes = {
  sm: 'h-3 w-3 border-[1.5px]',
  md: 'h-4 w-4 border-2',
  lg: 'h-5 w-5 border-2',
}

export function Loader({ label = 'Loading…', size = 'sm', className = '', tone = 'emerald' }) {
  const spinnerTone = tone === 'light' ? 'border-white/50 border-t-white' : 'border-emerald-200 border-t-emerald-600'
  return (
    <span role="status" aria-live="polite" className={`inline-flex items-center gap-2 text-[10px] font-medium text-slate-500 ${className}`}>
      <span aria-hidden="true" className={`shrink-0 animate-spin rounded-full ${spinnerSizes[size] || spinnerSizes.sm} ${spinnerTone} motion-reduce:animate-none`} />
      <span>{label}</span>
    </span>
  )
}

export function LoadingPanel({ label = 'Loading data…' }) {
  return (
    <div role="status" aria-live="polite" className="flex h-full min-h-[150px] flex-col items-center justify-center gap-3 rounded-lg bg-slate-50/70 px-5 text-center">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200/70"><span aria-hidden="true" className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-100 border-t-emerald-600 motion-reduce:animate-none" /></span>
      <span className="text-[11px] font-semibold text-slate-700">{label}</span>
      <span className="h-1 w-24 overflow-hidden rounded-full bg-slate-200"><span className="block h-full w-1/2 animate-pulse rounded-full bg-emerald-400" /></span>
    </div>
  )
}

export function FullScreenLoader({ label = 'Preparing your workspace' }) {
  return (
    <div role="status" aria-live="polite" aria-label={label} className="fixed inset-0 z-[100] grid place-items-center bg-[#f4f7f6] px-4">
      <div className="flex min-w-[230px] flex-col items-center rounded-2xl border border-slate-200/80 bg-white px-9 py-8 shadow-[0_16px_48px_rgba(15,23,42,0.08)]">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#284b79] shadow-lg shadow-blue-900/20">
          <span aria-hidden="true" className="h-6 w-6 animate-spin rounded-full border-[3px] border-white/35 border-t-white motion-reduce:animate-none" />
        </span>
        <p className="mt-4 text-sm font-semibold tracking-tight text-slate-800">GridBricks</p>
        <p className="mt-1 text-[11px] text-slate-500">{label}</p>
        <span className="mt-5 h-1 w-28 overflow-hidden rounded-full bg-slate-100"><span className="block h-full w-1/2 animate-pulse rounded-full bg-emerald-400" /></span>
      </div>
    </div>
  )
}
