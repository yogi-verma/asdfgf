from datetime import date, datetime

from pydantic import BaseModel


class FuelHHRow(BaseModel):
    dataset: str | None = None
    publishTime: datetime | None = None
    startTime: datetime | None = None
    settlementDate: date | None = None
    settlementPeriod: int | None = None
    fuelType: str | None = None
    generation: float | None = None


class WindForecastRow(BaseModel):
    dataset: str | None = None
    publishTime: datetime
    startTime: datetime
    generation: float | None = None


