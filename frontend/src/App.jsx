import { useEffect, useMemo, useState } from 'react'
import { Activity, Clock3, Gauge, Wind, Zap } from 'lucide-react'
import Sidebar from './components/sidebar/Sidebar.jsx'
import Topbar from './components/headers/Topbar.jsx'
import PageToolbar from './components/headers/PageToolbar.jsx'
import MetricCard from './components/dashboard/MetricCard.jsx'
import GenerationPanel from './components/dashboard/GenerationPanel.jsx'
import AccuracyPanel from './components/dashboard/AccuracyPanel.jsx'
import HourlyTable from './components/dashboard/HourlyTable.jsx'
import ForecastTable from './components/dashboard/ForecastTable.jsx'
import SourceDataView from './components/dashboard/SourceDataView.jsx'
import DataQualityView from './components/dashboard/DataQualityView.jsx'
import BacktestView from './components/dashboard/BacktestView.jsx'
import VintageComparison from './components/dashboard/VintageComparison.jsx'
import AlertSettings from './components/dashboard/AlertSettings.jsx'
import AccuracyBreakdown from './components/dashboard/AccuracyBreakdown.jsx'
import { FullScreenLoader } from './components/ui/Loader.jsx'

const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://backend-u8pg.vercel.app' : 'http://localhost:8000')

function asNumber(value) {
  return value === null || value === undefined ? null : Number(value)
}

function formatMW(value) {
  return value === null || !Number.isFinite(value) ? '—' : Math.round(value).toLocaleString('en-GB')
}

function average(values) {
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : null
}

function selectDeliveryForecasts(rows, deliveryDate, cutoff) {
  const latestByStart = new Map()
  rows.forEach((row) => {
    if (!row.startTime || !row.publishTime) return
    const target = new Date(row.startTime)
    const published = new Date(row.publishTime)
    if (!Number.isFinite(target.getTime()) || !Number.isFinite(published.getTime())) return
    if (target.toISOString().slice(0, 10) !== deliveryDate || published > new Date(cutoff)) return
    const current = latestByStart.get(row.startTime)
    if (!current || published > new Date(current.publishTime)) latestByStart.set(row.startTime, row)
  })
  return [...latestByStart.values()].sort((left, right) => left.startTime.localeCompare(right.startTime))
}

function makeComparison(actualRows, forecastRows) {
  const actualByHour = new Map()
  actualRows.forEach((row) => {
    const value = asNumber(row.generation)
    if (value === null) return
    const hour = new Date(row.startTime).toISOString().slice(0, 13) + ':00:00Z'
    actualByHour.set(hour, [...(actualByHour.get(hour) || []), value])
  })

  return forecastRows.map((row) => {
    const date = new Date(row.startTime)
    const key = date.toISOString().slice(0, 13) + ':00:00Z'
    const values = actualByHour.get(key) || []
    const actual = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null
    const forecast = asNumber(row.generation)
    const difference = actual === null || forecast === null ? null : forecast - actual
    return {
      key,
      time: date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }),
      forecast,
      actual,
      difference,
      absoluteError: difference === null ? null : Math.abs(difference),
      absolutePercentageError: actual === null || forecast === null || actual === 0 ? null : Math.abs(difference / actual) * 100,
    }
  })
}

async function getJson(url, signal) {
  const response = await fetch(url, { signal })
  const result = await response.json()
  if (!response.ok) throw new Error(result.detail || `Request failed (${response.status})`)
  return result
}

