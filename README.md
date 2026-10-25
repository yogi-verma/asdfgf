# GridBricks · Energy intelligence

Full-stack dashboard for comparing UK day-ahead wind generation forecasts with observed generation. The recommended local run method is Docker Compose; see [Start with Docker Compose](#start-with-docker-compose). To develop without Docker, see [Run without Docker](#run-without-docker).

## Stack

- Frontend: React, Vite, Tailwind CSS, Recharts, Lucide React
- Backend: Python 3.12, FastAPI, Uvicorn, HTTPX, Pydantic

## GridBricks: purpose

GridBricks helps analysts compare Great Britain wind generation forecasts with delivered generation. Elexon BMRS publishes the relevant actuals and forecasts in separate datasets, at different time resolutions, and forecast publication time affects whether a forecast was available for a decision. This dashboard combines the data on a UTC timeline, calculates forecast accuracy, compares forecast revisions, and surfaces coverage and quality issues. It is an analysis aid, not a dispatch or trading system.

## Live deployment

- **Frontend:** [https://frontend-psi-teal-2hv7na20ud.vercel.app/](https://frontend-psi-teal-2hv7na20ud.vercel.app/)
- **Backend API:** [https://backend-u8pg.vercel.app/](https://backend-u8pg.vercel.app/)
- **Backend API documentation:** [https://backend-u8pg.vercel.app/docs](https://backend-u8pg.vercel.app/docs)

The production frontend uses the deployed backend URL by default. Set the Vercel frontend project’s `VITE_API_BASE_URL` environment variable to `https://backend-u8pg.vercel.app` if you want to configure it explicitly, then redeploy the frontend so Vite includes the value in its static build. Docker Compose overrides this with `/api` to use its Nginx reverse proxy; local Vite development falls back to `http://localhost:8000`.

## Features

- Overview dashboard with forecast/actual chart and summary metrics.
- MAE, RMSE, MAPE, and forecast bias metrics.
- Hourly comparison, forecast/source record tables, and CSV export.
- Forecast vintage comparison and accuracy breakdown by hour/output range.
- Historical backtesting with a previous-day, same-hour actual-generation baseline.
- Data quality view for interval coverage, matches, missing/duplicate timestamps, missing values, and freshness.
- Configurable MAE, coverage, and freshness alerts displayed in the dashboard.
- Optional five-minute auto-refresh.
- Alert preferences saved in this browser using `localStorage`; settings are not shared with other browsers or users.
- Docker Compose deployment of frontend and API.

## Data and metric definitions

| Dataset | Use | Resolution |
| --- | --- | --- |
| `WINDFOR` | Published wind generation forecasts | Hourly |
| `FUELHH` filtered to `WIND` | Observed wind generation | Half-hourly |

Available half-hourly actual generation is averaged into hourly values for comparison. Accuracy uses only hours with both forecast and actual values; matched coverage communicates how much data was scoreable. Forecast selection considers publication time and the previous-day decision cutoff, avoiding forecasts published after the decision time. Date selectors show the supported analysis window (the intended delivery dates are January 2026). All timestamps are UTC.

The backend queries Elexon directly; there is no durable upstream-data cache or historical database. Backtests therefore use the records Elexon returns at run time, and sparse days should be interpreted using displayed coverage and period counts.

For matched observations `i = 1…n`:

- **MAE:** mean `|forecastᵢ − actualᵢ|`, in MW. Lower is better.
- **RMSE:** square root of mean `(forecastᵢ − actualᵢ)²`, in MW; large misses have greater influence.
- **MAPE:** mean `|forecastᵢ − actualᵢ| / |actualᵢ| × 100`; zero-actual records are excluded.
- **Bias:** mean `forecastᵢ − actualᵢ`; positive means overforecast, negative means underforecast.
- **Matched coverage:** matched hourly observations divided by forecast-hour count.

Any MAE-based chart range is descriptive, not a calibrated confidence interval or probabilistic forecast. Alerts are in-app only; no email or push notification is sent.

## Architecture

```text
Browser → Nginx frontend (host port 3000) → /api proxy → FastAPI (host port 8000) → Elexon BMRS
```

React/Vite builds static files; Nginx serves them and forwards `/api/` to the Compose service `backend`. FastAPI validates queries and rows, then HTTPX calls Elexon asynchronously. Compose builds both services and waits for backend health before starting the frontend. There is no server-side database; only alert settings use browser storage.

## Requirements

**Docker (recommended):** Docker Desktop running with Compose v2 (`docker compose`) and internet access to `data.elexon.co.uk`. Host Python and Node are not needed; images use Python 3.12 and Node 22.

**Without Docker:** Python 3.12+, pip, Node.js 22+, npm, and internet access to Elexon.

## Start with Docker Compose

Run from the repository root, the directory containing `docker-compose.yml`:

```powershell
Set-Location C:\Users\suraj\OneDrive\Desktop\GridBricks
docker compose up --build -d
docker compose ps
```

First build downloads base images and installs dependencies. Open [Dashboard](http://localhost:3000), [API docs](http://localhost:8000/docs), or [OpenAPI/health endpoint](http://localhost:8000/openapi.json). The browser requests the frontend `/api` path; Nginx proxies it internally, so the browser does not resolve the Docker hostname.

### Common commands

Run in the repository root:

```powershell
docker compose ps
docker compose logs -f
docker compose logs -f frontend
docker compose logs -f backend
docker compose up --build -d
docker compose down
```

`down` removes containers and the Compose network, not source files. No database volume is defined. To choose host ports:

```powershell
$env:FRONTEND_PORT = "8080"
$env:BACKEND_PORT = "8001"
docker compose up --build -d
```

The app is then at `http://localhost:8080`, and the API is on host port 8001. These variables apply to the current PowerShell session; clear with `Remove-Item Env:FRONTEND_PORT, Env:BACKEND_PORT`.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `FRONTEND_PORT` | `3000` | Host port mapped to Nginx port 80. |
| `BACKEND_PORT` | `8000` | Host port mapped to FastAPI port 8000. |
| `VITE_API_BASE_URL` | Local Vite: `http://localhost:8000`; production build: `https://backend-u8pg.vercel.app`; Compose build: `/api` | Frontend API base URL. It can be set in Vercel project environment variables; Compose supplies `/api` at build time for the Nginx proxy. |

## Run without Docker

Use two PowerShell terminals from the repository root. In terminal 1:

```powershell
Set-Location .\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

In terminal 2:

```powershell
Set-Location C:\Users\suraj\OneDrive\Desktop\GridBricks\frontend
npm ci
npm run dev
```

Open Vite’s printed URL, normally `http://localhost:5173`. The frontend uses `http://localhost:8000` in development. From `frontend/`: `npm run dev` starts Vite, `npm run build` builds `dist/`, `npm run preview` previews the build, and `npm run lint` runs ESLint.

## API

`GET /datasets/FUELHH/stream` requires `settlementDateFrom` and `settlementDateTo` (`YYYY-MM-DD`); optional repeatable filters are `settlementPeriod` and `fuelType` (the dashboard uses `WIND`). Example: `http://localhost:8000/datasets/FUELHH/stream?settlementDateFrom=2026-01-01&settlementDateTo=2026-01-01&fuelType=WIND`.

`GET /datasets/WINDFOR/stream` requires timezone-aware ISO-8601 `publishDateTimeFrom` and `publishDateTimeTo`, for example `2026-01-01T00:00:00Z`. Invalid ranges/timezone-free publication bounds return HTTP 422; Elexon request or response failures return HTTP 502. `/docs` contains interactive API details.

## Repository layout and files

```text
GridBricks/
├── docker-compose.yml       # Connects, builds, health-checks, and publishes both services
├── .dockerignore            # Excludes irrelevant root build-context files
├── README.md                # Full project and operations guide
├── backend/
│   ├── Dockerfile           # Python image and Uvicorn startup
│   ├── .dockerignore        # Backend build-context exclusions
│   ├── requirements.txt     # Python dependencies
│   ├── README.md            # Backend-specific notes
│   └── app/
│       ├── __init__.py      # Python package marker
│       ├── main.py          # FastAPI app, routes, validation, CORS, errors
│       ├── schemas.py       # Pydantic source-row schemas
│       └── services/
│           ├── __init__.py  # Service package marker
│           └── elexon.py    # Async Elexon client and UTC formatting
└── frontend/
    ├── Dockerfile           # Node build stage and Nginx runtime image
    ├── .dockerignore        # Frontend build-context exclusions
    ├── nginx.conf           # Static hosting, SPA fallback, API reverse proxy
    ├── index.html           # Vite HTML entry point
    ├── package.json         # Scripts and JS dependencies
    ├── package-lock.json    # Locked npm dependency versions
    ├── vite.config.js       # Vite and React plugin config
    ├── eslint.config.js     # ESLint configuration
    ├── README.md            # Frontend starter notes
    ├── public/              # Static favicon.svg and icons.svg
    └── src/
        ├── main.jsx         # React mount point
        ├── App.jsx          # Dashboard shell, fetching, UTC/date/page state
        ├── index.css        # Global styling and Tailwind entry
        ├── assets/          # hero.png and starter SVG assets
        └── components/
            ├── headers/     # Topbar.jsx, PageToolbar.jsx
            ├── sidebar/     # Sidebar.jsx navigation/workspace
            ├── ui/          # Loader.jsx shared loading indicator
            └── dashboard/   # Dashboard-specific components (listed below)
```

Dashboard components: `MetricCard.jsx` reusable KPI; `GenerationPanel.jsx` chart and controls; `HourlyTable.jsx` comparison and export; `ForecastTable.jsx` forecast records; `AccuracyPanel.jsx` summary, bias, coverage; `AccuracyBreakdown.jsx` grouped error; `VintageComparison.jsx` forecast revisions; `SourceDataView.jsx` raw source rows and docs links; `DataQualityView.jsx` quality/freshness indicators; `BacktestView.jsx` historical scoring and baseline; `AlertSettings.jsx` browser-local thresholds, alerts, auto-refresh.

Shared shell components: `Sidebar.jsx` navigation, `Topbar.jsx` app bar, `PageToolbar.jsx` page heading/controls, and `Loader.jsx` loading state. Public assets are copied as-is by Vite; imported assets live under `src/assets/`.

## Troubleshooting

**`docker` is not recognized:** start Docker Desktop. If it was installed after PowerShell opened, reopen the terminal so `PATH` refreshes. Check `docker --version` and `docker compose version`.

**`no configuration file provided`:** Compose cannot find the file in the current directory. Run `Set-Location C:\Users\suraj\OneDrive\Desktop\GridBricks` then `docker compose up --build -d`, or pass `-f C:\Users\suraj\OneDrive\Desktop\GridBricks\docker-compose.yml`.

**Page does not open:** check Docker Desktop, `docker compose ps`, and `docker compose logs -f`. A port conflict may prevent startup; choose another `FRONTEND_PORT`/`BACKEND_PORT`. Rebuild with `docker compose up --build -d` after changing source or Docker files.

**Page opens without data:** backend needs internet access to Elexon. Inspect `docker compose logs -f backend` and `/docs`. Elexon may be unavailable or return no rows for a date; upstream failures appear as HTTP 502.

## Limitations and data source

The Vercel URLs above are the current deployment addresses; if Vercel assigns new URLs, update the production API fallback in `frontend/src/App.jsx` and `frontend/src/components/dashboard/BacktestView.jsx`, the allowed frontend origin in `backend/app/main.py`, and this section. Elexon availability and data determine results. There is no server database, historical archive, or external alert delivery. Public source: [Elexon BMRS](https://data.elexon.co.uk/bmrs); API references: [FUELHH](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream) and [WINDFOR](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream).
