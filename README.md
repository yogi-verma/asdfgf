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

The API exposes `/api/actual-generation?delivery_date=YYYY-MM-DD` and `/api/forecast-generation?delivery_date=YYYY-MM-DD&decision_time=HH:MM`. The forecast cutoff is UTC on the day before delivery and defaults to `23:59`.

## Stack

- Frontend: React, Vite, Tailwind CSS, Recharts, Lucide React
- Backend: Python 3.11, FastAPI, Uvicorn, HTTPX, Pydantic Settings, pandas
