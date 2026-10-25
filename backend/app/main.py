from datetime import date, datetime

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import FuelHHRow, WindForecastRow
from app.services.elexon import (
    ElexonUpstreamError,
    get_fuelhh_rows,
    get_wind_forecast_rows,
)

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


@app.get(
    "/datasets/FUELHH/stream",
    tags=["Elexon generation"],
    response_model=list[FuelHHRow],
)
async def fuelhh_stream(
    settlementDateFrom: date = Query(description="Settlement date lower bound (YYYY-MM-DD)"),
    settlementDateTo: date = Query(description="Settlement date upper bound (YYYY-MM-DD)"),
    settlementPeriod: list[int] | None = Query(default=None, description="Settlement periods to include"),
    fuelType: list[str] | None = Query(default=None, description="Fuel types to include, for example WIND"),
) -> list[FuelHHRow]:
    """Pass through the Elexon FUELHH stream using its documented query contract."""
    if settlementDateFrom > settlementDateTo:
        raise HTTPException(status_code=422, detail="settlementDateFrom must be on or before settlementDateTo.")
    try:
        rows = await get_fuelhh_rows(settlementDateFrom, settlementDateTo, settlementPeriod, fuelType)
    except ElexonUpstreamError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return [FuelHHRow.model_validate(row) for row in rows]


@app.get(
    "/datasets/WINDFOR/stream",
    tags=["Elexon generation"],
    response_model=list[WindForecastRow],
)
async def windfor_stream(
    publishDateTimeFrom: datetime = Query(description="Publication time lower bound (ISO 8601)"),
    publishDateTimeTo: datetime = Query(description="Publication time upper bound (ISO 8601)"),
) -> list[WindForecastRow]:
    """Pass through the Elexon WINDFOR stream using its documented query contract."""
    if publishDateTimeFrom.tzinfo is None or publishDateTimeTo.tzinfo is None:
        raise HTTPException(status_code=422, detail="Publication bounds must include a timezone, for example Z.")
    if publishDateTimeFrom > publishDateTimeTo:
        raise HTTPException(status_code=422, detail="publishDateTimeFrom must be before publishDateTimeTo.")
    try:
        rows = await get_wind_forecast_rows(publishDateTimeFrom, publishDateTimeTo)
    except ElexonUpstreamError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return [WindForecastRow.model_validate(row) for row in rows]
