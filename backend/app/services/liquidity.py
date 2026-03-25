def calculate_liquidity(market_data) -> dict:
    """
    Evaluate liquidity metrics for a card.
    Returns rating (Low/Medium/High), numeric score (0-100), and raw stats.
    """
    sales_30d = market_data.sales_volume_30d or 0
    sales_7d = market_data.sales_volume_7d or 0
    sell_through = market_data.sell_through_rate or 0
    per_week = market_data.sales_per_week or 0
    avg_days = market_data.avg_days_to_sell

    # Weighted numeric score (0-100)
    volume_score = min(sales_30d / 20 * 50, 50)          # max 50 pts: 20+ sales/month = full
    sell_through_score = (sell_through / 100) * 30        # max 30 pts
    speed_score = 0.0
    if avg_days is not None and avg_days >= 0:
        speed_score = max(0.0, 20.0 - avg_days)           # max 20 pts: sells in <1 day = full
    numeric = int(min(100, volume_score + sell_through_score + speed_score))

    buy_box = sell_through >= 70 and per_week >= 3

    if numeric >= 65:
        liquidity_rating = "High"
    elif numeric >= 35:
        liquidity_rating = "Medium"
    else:
        liquidity_rating = "Low"

    return {
        "liquidity_score": liquidity_rating,
        "liquidity_numeric": numeric,
        "avg_days_to_sell": avg_days,
        "sales_per_week": per_week,
        "sales_30d": sales_30d,
        "buy_box": buy_box,
    }
