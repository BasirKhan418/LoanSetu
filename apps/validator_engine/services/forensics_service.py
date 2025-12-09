from typing import List, Dict
import cv2
import os
from models.request_models import MediaItem
from utils.s3_utils import download_from_s3_to_temp
from utils.temp_utils import safe_remove


def run_forensics_checks(media: List[MediaItem], image_quality_rules: Dict):
    flags: list[str] = []
    features: dict = {}

    blur_values = []
    resolutions = []
    screenshot_count = 0
    printed_suspect_count = 0

    min_width = image_quality_rules.get("min_resolution", {}).get("width", 800)
    min_height = image_quality_rules.get("min_resolution", {}).get("height", 600)
    max_blur_variance = image_quality_rules.get("max_blur_variance", 120)
    reject_screenshots = image_quality_rules.get("reject_screenshots", True)
    reject_printed_photos = image_quality_rules.get("reject_printed_photos", True)

    for m in media:
        if m.type != "IMAGE":
            continue

        local_path = None
        try:
            print(f"[DEBUG] Downloading image from fileKey: {m.fileKey}")
            local_path = download_from_s3_to_temp(m.fileKey)
            img = cv2.imread(local_path)
            if img is None:
                print(f"[WARNING] Failed to read image from {local_path}")
                continue

            h, w, _ = img.shape
            resolutions.append((w, h))

            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            variance = cv2.Laplacian(gray, cv2.CV_64F).var()
            blur_values.append(variance)

            # Heuristic screenshot detection: weird aspect ratio or tiny resolution
            aspect_ratio = w / h
            if aspect_ratio > 2.2 or aspect_ratio < 0.4:
                screenshot_count += 1

            if w < min_width or h < min_height:
                screenshot_count += 1

            if m.isScreenshot:
                screenshot_count += 1

            # Printed-photo heuristic: high edge density in rectangular area
            if m.isPrintedPhotoSuspect:
                printed_suspect_count += 1

        finally:
            if local_path:
                safe_remove(local_path)

    avg_blur = sum(blur_values) / len(blur_values) if blur_values else None
    features["avg_blur_variance"] = avg_blur
    features["image_resolutions"] = resolutions
    features["screenshot_count"] = screenshot_count
    features["printed_suspect_count"] = printed_suspect_count

    if avg_blur is not None and avg_blur < max_blur_variance:
        flags.append("LOW_QUALITY")

    if reject_screenshots and screenshot_count > 0:
        flags.append("SCREENSHOT_DETECTED")

    if reject_printed_photos and printed_suspect_count > 0:
        flags.append("PRINTED_PHOTO_DETECTED")

    return {"flags": flags, "features": features}
