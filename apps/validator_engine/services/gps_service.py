from typing import List, Dict
from haversine import haversine
from models.request_models import MediaItem


def run_gps_checks(device_gps: Dict[str, float], gps_rules: dict, media: List[MediaItem]):
    flags: list[str] = []
    features: dict = {}

    device_point = (device_gps.get("lat"), device_gps.get("lng"))
    max_distance_km = gps_rules.get("max_distance_km", 5)

    # Take EXIF GPS from first image that has it
    exif_point = None
    for m in media:
        if m.hasGpsExif and m.gpsLat is not None and m.gpsLng is not None:
            exif_point = (m.gpsLat, m.gpsLng)
            break

    if exif_point:
        distance = haversine(device_point, exif_point)
        features["gps_device_vs_exif_km"] = round(distance, 3)
        if distance > max_distance_km:
            flags.append("GPS_MISMATCH")
    else:
        features["gps_device_vs_exif_km"] = None

    return {"flags": flags, "features": features}
