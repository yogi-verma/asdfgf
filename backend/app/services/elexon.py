from datetime import date, datetime, time, timedelta, timezone
from typing import Any

import httpx

ELEXON_BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1"
REQUEST_TIMEOUT = httpx.Timeout(45.0, connect=10.0)


class ElexonUpstreamError(Exception):
    """Raised when the Elexon API cannot provide a usable response."""


async def _get_rows(path: str, params: dict[str, str]) -> list[dict[str, Any]]:
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


async def get_wind_actuals(delivery_date: date) -> list[dict[str, Any]]:
    """Fetch half-hourly GB wind outturn for one settlement date."""
    return await _get_rows(
        "/datasets/FUELHH/stream",
        {
            "settlementDateFrom": delivery_date.isoformat(),
            "settlementDateTo": delivery_date.isoformat(),
            "fuelType": "WIND",
        },
    )


async def get_wind_forecast(
    delivery_date: date, decision_time: time
) -> tuple[list[dict[str, Any]], datetime]:
    """Select the latest WINDFOR revision available by the D-1 cutoff.

    WINDFOR is filtered upstream by publication time. We request publications
    from midnight on D-1 through the supplied cutoff, then retain rows whose
    target startTime falls on the requested delivery date.
    """
    publication_date = delivery_date - timedelta(days=1)
    cutoff = datetime.combine(publication_date, decision_time, tzinfo=timezone.utc)
    from_time = datetime.combine(publication_date, time.min, tzinfo=timezone.utc)
    rows = await _get_rows(
        "/datasets/WINDFOR/stream",
        {
            "publishDateTimeFrom": from_time.isoformat().replace("+00:00", "Z"),
            "publishDateTimeTo": cutoff.isoformat().replace("+00:00", "Z"),
        },
    )

    latest_by_start: dict[str, dict[str, Any]] = {}
    for row in rows:
        start_time = row.get("startTime")
        publish_time = row.get("publishTime")
        if not start_time or not publish_time:
            continue
        try:
            target_time = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
            published_at = datetime.fromisoformat(publish_time.replace("Z", "+00:00"))
        except (AttributeError, ValueError):
            continue
        if target_time.date() != delivery_date or published_at > cutoff:
            continue
        current = latest_by_start.get(start_time)
        if current is None or publish_time > current["publishTime"]:
            latest_by_start[start_time] = row

    return sorted(latest_by_start.values(), key=lambda row: row["startTime"]), cutoff
