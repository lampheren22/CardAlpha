def calculate_liquidity(market_data) -> dict:
    """
    Evaluate liquidity metrics for a card.
    """
    avg_days = market_data.avg_days_to_sell
    per_week = market_data.sales_per_week or 0
    sell_through = market_data.sell_through_rate or 0

    buy_box = sell_through >= 70 and per_week >= 3

    if sell_through >= 70 and per_week >= 5:
        liquidity_rating = "High"
    elif sell_through >= 50 and per_week >= 2:
        liquidity_rating = "Medium"
    else:
        liquidity_rating = "Low"

    return {
        "avg_days_to_sell": avg_days,
        "sales_per_week": per_week,
        "buy_box": buy_box,
        "liquidity_rating": liquidity_rating,
    }