function exportCsv(rows, date) {
  const headings = 'deliveryDate,timeUtc,forecastMw,actualHourlyMeanMw,differenceMw,absoluteErrorMw,absolutePercentageError'
  const body = rows.map((row) => [date, row.time, row.forecast ?? '', row.actual ?? '', row.difference ?? '', row.absoluteError ?? '', row.absolutePercentageError ?? ''].join(','))
  const url = URL.createObjectURL(new Blob([[headings, ...body].join('\n')], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `gridbricks-wind-${date}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export default function App() {
  const [page, setPage] = useState('Overview')
  const [date, setDate] = useState('2026-01-15')
  const [decisionTime, setDecisionTime] = useState('23:59')
  const [menuOpen, setMenuOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [actualRows, setActualRows] = useState([])
  const [forecastRows, setForecastRows] = useState([])
  const [rawForecastRows, setRawForecastRows] = useState([])
  const [forecastMetadata, setForecastMetadata] = useState(null)
  const [dataFetchedAt, setDataFetchedAt] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [loading, setLoading] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      setLoading(true)
      setError('')
      try {
        const cutoffDate = new Date(`${date}T00:00:00.000Z`)
        cutoffDate.setUTCDate(cutoffDate.getUTCDate() - 1)
        const publicationStart = new Date(cutoffDate)
        publicationStart.setUTCDate(publicationStart.getUTCDate() - 1)
        const publishDateTimeFrom = publicationStart.toISOString()
        const publishDateTimeTo = `${cutoffDate.toISOString().slice(0, 10)}T${decisionTime}:00.000Z`
        const forecastUrl = new URL(`${API_BASE}/datasets/WINDFOR/stream`, window.location.origin)
        forecastUrl.searchParams.set('publishDateTimeFrom', publishDateTimeFrom)
        forecastUrl.searchParams.set('publishDateTimeTo', publishDateTimeTo)
        const actualUrl = new URL(`${API_BASE}/datasets/FUELHH/stream`, window.location.origin)
        actualUrl.searchParams.set('settlementDateFrom', date)
        actualUrl.searchParams.set('settlementDateTo', date)
        actualUrl.searchParams.set('fuelType', 'WIND')
        const [actualRowsFromElexon, forecastRowsFromElexon] = await Promise.all([
          getJson(actualUrl.toString(), controller.signal),
          getJson(forecastUrl.toString(), controller.signal),
        ])
        const cutoff = new Date(publishDateTimeTo)
        const selectedForecasts = selectDeliveryForecasts(forecastRowsFromElexon, date, cutoff)
        const latestPublishTime = selectedForecasts.reduce((latest, row) => !latest || row.publishTime > latest ? row.publishTime : latest, null)
        setActualRows(actualRowsFromElexon.filter((row) => row.fuelType === 'WIND'))
        setForecastRows(selectedForecasts)
        setRawForecastRows(forecastRowsFromElexon)
        setForecastMetadata({ latestPublishTime, decisionCutoff: publishDateTimeTo })
        setDataFetchedAt(new Date().toISOString())
      } catch (loadError) {
        if (loadError.name !== 'AbortError') {
          setError(loadError.message || 'Could not load Elexon generation data.')
          setActualRows([])
          setForecastRows([])
          setRawForecastRows([])
          setForecastMetadata(null)
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
          setHasLoaded(true)
        }
      }
    }
    load()
    return () => controller.abort()
  }, [date, decisionTime, refreshKey])

  useEffect(() => {
    if (!autoRefresh) return undefined
    const timer = setInterval(() => setRefreshKey((key) => key + 1), 5 * 60 * 1000)
    return () => clearInterval(timer)
  }, [autoRefresh])

  const rows = useMemo(() => makeComparison(actualRows, forecastRows), [actualRows, forecastRows])
  const matched = useMemo(() => rows.filter((row) => row.actual !== null && row.forecast !== null), [rows])
  const metrics = useMemo(() => {
    const forecastMean = average(rows.map((row) => row.forecast).filter((value) => value !== null))
    const actualMean = average(matched.map((row) => row.actual))
    const mae = average(matched.map((row) => row.absoluteError))
    const rmse = matched.length ? Math.sqrt(average(matched.map((row) => row.difference ** 2))) : null
    const mape = average(matched.map((row) => row.absolutePercentageError).filter((value) => value !== null))
    const bias = average(matched.map((row) => row.difference))
    const buckets = [0, 0, 0, 0]
    matched.forEach((row) => {
      if (row.absolutePercentageError === null) return
      const index = row.absolutePercentageError < 2 ? 0 : row.absolutePercentageError < 5 ? 1 : row.absolutePercentageError < 10 ? 2 : 3
      buckets[index] += 1
    })
    const forecastValues = forecastRows.map((row) => asNumber(row.generation)).filter((value) => value !== null)
    return { forecastMean, actualMean, mae, rmse, mape, bias, buckets, forecastPeak: forecastValues.length ? Math.max(...forecastValues) : null }
  }, [rows, matched, forecastRows])
  const publishTime = forecastMetadata?.latestPublishTime
    ? new Date(forecastMetadata.latestPublishTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
    : '—'
  const deliveryLabel = new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

  if (loading && !hasLoaded) return <FullScreenLoader label="Loading wind generation data from Elexon…" />

  return (
    <div className="grid h-dvh grid-cols-1 overflow-hidden bg-[#f6f8f7] text-slate-900 antialiased lg:grid-cols-[248px_minmax(0,1fr)]">
      <Sidebar active={page} onNavigate={setPage} open={menuOpen} onClose={() => setMenuOpen(false)} loading={loading} error={error} />
      <main className="h-dvh min-h-0 min-w-0 overflow-y-auto overscroll-contain">
        <Topbar page={page} onMenu={() => setMenuOpen(true)} error={error} loading={loading} />
        <div className="mx-auto w-full max-w-[1640px] px-5 py-7 sm:px-8 sm:py-8 2xl:px-10">
          <PageToolbar
            page={page}
            date={date}
            decisionTime={decisionTime}
            onDateChange={setDate}
            onDecisionTimeChange={setDecisionTime}
            onRefresh={() => setRefreshKey((key) => key + 1)}
            onExport={() => exportCsv(rows, date)}
            disabledExport={!rows.length}
            loading={loading}
            error={error}
            apiBase={API_BASE}
          />

          {page === 'Overview' && <>
            <section aria-label="Daily wind generation summary" className="mt-6 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
              <MetricCard icon={Wind} label="Average forecast" value={formatMW(metrics.forecastMean)} unit="MW" note="WINDFOR · selected day" />
              <MetricCard icon={Zap} label="Average actual" value={formatMW(metrics.actualMean)} unit="MW" note="Matched hourly periods" tone="blue" />
              <MetricCard icon={Gauge} label="Mean absolute error" value={formatMW(metrics.mae)} unit="MW" note={`${matched.length} matched periods`} tone="amber" />
              <MetricCard icon={Clock3} label="Latest publication" value={publishTime} unit="UTC" note={`Cutoff ${decisionTime} · day before delivery`} tone="blue" />
            </section>
            <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
              <GenerationPanel rows={rows} dateLabel={deliveryLabel} publishTime={publishTime} loading={loading} error={error} mae={metrics.mae} matchedCount={matched.length} confidenceError={metrics.mae} onViewAccuracy={() => setPage('Forecast accuracy')} />
              <AccuracyPanel mape={metrics.mape} bias={metrics.bias} matched={matched} total={rows.length} buckets={metrics.buckets} />
            </div>
            <HourlyTable rows={rows} dateLabel={deliveryLabel} loading={loading} onExport={() => exportCsv(rows, date)} />
          </>}

          {page === 'Wind forecasts' && <>
            <section aria-label="Wind forecast summary" className="mt-6 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard icon={Wind} label="Average forecast" value={formatMW(metrics.forecastMean)} unit="MW" note="Selected delivery day" />
              <MetricCard icon={Zap} label="Peak forecast" value={formatMW(metrics.forecastPeak)} unit="MW" note="Highest WINDFOR period" tone="blue" />
              <MetricCard icon={Clock3} label="Latest publication" value={publishTime} unit="UTC" note={`Decision cutoff ${decisionTime}`} tone="amber" />
              <MetricCard icon={Activity} label="Forecast periods" value={forecastRows.length} unit="hours" note="Hourly WINDFOR records" tone="blue" />
            </section>
            <div className="mt-4"><GenerationPanel rows={rows} dateLabel={deliveryLabel} publishTime={publishTime} loading={loading} error={error} mae={metrics.mae} matchedCount={matched.length} confidenceError={metrics.mae} onViewAccuracy={() => setPage('Forecast accuracy')} /></div>
            <VintageComparison rawRows={rawForecastRows} actualRows={actualRows} deliveryDate={date} cutoff={decisionTime} />
            <ForecastTable rows={forecastRows} dateLabel={deliveryLabel} loading={loading} />
          </>}

          {page === 'Forecast accuracy' && <>
            <section aria-label="Forecast accuracy summary" className="mt-6 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard icon={Gauge} label="Mean absolute error" value={formatMW(metrics.mae)} unit="MW" note="Average absolute difference" tone="amber" />
              <MetricCard icon={Activity} label="Root mean square error" value={formatMW(metrics.rmse)} unit="MW" note="Penalises larger misses" tone="blue" />
              <MetricCard icon={Wind} label="Mean absolute percentage" value={metrics.mape === null ? '—' : metrics.mape.toFixed(1)} unit="%" note="Excludes zero actual values" />
              <MetricCard icon={Zap} label="Forecast bias" value={metrics.bias === null ? '—' : `${metrics.bias > 0 ? '+' : ''}${formatMW(metrics.bias)}`} unit="MW" note="Positive means over-forecast" tone="blue" />
            </section>
            <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
              <GenerationPanel rows={rows} dateLabel={deliveryLabel} publishTime={publishTime} loading={loading} error={error} mae={metrics.mae} matchedCount={matched.length} confidenceError={metrics.mae} onViewAccuracy={() => setPage('Overview')} />
              <AccuracyPanel mape={metrics.mape} bias={metrics.bias} matched={matched} total={rows.length} buckets={metrics.buckets} />
            </div>
            <HourlyTable rows={rows} dateLabel={deliveryLabel} loading={loading} onExport={() => exportCsv(rows, date)} />
            <AccuracyBreakdown rows={matched} />
          </>}

          {page === 'Backtesting' && <BacktestView decisionTime={decisionTime} />}

          {page === 'Elexon BMRS' && <SourceDataView actualRows={actualRows} forecastRows={forecastRows} dateLabel={deliveryLabel} decisionTime={decisionTime} loading={loading} />}
          {page === 'Data quality' && <DataQualityView actualRows={actualRows} forecastRows={forecastRows} comparison={rows} matched={matched} loading={loading} fetchedAt={dataFetchedAt} forecastPublishedAt={forecastMetadata?.latestPublishTime} />}
          {page !== 'Backtesting' && <AlertSettings mae={metrics.mae} coverage={rows.length ? matched.length / rows.length * 100 : 0} loading={loading} fetchedAt={dataFetchedAt} onAutoRefreshChange={setAutoRefresh} />}
          <footer className="flex flex-col gap-2 py-5 text-[10px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <span>GridBricks · Energy decisions, made clearer.</span>
            <span>Source: Elexon BMRS · All timestamps in UTC</span>
          </footer>
        </div>
      </main>
    </div>
  )
}
