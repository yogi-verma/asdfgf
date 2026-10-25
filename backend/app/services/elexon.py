from datetime import date, datetime, timezone
from typing import Any

import httpx

ELEXON_BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1"
REQUEST_TIMEOUT = httpx.Timeout(45.0, connect=10.0)


class ElexonUpstreamError(Exception):
    """Raised when the Elexon API cannot provide a usable response."""


async def _get_rows(path: str, params: dict[str, Any]) -> list[dict[str, Any]]:
    url = f"{ELEXON_BASE_URL}{path}"
    try:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            payload = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise ElexonUpstreamError(f"Elexon request failed: {exc}") from exc

    if not isinstance(payload, list):
        raise ElexonUpstreamError("Elexon returned an unexpected response format.")
    return payload


async def get_fuelhh_rows(
    settlement_date_from: date,
    settlement_date_to: date,
    settlement_period: list[int] | None = None,
    fuel_type: list[str] | None = None,
) -> list[dict[str, Any]]:
    """Proxy the documented FUELHH stream query and preserve its row shape."""
    params: dict[str, Any] = {
        "settlementDateFrom": settlement_date_from.isoformat(),
        "settlementDateTo": settlement_date_to.isoformat(),
    }
    if settlement_period:
        params["settlementPeriod"] = settlement_period
    if fuel_type:
        params["fuelType"] = fuel_type
    return await _get_rows("/datasets/FUELHH/stream", params)


async def get_wind_forecast_rows(
    publish_date_time_from: datetime, publish_date_time_to: datetime
) -> list[dict[str, Any]]:
    """Proxy the documented WINDFOR stream query and preserve its row shape."""
    if publish_date_time_from.tzinfo is None or publish_date_time_to.tzinfo is None:
        raise ValueError("WINDFOR publication bounds must include a timezone.")
    return await _get_rows(
        "/datasets/WINDFOR/stream",
        {
            "publishDateTimeFrom": publish_date_time_from.astimezone(timezone.utc)
            .isoformat(timespec="milliseconds")
            .replace("+00:00", "Z"),
            "publishDateTimeTo": publish_date_time_to.astimezone(timezone.utc)
            .isoformat(timespec="milliseconds")
            .replace("+00:00", "Z"),
        },
    )
