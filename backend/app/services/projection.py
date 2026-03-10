def calculate_projection(card, market_data, alpha_score: dict) -> dict:
    """
    Calculate the upside projection and risk rating for a card.
    """
    current = market_data.current_price
    avg_90d = market_data.price_90d_avg or current
    ath = market_data.price_ath or current

    fair_value_low = avg_90d * 0.90
    fair_value_high = avg_90d * 1.10
    conservative_exit = avg_90d * 1.00
    aggressive_exit = (ath + avg_90d) / 2 * 1.05

    if current > 0:
        estimated_roi = ((conservative_exit - current) / current) * 100
    else:
        estimated_roi = 0.0

    # Risk rating
    sell_through = market_data.sell_through_rate or 0
    vol_7d = market_data.sales_volume_7d or 0
    pop = card.population

    if sell_through >= 70 and (pop is None or pop < 100):
        risk_rating = "Low"
    elif sell_through < 40 or vol_7d < 2:
        risk_rating = "High"
    else:
        risk_rating = "Medium"

    return {
        "fair_value_low": round(fair_value_low, 2),
        "fair_value_high": round(fair_value_high, 2),
        "conservative_exit": round(conservative_exit, 2),
        "aggressive_exit": round(aggressive_exit, 2),
        "estimated_roi": round(estimated_roi, 1),
        "risk_rating": risk_rating,
    }
