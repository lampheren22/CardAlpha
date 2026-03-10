import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.card import Card
from app.models.market_data import MarketData
from app.models.user import User
from app.auth import get_password_hash


def generate_price_history(
    days: int,
    start_price: float,
    peak_price: float,
    end_price: float,
    peak_day: int = None,
) -> list:
    """Generate realistic price history with a peak somewhere in the middle."""
    if peak_day is None:
        peak_day = int(days * 0.6)
    history = []
    base_date = datetime.utcnow() - timedelta(days=days)
    for i in range(days):
        date = base_date + timedelta(days=i)
        # Lerp from start → peak → end
        if i <= peak_day:
            t = i / peak_day if peak_day > 0 else 1
            price = start_price + (peak_price - start_price) * t
        else:
            t = (i - peak_day) / (days - peak_day) if (days - peak_day) > 0 else 1
            price = peak_price + (end_price - peak_price) * t
        # Add noise ±5%
        noise = price * random.uniform(-0.05, 0.05)
        price = max(1.0, round(price + noise, 2))
        volume = random.randint(0, 12)
        history.append({"date": date.strftime("%Y-%m-%d"), "price": price, "volume": volume})
    return history


CARDS_DATA = [
    # ── MLB ──────────────────────────────────────────────────────────────
    {
        "card": {
            "sport": "MLB",
            "player_name": "Paul Skenes",
            "set_name": "2024 Topps Series 1",
            "card_number": "330",
            "parallel_type": "Gold Refractor",
            "is_graded": True,
            "grade_company": "PSA",
            "grade": "10",
            "population": 18,
            "is_rookie": True,
            "serial_number": 50,
            "print_run": 50,
        },
        "market": {
            "current_price": 285.0,
            "price_7d_avg": 310.0,
            "price_30d_avg": 340.0,
            "price_90d_avg": 420.0,
            "price_ath": 650.0,
            "price_atl": 180.0,
            "sales_volume_7d": 8,
            "sales_volume_14d": 13,
            "sales_volume_30d": 25,
            "sell_through_rate": 82.0,
            "avg_days_to_sell": 2.1,
            "sales_per_week": 7.0,
        },
        "price_history": (380, 650, 285, 55),  # start, peak, end, peak_day
    },
    {
        "card": {
            "sport": "MLB",
            "player_name": "Jackson Holliday",
            "set_name": "2024 Topps Chrome",
            "card_number": "RC-12",
            "parallel_type": "Orange Refractor",
            "is_graded": False,
            "population": None,
            "is_rookie": True,
            "serial_number": 25,
            "print_run": 25,
        },
        "market": {
            "current_price": 88.0,
            "price_7d_avg": 95.0,
            "price_30d_avg": 110.0,
            "price_90d_avg": 145.0,
            "price_ath": 220.0,
            "price_atl": 55.0,
            "sales_volume_7d": 6,
            "sales_volume_14d": 9,
            "sales_volume_30d": 20,
            "sell_through_rate": 65.0,
            "avg_days_to_sell": 3.5,
            "sales_per_week": 4.5,
        },
        "price_history": (110, 220, 88, 50),
    },
    {
        "card": {
            "sport": "MLB",
            "player_name": "Gunnar Henderson",
            "set_name": "2024 Topps Finest",
            "card_number": "TF-GH",
            "parallel_type": "Gold Refractor",
            "is_graded": True,
            "grade_company": "PSA",
            "grade": "10",
            "population": 22,
            "is_rookie": False,
            "serial_number": 10,
            "print_run": 10,
        },
        "market": {
            "current_price": 340.0,
            "price_7d_avg": 355.0,
            "price_30d_avg": 390.0,
            "price_90d_avg": 450.0,
            "price_ath": 580.0,
            "price_atl": 210.0,
            "sales_volume_7d": 5,
            "sales_volume_14d": 8,
            "sales_volume_30d": 18,
            "sell_through_rate": 72.0,
            "avg_days_to_sell": 2.8,
            "sales_per_week": 4.5,
        },
        "price_history": (320, 580, 340, 60),
    },
    {
        "card": {
            "sport": "MLB",
            "player_name": "Elly De La Cruz",
            "set_name": "2024 Topps Chrome",
            "card_number": "RC-ELC",
            "parallel_type": "Aqua Refractor",
            "is_graded": True,
            "grade_company": "PSA",
            "grade": "10",
            "population": 31,
            "is_rookie": True,
            "serial_number": 25,
            "print_run": 25,
        },
        "market": {
            "current_price": 195.0,
            "price_7d_avg": 210.0,
            "price_30d_avg": 235.0,
            "price_90d_avg": 280.0,
            "price_ath": 420.0,
            "price_atl": 120.0,
            "sales_volume_7d": 7,
            "sales_volume_14d": 11,
            "sales_volume_30d": 24,
            "sell_through_rate": 78.0,
            "avg_days_to_sell": 2.4,
            "sales_per_week": 5.5,
        },
        "price_history": (220, 420, 195, 55),
    },
    {
        "card": {
            "sport": "MLB",
            "player_name": "Shohei Ohtani",
            "set_name": "2024 Topps Series 1",
            "card_number": "SO-1",
            "parallel_type": "Rainbow Foil",
            "is_graded": True,
            "grade_company": "PSA",
            "grade": "10",
            "population": 45,
            "is_rookie": False,
            "serial_number": 50,
            "print_run": 50,
        },
        "market": {
            "current_price": 450.0,
            "price_7d_avg": 470.0,
            "price_30d_avg": 510.0,
            "price_90d_avg": 620.0,
            "price_ath": 890.0,
            "price_atl": 280.0,
            "sales_volume_7d": 10,
            "sales_volume_14d": 15,
            "sales_volume_30d": 38,
            "sell_through_rate": 88.0,
            "avg_days_to_sell": 1.5,
            "sales_per_week": 8.5,
        },
        "price_history": (500, 890, 450, 65),
    },
    # ── NFL ──────────────────────────────────────────────────────────────
    {
        "card": {
            "sport": "NFL",
            "player_name": "Marvin Harrison Jr.",
            "set_name": "2024 Panini Contenders",
            "card_number": "PT-MH",
            "parallel_type": "Playoff Ticket",
            "is_graded": True,
            "grade_company": "PSA",
            "grade": "10",
            "population": 29,
            "is_rookie": True,
            "serial_number": 99,
            "print_run": 99,
        },
        "market": {
            "current_price": 175.0,
            "price_7d_avg": 188.0,
            "price_30d_avg": 210.0,
            "price_90d_avg": 260.0,
            "price_ath": 380.0,
            "price_atl": 100.0,
            "sales_volume_7d": 9,
            "sales_volume_14d": 14,
            "sales_volume_30d": 30,
            "sell_through_rate": 80.0,
            "avg_days_to_sell": 2.2,
            "sales_per_week": 6.5,
        },
        "price_history": (200, 380, 175, 58),
    },
    {
        "card": {
            "sport": "NFL",
            "player_name": "Jayden Daniels",
            "set_name": "2024 Panini Prizm",
            "card_number": "RC-JD",
            "parallel_type": "Green Ice",
            "is_graded": True,
            "grade_company": "BGS",
            "grade": "9.5",
            "population": 41,
            "is_rookie": True,
            "serial_number": None,
        },
        "market": {
            "current_price": 195.0,
            "price_7d_avg": 210.0,
            "price_30d_avg": 240.0,
            "price_90d_avg": 290.0,
            "price_ath": 420.0,
            "price_atl": 115.0,
            "sales_volume_7d": 8,
            "sales_volume_14d": 12,
            "sales_volume_30d": 28,
            "sell_through_rate": 78.0,
            "avg_days_to_sell": 2.6,
            "sales_per_week": 5.5,
        },
        "price_history": (220, 420, 195, 55),
    },
    {
        "card": {
            "sport": "NFL",
            "player_name": "Caleb Williams",
            "set_name": "2024 Panini Prizm",
            "card_number": "RC-CW",
            "parallel_type": "Silver Prizm",
            "is_graded": True,
            "grade_company": "PSA",
            "grade": "10",
            "population": 120,
            "is_rookie": True,
            "serial_number": None,
        },
        "market": {
            "current_price": 145.0,
            "price_7d_avg": 158.0,
            "price_30d_avg": 175.0,
            "price_90d_avg": 210.0,
            "price_ath": 320.0,
            "price_atl": 85.0,
            "sales_volume_7d": 11,
            "sales_volume_14d": 16,
            "sales_volume_30d": 35,
            "sell_through_rate": 75.0,
            "avg_days_to_sell": 2.0,
            "sales_per_week": 7.0,
        },
        "price_history": (170, 320, 145, 52),
    },
    {
        "card": {
            "sport": "NFL",
            "player_name": "Bo Nix",
            "set_name": "2024 Panini Prizm",
            "card_number": "RC-BN",
            "parallel_type": "Blue Wave",
            "is_graded": True,
            "grade_company": "PSA",
            "grade": "10",
            "population": 88,
            "is_rookie": True,
            "serial_number": None,
        },
        "market": {
            "current_price": 95.0,
            "price_7d_avg": 102.0,
            "price_30d_avg": 118.0,
            "price_90d_avg": 145.0,
            "price_ath": 200.0,
            "price_atl": 55.0,
            "sales_volume_7d": 7,
            "sales_volume_14d": 10,
            "sales_volume_30d": 22,
            "sell_through_rate": 68.0,
            "avg_days_to_sell": 3.2,
            "sales_per_week": 4.0,
        },
        "price_history": (115, 200, 95, 48),
    },
    {
        "card": {
            "sport": "NFL",
            "player_name": "Drake Maye",
            "set_name": "2024 Panini Contenders",
            "card_number": "CT-DM",
            "parallel_type": "Championship Ticket",
            "is_graded": False,
            "population": None,
            "is_rookie": True,
            "serial_number": 49,
            "print_run": 49,
        },
        "market": {
            "current_price": 220.0,
            "price_7d_avg": 238.0,
            "price_30d_avg": 265.0,
            "price_90d_avg": 310.0,
            "price_ath": 490.0,
            "price_atl": 130.0,
            "sales_volume_7d": 6,
            "sales_volume_14d": 10,
            "sales_volume_30d": 21,
            "sell_through_rate": 72.0,
            "avg_days_to_sell": 2.9,
            "sales_per_week": 4.5,
        },
        "price_history": (250, 490, 220, 60),
    },
    # ── Pokémon ──────────────────────────────────────────────────────────
    {
        "card": {
            "sport": "Pokemon",
            "player_name": "Charizard ex",
            "set_name": "2023 Obsidian Flames",
            "card_number": "215",
            "parallel_type": "Full Art",
            "is_graded": True,
            "grade_company": "PSA",
            "grade": "10",
            "population": 890,
            "is_rookie": False,
            "serial_number": None,
        },
        "market": {
            "current_price": 185.0,
            "price_7d_avg": 195.0,
            "price_30d_avg": 220.0,
            "price_90d_avg": 265.0,
            "price_ath": 380.0,
            "price_atl": 80.0,
            "sales_volume_7d": 15,
            "sales_volume_14d": 22,
            "sales_volume_30d": 55,
            "sell_through_rate": 85.0,
            "avg_days_to_sell": 1.2,
            "sales_per_week": 12.0,
        },
        "price_history": (200, 380, 185, 55),
    },
    {
        "card": {
            "sport": "Pokemon",
            "player_name": "Umbreon VMAX",
            "set_name": "2021 Evolving Skies",
            "card_number": "215",
            "parallel_type": "Alternate Art",
            "is_graded": True,
            "grade_company": "PSA",
            "grade": "10",
            "population": 410,
            "is_rookie": False,
            "serial_number": None,
        },
        "market": {
            "current_price": 320.0,
            "price_7d_avg": 338.0,
            "price_30d_avg": 370.0,
            "price_90d_avg": 480.0,
            "price_ath": 680.0,
            "price_atl": 180.0,
            "sales_volume_7d": 9,
            "sales_volume_14d": 13,
            "sales_volume_30d": 32,
            "sell_through_rate": 79.0,
            "avg_days_to_sell": 2.5,
            "sales_per_week": 5.5,
        },
        "price_history": (380, 680, 320, 60),
    },
    {
        "card": {
            "sport": "Pokemon",
            "player_name": "Pikachu VMAX",
            "set_name": "2022 Crown Zenith",
            "card_number": "GG-19",
            "parallel_type": "Galarian Gallery",
            "is_graded": True,
            "grade_company": "PSA",
            "grade": "10",
            "population": 620,
            "is_rookie": False,
            "serial_number": None,
        },
        "market": {
            "current_price": 95.0,
            "price_7d_avg": 100.0,
            "price_30d_avg": 115.0,
            "price_90d_avg": 140.0,
            "price_ath": 210.0,
            "price_atl": 45.0,
            "sales_volume_7d": 18,
            "sales_volume_14d": 25,
            "sales_volume_30d": 65,
            "sell_through_rate": 82.0,
            "avg_days_to_sell": 1.5,
            "sales_per_week": 11.0,
        },
        "price_history": (110, 210, 95, 52),
    },
    {
        "card": {
            "sport": "Pokemon",
            "player_name": "Rayquaza VMAX",
            "set_name": "2021 Evolving Skies",
            "card_number": "217",
            "parallel_type": "Alternate Art",
            "is_graded": True,
            "grade_company": "PSA",
            "grade": "10",
            "population": 520,
            "is_rookie": False,
            "serial_number": None,
        },
        "market": {
            "current_price": 245.0,
            "price_7d_avg": 260.0,
            "price_30d_avg": 295.0,
            "price_90d_avg": 365.0,
            "price_ath": 510.0,
            "price_atl": 130.0,
            "sales_volume_7d": 8,
            "sales_volume_14d": 12,
            "sales_volume_30d": 28,
            "sell_through_rate": 76.0,
            "avg_days_to_sell": 2.8,
            "sales_per_week": 5.0,
        },
        "price_history": (290, 510, 245, 58),
    },
    {
        "card": {
            "sport": "Pokemon",
            "player_name": "Mew VMAX",
            "set_name": "2022 Fusion Strike",
            "card_number": "269",
            "parallel_type": "Full Art",
            "is_graded": True,
            "grade_company": "PSA",
            "grade": "10",
            "population": 980,
            "is_rookie": False,
            "serial_number": None,
        },
        "market": {
            "current_price": 145.0,
            "price_7d_avg": 152.0,
            "price_30d_avg": 168.0,
            "price_90d_avg": 195.0,
            "price_ath": 280.0,
            "price_atl": 65.0,
            "sales_volume_7d": 12,
            "sales_volume_14d": 18,
            "sales_volume_30d": 45,
            "sell_through_rate": 74.0,
            "avg_days_to_sell": 2.0,
            "sales_per_week": 8.0,
        },
        "price_history": (165, 280, 145, 50),
    },
    {
        "card": {
            "sport": "Pokemon",
            "player_name": "Miraidon ex",
            "set_name": "2023 Scarlet & Violet",
            "card_number": "81",
            "parallel_type": "Special Illustration Rare",
            "is_graded": True,
            "grade_company": "PSA",
            "grade": "10",
            "population": 1200,
            "is_rookie": False,
            "serial_number": None,
        },
        "market": {
            "current_price": 78.0,
            "price_7d_avg": 83.0,
            "price_30d_avg": 95.0,
            "price_90d_avg": 115.0,
            "price_ath": 165.0,
            "price_atl": 35.0,
            "sales_volume_7d": 20,
            "sales_volume_14d": 28,
            "sales_volume_30d": 70,
            "sell_through_rate": 70.0,
            "avg_days_to_sell": 1.8,
            "sales_per_week": 10.0,
        },
        "price_history": (100, 165, 78, 48),
    },
    {
        "card": {
            "sport": "Pokemon",
            "player_name": "Gardevoir ex",
            "set_name": "2023 Scarlet & Violet",
            "card_number": "86",
            "parallel_type": "Special Illustration Rare",
            "is_graded": True,
            "grade_company": "PSA",
            "grade": "10",
            "population": 750,
            "is_rookie": False,
            "serial_number": None,
        },
        "market": {
            "current_price": 92.0,
            "price_7d_avg": 98.0,
            "price_30d_avg": 112.0,
            "price_90d_avg": 135.0,
            "price_ath": 190.0,
            "price_atl": 40.0,
            "sales_volume_7d": 14,
            "sales_volume_14d": 20,
            "sales_volume_30d": 52,
            "sell_through_rate": 72.0,
            "avg_days_to_sell": 1.9,
            "sales_per_week": 9.0,
        },
        "price_history": (108, 190, 92, 50),
    },
    {
        "card": {
            "sport": "Pokemon",
            "player_name": "Charizard ex",
            "set_name": "2023 Paldea Evolved",
            "card_number": "199",
            "parallel_type": "Special Illustration Rare",
            "is_graded": True,
            "grade_company": "PSA",
            "grade": "9",
            "population": 2100,
            "is_rookie": False,
            "serial_number": None,
        },
        "market": {
            "current_price": 45.0,
            "price_7d_avg": 48.0,
            "price_30d_avg": 55.0,
            "price_90d_avg": 68.0,
            "price_ath": 98.0,
            "price_atl": 20.0,
            "sales_volume_7d": 25,
            "sales_volume_14d": 35,
            "sales_volume_30d": 88,
            "sell_through_rate": 65.0,
            "avg_days_to_sell": 1.5,
            "sales_per_week": 12.0,
        },
        "price_history": (60, 98, 45, 45),
    },
]


