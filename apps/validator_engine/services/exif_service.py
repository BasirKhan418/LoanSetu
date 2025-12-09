from typing import List
from models.request_models import MediaItem


def run_exif_checks(media: List[MediaItem], rules: dict):
    flags: list[str] = []
    features: dict = {
        "exif_any_present": False,
        "exif_any_gps_present": False
    }

    require_exif_gps = rules.get("gps_rules", {}).get("require_exif_gps", False)

    for item in media:
        if "image" not in item.mimeType:
            continue

        if item.hasExif:
            features["exif_any_present"] = True
        if item.hasGpsExif:
            features["exif_any_gps_present"] = True

    if not features["exif_any_present"]:
        flags.append("EXIF_MISSING")

    if require_exif_gps and not features["exif_any_gps_present"]:
        flags.append("EXIF_GPS_MISSING")

    return {"flags": flags, "features": features}
