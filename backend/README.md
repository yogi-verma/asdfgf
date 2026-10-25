# GridBricks backend

FastAPI backend for the wind forecast dashboard. The API is documented at `http://localhost:8000/docs` when running.

## Run locally

```powershell
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn app.main:app --reload
```

Generation routes:

- `GET /datasets/FUELHH/stream?settlementDateFrom=2026-01-15&settlementDateTo=2026-01-15&fuelType=WIND` proxies Elexon's FUELHH stream with the same settlement date and fuel type parameters, returning its generation records as an array.
- `GET /datasets/WINDFOR/stream?publishDateTimeFrom=2026-01-13T00:00:00.000Z&publishDateTimeTo=2026-01-14T23:59:00.000Z` proxies Elexon's WINDFOR stream with the same query parameter names and row-array response contract. It searches back to D-2 00:00 UTC so the frontend can select the latest revision for each delivery period by the D-1 decision cutoff.

The frontend compares hourly WINDFOR values with the mean of the available half-hourly FUELHH records to display MAE, RMSE, MAPE, forecast bias, and data coverage.
