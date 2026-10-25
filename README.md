# GridBricks · Energy intelligence

React, Tailwind CSS, and FastAPI starter for a UK day-ahead wind generation forecast and accuracy dashboard.

## Run locally

Open two PowerShell terminals from the repository root.

Backend terminal:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

Frontend terminal:

```powershell
cd frontend
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs

The backend mirrors Elexon's `/datasets/FUELHH/stream` and `/datasets/WINDFOR/stream` endpoints with the documented query parameters and row-array responses. The frontend selects WIND actuals and the latest forecast revision for the chosen delivery day, then computes the displayed accuracy metrics. The intended delivery dates are in January 2026.

## Stack

- Frontend: React, Vite, Tailwind CSS, Recharts, Lucide React
- Backend: Python 3.11, FastAPI, Uvicorn, HTTPX, Pydantic Settings, pandas
