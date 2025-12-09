# services/classifier_service.py

import os
from typing import List

import boto3

from models.request_models import MediaItem
from utils.s3_utils import download_from_s3_to_temp
from utils.temp_utils import safe_remove

AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")

rekognition = boto3.client("rekognition", region_name=AWS_REGION)


def run_classifier(media: List[MediaItem], allowed_assets: List[str], confidence_threshold: float):
    """
    Classifier backend: AWS Rekognition (detect_labels).
    - Takes first IMAGE from media
    - Calls Rekognition.detect_labels
    - Maps labels to allowed_assets
    - Emits UNKNOWN_ASSET / LOW_CONFIDENCE based on RuleSet.
    """

    flags: list[str] = []
    features: dict = {}

    # Normalize allowed asset labels (e.g., ["TRACTOR", "DAIRY_UNIT"])
    allowed_upper = [a.upper() for a in allowed_assets]

    # 1) Pick first image
    first_image = next((m for m in media if m.type == "IMAGE"), None)
    if not first_image:
        flags.append("NO_IMAGE")
        return {"flags": flags, "features": features}

    local_path = None
    try:
        # 2) Download from S3 URL or key to temp file
        local_path = download_from_s3_to_temp(first_image.fileKey)
        with open(local_path, "rb") as f:
            image_bytes = f.read()

        # 3) Call Rekognition
        resp = rekognition.detect_labels(
            Image={"Bytes": image_bytes},
            MaxLabels=15,
            MinConfidence=40  # 40% minimum; we apply stricter threshold via RuleSet
        )

        # Extract labels
        labels = [lbl["Name"] for lbl in resp.get("Labels", [])]
        labels_upper = [name.upper() for name in labels]
        features["rekognition_labels"] = labels

        if not resp.get("Labels"):
            flags.append("CLASSIFIER_ERROR")
            return {"flags": flags, "features": features}

        # 4) Best label (highest confidence)
        best = max(resp["Labels"], key=lambda x: x["Confidence"])
        best_name = best["Name"].upper()
        best_conf = best["Confidence"] / 100.0  # → 0.0–1.0

        features["classifier_predicted"] = best_name
        features["classifier_confidence"] = round(best_conf, 4)

        # 5) Does any allowed asset match Rekognition labels?
        # Strategy: if allowed asset name is contained in any Rekognition label (case-insensitive)
        matches = []
        for asset in allowed_upper:
            for lbl in labels_upper:
                if asset in lbl:
                    matches.append(asset)

        if not matches:
            flags.append("UNKNOWN_ASSET")
        else:
            features["asset_matches"] = matches

        # 6) Confidence check vs threshold
        if best_conf < confidence_threshold:
            flags.append("LOW_CONFIDENCE")

    except Exception as e:
        flags.append("CLASSIFIER_ERROR")
        features["classifier_error"] = str(e)
    finally:
        if local_path:
            safe_remove(local_path)

    return {"flags": flags, "features": features}
