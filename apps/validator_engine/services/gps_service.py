from typing import List
from haversine import haversine
from models.request_models import MediaItem, GPSModel


def run_gps_checks(device_gps: GPSModel, gps_rules: dict, media: List[MediaItem]):
    flags: list[str] = []
    features: dict = {}

    # Device/Home location point
    if device_gps.gpsLat is None or device_gps.gpsLng is None:
        flags.append("GPS_MISSING")
        return {"flags": flags, "features": features}

    device_point = (device_gps.gpsLat, device_gps.gpsLng)
    max_distance_km = gps_rules.get("max_distance_km", 5)

    # Take EXIF GPS from first image that has it
    exif_point = None
    for m in media:
        if m.hasGpsExif and m.gpsLat is not None and m.gpsLng is not None:
            exif_point = (m.gpsLat, m.gpsLng)
            break

    if exif_point:
        # Compare device/home GPS vs EXIF GPS (asset location)
        distance = haversine(device_point, exif_point)
        features["gps_home_vs_asset_km"] = round(distance, 3)
        features["asset_location"] = {"lat": exif_point[0], "lng": exif_point[1]}
        features["home_location"] = {"lat": device_point[0], "lng": device_point[1]}
        
        if distance > max_distance_km:
            flags.append("GPS_MISMATCH")
    else:
        features["gps_home_vs_asset_km"] = None
        if gps_rules.get("require_exif_gps", False):
            flags.append("EXIF_GPS_MISSING")

    return {"flags": flags, "features": features}
