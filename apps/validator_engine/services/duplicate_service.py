from typing import List
from PIL import Image
import imagehash
import redis
from models.request_models import MediaItem
from utils.s3_utils import download_from_s3_to_temp
from utils.temp_utils import safe_remove
import os

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)

HASH_SET_KEY = "image_phash_set"


def run_duplicate_checks(media: List[MediaItem], max_hash_distance: int):
    flags: list[str] = []
    features: dict = {"duplicate_matches": []}

    for m in media:
        if m.type != "IMAGE":
            continue

        local_path = None
        try:
            local_path = download_from_s3_to_temp(m.fileKey)
            img = Image.open(local_path)
            phash = imagehash.phash(img)

            # Check against existing hashes
            existing_hashes = redis_client.smembers(HASH_SET_KEY)
            for h in existing_hashes:
                diff = phash - imagehash.hex_to_hash(h)
                if diff <= max_hash_distance:
                    flags.append("DUPLICATE_IMAGE")
                    features["duplicate_matches"].append({"current": str(phash), "match": h})

            # Store this hash
            redis_client.sadd(HASH_SET_KEY, str(phash))

        except Exception:
            continue
        finally:
            if local_path:
                safe_remove(local_path)

    return {"flags": flags, "features": features}
