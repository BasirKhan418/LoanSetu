from typing import List
from PIL import Image, ImageChops
from models.request_models import MediaItem
from utils.s3_utils import download_from_s3_to_temp
from utils.temp_utils import safe_remove


def run_ela_checks(media: List[MediaItem]):
    flags: list[str] = []
    features: dict = {}
    scores = []

    for m in media:
        if m.type != "IMAGE":
            continue

        local_path = None
        try:
            local_path = download_from_s3_to_temp(m.fileKey)

            orig = Image.open(local_path).convert("RGB")
            ela_path = local_path + "_ela.jpg"
            orig.save(ela_path, "JPEG", quality=90)

            ela = Image.open(ela_path)
            diff = ImageChops.difference(orig, ela)
            extrema = diff.getextrema()
            score = sum([e[1] for e in extrema])  # crude measure

            scores.append(score)

        except Exception:
            continue
        finally:
            if local_path:
                safe_remove(local_path)
            if local_path and os.path.exists(local_path + "_ela.jpg"):
                safe_remove(local_path + "_ela.jpg")

    avg_score = sum(scores) / len(scores) if scores else 0
    features["ela_avg_score"] = avg_score

    # threshold tweakable
    if avg_score > 500:
        flags.append("ELA_TAMPERED")

    return {"flags": flags, "features": features}
