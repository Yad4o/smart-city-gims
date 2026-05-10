import random
import string
from datetime import datetime


def generate_ticket_id() -> str:
    """Generate human-readable ticket IDs like GRV-2025-00042."""
    year = datetime.utcnow().year
    suffix = "".join(random.choices(string.digits, k=5))
    return f"GRV-{year}-{suffix}"
