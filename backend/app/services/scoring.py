from typing import Optional


POPULAR_SETS = {
    "topps series 1": 5.0,
    "topps chrome": 5.0,
    "topps finest": 4.8,
    "panini prizm": 5.0,
    "panini contenders": 4.5,
    "panini select": 4.3,
    "crown zenith": 4.8,
    "obsidian flames": 4.5,
    "evolving skies": 4.8,
    "fusion strike": 4.3,
    "paldea evolved": 4.2,
    "scarlet & violet": 4.5,
}


def _performance_momentum_score(market_data) -> float:
    """
    Uses recent price trend as a proxy for player performance momentum.
    Maps -20%..+20% price change over last 14 days → 0..5 pts.
    Replace with a real stats API when available.
    """
    if not market_data or not market_data.price_history:
        return 2.5
    history = sorted(market_data.price_history, key=lambda x: x.get("date", ""))
    if len(history) < 14:
        return 2.5
    recent_7 = [p["price"] for p in history[-7:] if "price" in p]
    prior_7 = [p["price"] for p in history[-14:-7] if "price" in p]
    if not recent_7 or not prior_7:
        return 2.5
    recent_avg = sum(recent_7) / len(recent_7)
    prior_avg = sum(prior_7) / len(prior_7)
    if prior_avg == 0:
        return 2.5
    pct_change = (recent_avg - prior_avg) / prior_avg
    # +20% change → 5 pts, flat → 2.5 pts, -20% → 0 pts
    return min(5.0, max(0.0, 2.5 + pct_change * 12.5))


def _set_popularity_score(set_name: str) -> float:
    name_lower = set_name.lower()
    for key, score in POPULAR_SETS.items():
        if key in name_lower:
            return score
    return 3.5


def calculate_alpha_score(card, market_data) -> dict:
    """
    Calculate the Alpha Score (0–100) for a card based on market and card data.

    Returns a dict with:
      - total (int)
      - recommendation (str)
      - breakdown (dict of factor -> {score, max, value?})
    """
    breakdown = {}

    # 1. Below 90-day average (max 25)
    if market_data.price_90d_avg and market_data.price_90d_avg > 0:
        pct_below = (
            (market_data.price_90d_avg - market_data.current_price)
            / market_data.price_90d_avg
            * 100
        )
        score_90d = max(0.0, min(25.0, (pct_below / 50.0) * 25.0))
    else:
        pct_below = 0.0
        score_90d = 0.0
    breakdown["below_90d_avg"] = {
        "score": round(score_90d, 1),
        "max": 25,
        "value": round(pct_below, 1),
    }

    # 2. Below all-time high (max 20)
    if market_data.price_ath and market_data.price_ath > 0:
        pct_below_ath = (
            (market_data.price_ath - market_data.current_price)
            / market_data.price_ath
            * 100
        )
        score_ath = max(0.0, min(20.0, (pct_below_ath / 70.0) * 20.0))
    else:
        pct_below_ath = 0.0
        score_ath = 0.0
    breakdown["below_ath"] = {
        "score": round(score_ath, 1),
        "max": 20,
        "value": round(pct_below_ath, 1),
    }

    # 3. Volume momentum (max 15) — recent 7d vs prior 7d
    prior_7d = max((market_data.sales_volume_14d or 0) - (market_data.sales_volume_7d or 0), 0)
    if prior_7d > 0:
        momentum_ratio = (market_data.sales_volume_7d or 0) / prior_7d
    elif (market_data.sales_volume_7d or 0) > 0:
        momentum_ratio = 2.0
    else:
        momentum_ratio = 0.0
    score_momentum = min(15.0, momentum_ratio * 7.5)
    breakdown["volume_momentum"] = {
        "score": round(score_momentum, 1),
        "max": 15,
        "value": round(momentum_ratio, 2),
    }

    # 4. Rookie status (max 10)
    score_rookie = 10.0 if card.is_rookie else 0.0
    breakdown["rookie_status"] = {"score": score_rookie, "max": 10}

    # 5. Low population (max 10)
    pop = card.population
    if pop is None:
        score_pop = 5.0
    elif pop < 10:
        score_pop = 10.0
    elif pop < 25:
        score_pop = 8.0
    elif pop < 50:
        score_pop = 6.0
    elif pop < 100:
        score_pop = 4.0
    elif pop < 500:
        score_pop = 2.0
    else:
        score_pop = 0.0
    breakdown["low_population"] = {
        "score": score_pop,
        "max": 10,
        "value": pop,
    }

    # 6. Serial scarcity (max 10)
    sn = card.serial_number
    if sn is None:
        score_serial = 0.0
    elif sn <= 10:
        score_serial = 10.0
    elif sn <= 25:
        score_serial = 8.0
    elif sn <= 50:
        score_serial = 7.0
    elif sn <= 100:
        score_serial = 5.0
    elif sn <= 250:
        score_serial = 3.0
    else:
        score_serial = 1.0
    breakdown["serial_scarcity"] = {
        "score": score_serial,
        "max": 10,
        "value": sn,
    }

    # 7. Performance momentum (max 5) — price-trend proxy until real stats API
    score_perf = _performance_momentum_score(market_data)
    breakdown["performance_momentum"] = {"score": round(score_perf, 1), "max": 5}

    # 8. Set popularity (max 5)
    score_set = _set_popularity_score(card.set_name)
    breakdown["set_popularity"] = {"score": score_set, "max": 5}

    total = (
        score_90d
        + score_ath
        + score_momentum
        + score_rookie
        + score_pop
        + score_serial
        + score_perf
        + score_set
    )
    total = min(100, max(0, round(total)))

    if total >= 80:
        recommendation = "Strong Buy"
    elif total >= 65:
        recommendation = "Buy"
    elif total >= 50:
        recommendation = "Watch"
    else:
        recommendation = "Avoid"

    return {
        "total": total,
        "recommendation": recommendation,
        "breakdown": breakdown,
    }
