from typing import List, Dict
import exifread
import os
from models.request_models import MediaItem
from utils.s3_utils import download_from_s3_to_temp
from utils.temp_utils import safe_remove


def extract_exif_data(media: List[MediaItem]) -> Dict:
    """
    Extract detailed EXIF data from images:
    - DateTimeOriginal
    - GPS coordinates
    - Software tag
    - Camera make/model
    - Detect tampering indicators
    """
    exif_data = []
    flags = []

    for m in media:
        if m.type != "IMAGE":
            continue

        local_path = None
        try:
            local_path = download_from_s3_to_temp(m.fileKey)

            with open(local_path, 'rb') as f:
                tags = exifread.process_file(f, details=False)

            item_exif = {
                "fileKey": m.fileKey,
                "datetime_original": None,
                "gps_latitude": None,
                "gps_longitude": None,
                "software": None,
                "camera_make": None,
                "camera_model": None,
                "has_exif": len(tags) > 0,
                "exif_tags_count": len(tags)
            }

            # Extract DateTime
            if "EXIF DateTimeOriginal" in tags:
                item_exif["datetime_original"] = str(tags["EXIF DateTimeOriginal"])
            elif "Image DateTime" in tags:
                item_exif["datetime_original"] = str(tags["Image DateTime"])

            # Extract GPS
            if "GPS GPSLatitude" in tags and "GPS GPSLongitude" in tags:
                lat = tags["GPS GPSLatitude"]
                lng = tags["GPS GPSLongitude"]
                lat_ref = tags.get("GPS GPSLatitudeRef", "N")
                lng_ref = tags.get("GPS GPSLongitudeRef", "E")

                # Convert to decimal
                try:
                    lat_deg = _convert_to_degrees(lat)
                    lng_deg = _convert_to_degrees(lng)

                    if lat_ref == "S":
                        lat_deg = -lat_deg
                    if lng_ref == "W":
                        lng_deg = -lng_deg

                    item_exif["gps_latitude"] = lat_deg
                    item_exif["gps_longitude"] = lng_deg
                except Exception:
                    pass

            # Extract Software (tampering indicator)
            if "Image Software" in tags:
                software = str(tags["Image Software"])
                item_exif["software"] = software
                
                # Check for editing software
                editing_software = ["photoshop", "gimp", "lightroom", "snapseed", "picsart"]
                if any(sw in software.lower() for sw in editing_software):
                    flags.append("EXIF_EDITING_SOFTWARE")

            # Extract Camera Info
            if "Image Make" in tags:
                item_exif["camera_make"] = str(tags["Image Make"])
            if "Image Model" in tags:
                item_exif["camera_model"] = str(tags["Image Model"])

            # Detect potential tampering indicators
            if len(tags) < 10:
                item_exif["exif_suspiciously_sparse"] = True
            else:
                item_exif["exif_suspiciously_sparse"] = False

            exif_data.append(item_exif)

        except Exception as e:
            print(f"[ERROR] EXIF extraction failed for {m.fileKey}: {str(e)}")
            exif_data.append({
                "fileKey": m.fileKey,
                "error": str(e),
                "has_exif": False
            })
        finally:
            if local_path:
                safe_remove(local_path)

    return {
        "exif_data": exif_data,
        "flags": flags
    }


def _convert_to_degrees(value):
    """
    Convert GPS coordinates to degrees
    """
    d = float(value.values[0].num) / float(value.values[0].den)
    m = float(value.values[1].num) / float(value.values[1].den)
    s = float(value.values[2].num) / float(value.values[2].den)
    return d + (m / 60.0) + (s / 3600.0)
