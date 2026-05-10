"""
AI categorization service.
Primary: OpenAI GPT-4o-mini
Fallback: keyword classifier (no API cost, works offline)
"""
import re
from typing import Tuple
from app.config import settings
from app.models.complaint import Category, Severity

# Keyword → Category mapping for fallback
_KEYWORD_MAP = {
    Category.road: ["pothole", "road", "street", "pavement", "footpath", "traffic", "signal", "bridge", "crack"],
    Category.water: ["water", "pipe", "leak", "sewage", "drain", "flood", "tap", "supply", "overflow"],
    Category.electricity: ["electricity", "power", "electric", "light", "pole", "wire", "blackout", "transformer"],
    Category.sanitation: ["garbage", "waste", "trash", "litter", "dumping", "smell", "clean", "sweeping", "bin"],
    Category.safety: ["crime", "robbery", "unsafe", "danger", "threat", "harassment", "fire", "accident"],
}

_SEVERITY_KEYWORDS = {
    Severity.P1: ["emergency", "urgent", "critical", "accident", "fire", "flood", "collapse", "death", "injured"],
    Severity.P2: ["major", "severe", "broken", "no water", "no electricity", "blackout", "blocked"],
    Severity.P3: ["damaged", "leaking", "bad", "issue", "problem", "complaint"],
}


def _keyword_classify(text: str) -> Tuple[Category, Severity]:
    text_lower = text.lower()

    category = Category.other
    best_score = 0
    for cat, keywords in _KEYWORD_MAP.items():
        score = sum(1 for kw in keywords if kw in text_lower)
        if score > best_score:
            best_score = score
            category = cat

    severity = Severity.P4
    for sev, keywords in _SEVERITY_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            severity = sev
            break

    return category, severity


async def classify(text: str) -> Tuple[Category, Severity]:
    """Return (category, severity). Tries OpenAI first, falls back to keyword classifier."""
    if settings.OPENAI_API_KEY:
        try:
            return await _openai_classify(text)
        except Exception:
            pass
    return _keyword_classify(text)


async def _openai_classify(text: str) -> Tuple[Category, Severity]:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    prompt = f"""Classify this citizen complaint into exactly one category and one severity.

Complaint: "{text}"

Categories: Road, Water, Electricity, Sanitation, Safety, Other
Severity: P1 (emergency/life threat), P2 (major disruption), P3 (moderate issue), P4 (minor issue)

Reply with exactly two words separated by a comma, e.g.: Road, P2"""

    response = await client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=10,
        temperature=0,
    )
    raw = response.choices[0].message.content.strip()
    parts = [p.strip() for p in raw.split(",")]
    category = Category(parts[0])
    severity = Severity(parts[1])
    return category, severity
