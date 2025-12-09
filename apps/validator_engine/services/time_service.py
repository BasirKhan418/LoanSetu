from typing import List
from datetime import datetime, timedelta
from models.request_models import MediaItem


def run_time_checks(media: List[MediaItem], time_rules: dict, sanction_date: str = None):
    """
    Validate time-based rules:
    - Check if photos are taken within allowed days after sanction
    - Check if photos are taken before sanction (if not allowed)
    """
    flags: list[str] = []
    features: dict = {}

    if not sanction_date:
        return {"flags": flags, "features": features}

    try:
        sanction_dt = datetime.fromisoformat(sanction_date.replace("Z", "+00:00"))
    except Exception:
        flags.append("INVALID_SANCTION_DATE")
        return {"flags": flags, "features": features}

    max_days_after = time_rules.get("max_days_after_sanction", 30)
    allow_before_sanction = time_rules.get("allow_before_sanction", False)

    earliest_capture = None
    latest_capture = None

    for m in media:
        if not m.capturedAt:
            continue

        try:
            captured_dt = datetime.fromisoformat(m.capturedAt.replace("Z", "+00:00"))

            if earliest_capture is None or captured_dt < earliest_capture:
                earliest_capture = captured_dt
            if latest_capture is None or captured_dt > latest_capture:
                latest_capture = captured_dt

            # Check if before sanction
            if captured_dt < sanction_dt and not allow_before_sanction:
                flags.append("PHOTO_BEFORE_SANCTION")

            # Check if too late after sanction
            days_after = (captured_dt - sanction_dt).days
            if days_after > max_days_after:
                flags.append("PHOTO_TOO_LATE")

        except Exception:
            continue

    if earliest_capture:
        features["earliest_capture_date"] = earliest_capture.isoformat()
        features["latest_capture_date"] = latest_capture.isoformat() if latest_capture else None
        features["sanction_date"] = sanction_dt.isoformat()
        
        days_diff = (earliest_capture - sanction_dt).days
        features["days_after_sanction"] = days_diff

    return {"flags": flags, "features": features}
