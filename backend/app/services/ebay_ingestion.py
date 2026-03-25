"""
eBay Data Ingestion Service

Fetches sold listings from the eBay Finding API and stores them in the
sales table after normalization, deduplication, and outlier removal.

Setup:
  1. Register at https://developer.ebay.com and create an app.
  2. Set EBAY_APP_ID in your .env file.
  3. Call ingest_card_sales(query, db) from a cron job or admin endpoint.
"""

import os
import httpx
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from app.services.normalization import normalize_card_title, match_to_card, clean_listings

EBAY_APP_ID = os.getenv("EBAY_APP_ID", "")
EBAY_FINDING_URL = "https://svcs.ebay.com/services/search/FindingService/v1"


async def fetch_sold_listings(query: str, days_back: int = 7) -> list[dict]:
    """
    Fetch completed (sold) eBay listings for a search query.
    Returns a list of raw listing dicts.

    Requires EBAY_APP_ID environment variable.
    """
    if not EBAY_APP_ID:
        raise ValueError(
            "EBAY_APP_ID not set. Get a free key at https://developer.ebay.com"
        )

    end_time_from = (
        datetime.now(timezone.utc) - timedelta(days=days_back)
    ).strftime("%Y-%m-%dT%H:%M:%S.000Z")

    params = {
        "OPERATION-NAME": "findCompletedItems",
        "SERVICE-VERSION": "1.0.0",
        "SECURITY-APPNAME": EBAY_APP_ID,
        "RESPONSE-DATA-FORMAT": "JSON",
        "keywords": query,
        "itemFilter(0).name": "SoldItemsOnly",
        "itemFilter(0).value": "true",
        "itemFilter(1).name": "EndTimeFrom",
        "itemFilter(1).value": end_time_from,
        "sortOrder": "EndTimeSoonest",
        "paginationInput.entriesPerPage": "100",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(EBAY_FINDING_URL, params=params)
        resp.raise_for_status()
        data = resp.json()

    try:
        items = (
            data["findCompletedItemsResponse"][0]
            ["searchResult"][0]
            .get("item", [])
        )
    except (KeyError, IndexError):
        return []

    return [_parse_ebay_item(item) for item in items if _is_valid_item(item)]


def _is_valid_item(item: dict) -> bool:
    """Filter out multi-item lots, pre-orders, and non-card listings."""
    title = item.get("title", [""])[0].upper()
    # Exclude obvious non-singles
    for keyword in ("LOT", "BUNDLE", "REPACK", "BREAK", "CASE"):
        if keyword in title:
            return False
    return True


def _parse_ebay_item(item: dict) -> dict:
    """Extract relevant fields from a raw eBay API item."""
    price_str = (
        item.get("sellingStatus", [{}])[0]
        .get("currentPrice", [{}])[0]
        .get("__value__", "0")
    )
    end_time_str = (
        item.get("listingInfo", [{}])[0]
        .get("endTime", ["1970-01-01T00:00:00.000Z"])[0]
    )
    condition = (
        item.get("condition", [{}])[0]
        .get("conditionDisplayName", [None])[0]
    )
    return {
        "raw_title": item.get("title", [""])[0],
        "sale_price": float(price_str),
        "sale_date": datetime.fromisoformat(end_time_str.replace("Z", "+00:00")),
        "ebay_item_id": item.get("itemId", [""])[0],
        "condition": condition,
        "source": "ebay",
    }


async def ingest_card_sales(query: str, db: Session, days_back: int = 7) -> dict:
    """
    Full ingestion pipeline for a search query:
      1. Fetch sold listings from eBay
      2. Normalize each title
      3. Match to a card in our DB
      4. Deduplicate + flag outliers
      5. Insert new sales records

    Returns a summary dict: {fetched, inserted, skipped_duplicate, skipped_outlier, unmatched}
    """
    from app.models.sale import Sale

    raw_listings = await fetch_sold_listings(query, days_back=days_back)

    # Normalize and enrich
    enriched = []
    for listing in raw_listings:
        normalized = normalize_card_title(listing["raw_title"])
        card = match_to_card(normalized, db)
        enriched.append({
            **listing,
            "normalized_key": normalized.normalized_key,
            "card_id": card.id if card else None,
        })

    enriched = clean_listings(enriched)

    stats = {
        "fetched": len(enriched),
        "inserted": 0,
        "skipped_duplicate": 0,
        "skipped_outlier": 0,
        "unmatched": 0,
    }

    for item in enriched:
        # Skip outliers (still store them flagged)
        if item.get("is_outlier"):
            stats["skipped_outlier"] += 1

        if not item.get("card_id"):
            stats["unmatched"] += 1

        # Check for duplicate by eBay item ID
        existing = (
            db.query(Sale)
            .filter(Sale.ebay_item_id == item["ebay_item_id"])
            .first()
        )
        if existing:
            stats["skipped_duplicate"] += 1
            continue

        sale = Sale(
            card_id=item.get("card_id"),
            raw_title=item["raw_title"],
            normalized_key=item["normalized_key"],
            sale_price=item["sale_price"],
            sale_date=item["sale_date"],
            condition=item.get("condition"),
            source=item.get("source", "ebay"),
            ebay_item_id=item["ebay_item_id"],
            is_outlier=item.get("is_outlier", False),
        )
        db.add(sale)
        stats["inserted"] += 1

    db.commit()
    return stats
