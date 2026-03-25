"""
Card Normalization Engine

Converts messy listing titles like "Mahomes Prizm Silver PSA 10 /99"
into structured fields: player_name, set_name, parallel_type, grade, etc.

Tiers:
  1. Rule-based parser (this file) — works immediately, no training data needed
  2. Fuzzy matcher against cards table — match_to_card()
  3. ML upgrade (future): fine-tune sentence transformer on (raw_title, card_id) pairs
"""

import re
from dataclasses import dataclass
from difflib import SequenceMatcher
from typing import Optional


# ---------------------------------------------------------------------------
# Grade patterns — ordered most-specific first
# ---------------------------------------------------------------------------
_GRADE_PATTERNS = [
    (r"BGS\s*10", "BGS", "10"),
    (r"BGS\s*9\.5", "BGS", "9.5"),
    (r"BGS\s*9(?!\.)", "BGS", "9"),
    (r"PSA\s*10", "PSA", "10"),
    (r"PSA\s*9(?!\.)", "PSA", "9"),
    (r"PSA\s*8(?!\.)", "PSA", "8"),
    (r"SGC\s*10", "SGC", "10"),
    (r"SGC\s*9(?!\.)", "SGC", "9"),
    (r"CGC\s*10", "CGC", "10"),
    (r"CGC\s*9(?!\.)", "CGC", "9"),
]

# ---------------------------------------------------------------------------
# Parallel type keywords — ordered longest first to avoid partial matches
# ---------------------------------------------------------------------------
_PARALLEL_KEYWORDS = [
    ("prizm silver", "Prizm Silver"),
    ("silver prizm", "Prizm Silver"),
    ("gold prizm", "Prizm Gold"),
    ("prizm gold", "Prizm Gold"),
    ("prizm", "Prizm"),
    ("holo rare", "Holo Rare"),
    ("holo", "Holo"),
    ("refractor", "Refractor"),
    ("autograph", "Auto"),
    ("auto rpa", "RPA"),
    ("rpa", "RPA"),
    ("auto", "Auto"),
    ("rookie card", "Rookie"),
    ("rc", "Rookie"),
]

_SERIAL_RE = re.compile(r"#?\s*(\d+)\s*/\s*(\d+)")
_YEAR_RE = re.compile(r"\b(19|20)\d{2}\b")
_NOISE_RE = re.compile(
    r"\b(card|trading|sports|collectible|mint|gem|near|lot|bundle|set|pack)\b",
    re.IGNORECASE,
)


@dataclass
class NormalizedCard:
    player_name: Optional[str]
    set_name: Optional[str]
    year: Optional[str]
    parallel_type: Optional[str]
    grade_company: Optional[str]
    grade: Optional[str]
    serial_number: Optional[int]   # e.g. 23 from "23/99"
    print_run: Optional[int]        # e.g. 99 from "23/99"
    normalized_key: str             # slug used for dedup / fuzzy matching


def normalize_card_title(raw: str) -> NormalizedCard:
    """Parse a raw card listing title into structured fields."""
    text = raw.strip()

    # 1. Extract grade
    grade_company, grade = None, None
    for pattern, company, g in _GRADE_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            grade_company, grade = company, g
            text = re.sub(pattern, "", text, flags=re.IGNORECASE)
            break

    # 2. Extract serial number  e.g. "23/99" or "#23/99"
    serial_number, print_run = None, None
    m = _SERIAL_RE.search(text)
    if m:
        serial_number = int(m.group(1))
        print_run = int(m.group(2))
        text = _SERIAL_RE.sub("", text)

    # 3. Extract year
    year = None
    ym = _YEAR_RE.search(text)
    if ym:
        year = ym.group(0)
        text = text.replace(year, "")

    # 4. Extract parallel type (longest match wins)
    parallel_type = None
    text_lower = text.lower()
    for keyword, label in _PARALLEL_KEYWORDS:
        if keyword in text_lower:
            parallel_type = label
            # Remove the matched keyword from text (case-insensitive)
            text = re.sub(re.escape(keyword), "", text, flags=re.IGNORECASE)
            break

    # 5. Remove noise words
    text = _NOISE_RE.sub("", text)

    # 6. Clean up whitespace
    parts = [p.strip() for p in text.split() if p.strip()]

    # Heuristic: first 2 tokens = player name, remainder = set
    player_name = " ".join(parts[:2]).title() if len(parts) >= 2 else " ".join(parts).title()
    set_name = " ".join(parts[2:]).title() if len(parts) > 2 else None

    # 7. Build normalized key for dedup / fuzzy matching
    key_parts = [
        player_name.lower().replace(" ", "-") if player_name else "",
        (parallel_type or "").lower().replace(" ", "-"),
        (grade_company or "").lower(),
        (grade or "").replace(".", ""),
    ]
    normalized_key = "-".join(p for p in key_parts if p)

    return NormalizedCard(
        player_name=player_name or None,
        set_name=set_name or None,
        year=year,
        parallel_type=parallel_type,
        grade_company=grade_company,
        grade=grade,
        serial_number=serial_number,
        print_run=print_run,
        normalized_key=normalized_key,
    )


def match_to_card(normalized: NormalizedCard, db) -> Optional[object]:
    """
    Fuzzy-match a NormalizedCard against the cards table.
    Returns the best-matching Card ORM object, or None if no confident match.

    Scoring:
      - Player name similarity (0–1): weight 0.6
      - Grade match (exact):          weight 0.3
      - Parallel match (contains):    weight 0.1

    A match is returned only when the combined score > 0.75.
    """
    from app.models.card import Card  # local import to avoid circular deps

    if not normalized.player_name:
        return None

    first_name = normalized.player_name.split()[0]
    candidates = (
        db.query(Card)
        .filter(Card.player_name.ilike(f"%{first_name}%"))
        .all()
    )

    best_score, best_card = 0.0, None
    for card in candidates:
        name_sim = SequenceMatcher(
            None,
            normalized.player_name.lower(),
            card.player_name.lower(),
        ).ratio()

        grade_match = (
            1.0
            if (
                normalized.grade == card.grade
                and normalized.grade_company == card.grade_company
            )
            else 0.0
        )

        parallel_match = (
            0.5
            if (
                normalized.parallel_type
                and card.parallel_type
                and normalized.parallel_type.lower() in card.parallel_type.lower()
            )
            else 0.0
        )

        score = name_sim * 0.6 + grade_match * 0.3 + parallel_match * 0.1
        if score > best_score:
            best_score, best_card = score, card

    return best_card if best_score > 0.75 else None


def clean_listings(sales: list[dict]) -> list[dict]:
    """
    Deduplicate by ebay_item_id and flag price outliers using IQR.
    Input: list of sale dicts with keys: ebay_item_id, sale_price, ...
    Returns: same list with is_outlier field set.
    """
    # Dedup
    seen: set[str] = set()
    unique = []
    for s in sales:
        item_id = s.get("ebay_item_id", "")
        if item_id not in seen:
            seen.add(item_id)
            unique.append(s)

    if len(unique) < 3:
        for s in unique:
            s["is_outlier"] = False
        return unique

    prices = sorted(s["sale_price"] for s in unique)
    q1 = prices[len(prices) // 4]
    q3 = prices[3 * len(prices) // 4]
    iqr = q3 - q1
    lower = q1 - 2.5 * iqr
    upper = q3 + 2.5 * iqr

    for s in unique:
        s["is_outlier"] = not (lower <= s["sale_price"] <= upper)

    return unique
