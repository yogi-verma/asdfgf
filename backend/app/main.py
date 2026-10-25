from datetime import date, time

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app.services.elexon import ElexonUpstreamError, get_wind_actuals, get_wind_forecast

app = FastAPI(
    title="GridBricks Energy API",
    description="API for GB wind generation forecasts and forecast accuracy.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", tags=["system"])
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "gridbricks-api"}


@app.get("/api/actual-generation", tags=["Elexon generation"])
async def actual_generation(
    delivery_date: date = Query(description="Settlement date in YYYY-MM-DD format"),
) -> dict:
    """Return FUELHH national wind generation for a settlement date."""
    try:
        rows = await get_wind_actuals(delivery_date)
    except ElexonUpstreamError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return {
        "deliveryDate": delivery_date.isoformat(),
        "source": "Elexon BMRS FUELHH",
        "resolutionMinutes": 30,
        "rows": rows,
    }


@app.get("/api/forecast-generation", tags=["Elexon generation"])
async def forecast_generation(
    delivery_date: date = Query(description="Delivery date in YYYY-MM-DD format"),
    decision_time: time = Query(
        default=time(23, 59),
        description="Latest acceptable forecast publication time on D-1, in UTC (HH:MM)",
    ),
) -> dict:
    """Return the latest WINDFOR value per target time published by the D-1 cutoff."""
    if decision_time.tzinfo is not None:
        raise HTTPException(status_code=422, detail="decision_time must be a UTC clock time (HH:MM).")
    try:
        rows, cutoff = await get_wind_forecast(delivery_date, decision_time)
    except ElexonUpstreamError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    latest_publish = max((row["publishTime"] for row in rows), default=None)
    return {
        "deliveryDate": delivery_date.isoformat(),
        "source": "Elexon BMRS WINDFOR",
        "resolutionMinutes": 60,
        "decisionCutoff": cutoff.isoformat().replace("+00:00", "Z"),
        "latestPublishTime": latest_publish,
        "selectionRule": "Latest publication on D-1 at or before decision_time, per target startTime",
        "rows": rows,
    }
