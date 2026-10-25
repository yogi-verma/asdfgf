# GridBricks backend

FastAPI backend for the wind forecast dashboard. The API is documented at `http://localhost:8000/docs` when running.

## Run locally

```powershell
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn app.main:app --reload
```

The health check is available at `http://localhost:8000/api/health`.

Generation routes:

- `GET /api/actual-generation?delivery_date=2026-01-15` fetches national WIND actuals from FUELHH.
- `GET /api/forecast-generation?delivery_date=2026-01-15&decision_time=23:59` fetches WINDFOR publications from the preceding day and returns the latest revision per target time available by the UTC cutoff.

WINDFOR is hourly while FUELHH is half-hourly in the returned data. The frontend averages each pair of FUELHH records to compare with hourly forecast values. Confirm the operational decision cutoff with the energy desk before using accuracy results as a production decision input.