def seed(db: Session):
    """Seed the database with initial data. Idempotent."""
    # Create admin user
    if not db.query(User).filter(User.email == "admin@cardalpha.com").first():
        admin = User(
            email="admin@cardalpha.com",
            username="admin",
            hashed_password=get_password_hash("admin123"),
            is_admin=True,
            tier="pro",
        )
        db.add(admin)

    # Create test user
    if not db.query(User).filter(User.email == "test@cardalpha.com").first():
        test_user = User(
            email="test@cardalpha.com",
            username="testuser",
            hashed_password=get_password_hash("test123"),
            tier="free",
        )
        db.add(test_user)

    db.commit()

    # Seed cards + market data
    for entry in CARDS_DATA:
        card_data = entry["card"]
        market_data = entry["market"]
        history_params = entry.get("price_history", (100, 200, 100, 45))

        # Check if card already exists
        existing = (
            db.query(Card)
            .filter(
                Card.player_name == card_data["player_name"],
                Card.set_name == card_data["set_name"],
                Card.parallel_type == card_data.get("parallel_type"),
            )
            .first()
        )
        if existing:
            continue

        card = Card(**card_data)
        db.add(card)
        db.flush()  # get card.id

        price_history = generate_price_history(
            days=90,
            start_price=history_params[0],
            peak_price=history_params[1],
            end_price=history_params[2],
            peak_day=history_params[3],
        )

        md = MarketData(
            card_id=card.id,
            price_history=price_history,
            **market_data,
        )
        db.add(md)

    db.commit()
