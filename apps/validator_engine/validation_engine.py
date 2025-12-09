from models.request_models import SubmissionPayload
from services.exif_service import run_exif_checks
from services.gps_service import run_gps_checks
from services.forensics_service import run_forensics_checks
from services.duplicate_service import run_duplicate_checks
from services.ela_service import run_ela_checks
from services.classifier_service import run_classifier
from services.ocr_service import run_ocr_checks
from services.scoring_service import calculate_risk_score
from services.decision_service import make_decision


def validate_submission_engine(payload: SubmissionPayload) -> dict:
    rules = payload.rullset.get("rules", {})
    flags: list[str] = []
    features: dict = {}

    # 1) EXIF checks
    exif_result = run_exif_checks(payload.media, rules)
    flags += exif_result["flags"]
    features.update(exif_result["features"])

    # 2) GPS validation
    gps_rules = rules.get("gps_rules", {})
    gps_result = run_gps_checks(
        device_gps=payload.gps,
        gps_rules=gps_rules,
        media=payload.media
    )
    flags += gps_result["flags"]
    features.update(gps_result["features"])

    # 3) Image quality & forensic checks
    img_quality_rules = rules.get("image_quality_rules")
    if img_quality_rules:
        forensics_result = run_forensics_checks(payload.media, img_quality_rules)
        flags += forensics_result["flags"]
        features.update(forensics_result["features"])

    # 4) Duplicate detection
    fraud_rules = rules.get("fraud_detection_rules", {})
    if fraud_rules.get("duplicate_detection"):
        dup_result = run_duplicate_checks(
            media=payload.media,
            max_hash_distance=fraud_rules.get("max_hash_distance", 8)
        )
        flags += dup_result["flags"]
        features.update(dup_result["features"])

    # 5) ELA tampering
    if fraud_rules.get("ela_tampering_check"):
        ela_result = run_ela_checks(payload.media)
        flags += ela_result["flags"]
        features.update(ela_result["features"])

    # 6) Asset classifier (dynamic)
    asset_rules = rules.get("asset_rules", {})
    if asset_rules.get("classifier_required"):
        allowed_assets = asset_rules.get("allowed_asset_types", [])
        confidence_threshold = asset_rules.get("confidence_threshold", 0.8)
        class_result = run_classifier(
            media=payload.media,
            allowed_assets=allowed_assets,
            confidence_threshold=confidence_threshold
        )
        flags += class_result["flags"]
        features.update(class_result["features"])

    # 7) OCR / Invoice rules
    doc_rules = rules.get("document_rules", {})
    if doc_rules.get("require_invoice"):
        ocr_result = run_ocr_checks(
            media=payload.media,
            document_rules=doc_rules,
            expected_amount=payload.expectedInvoiceAmount
        )
        flags += ocr_result["flags"]
        features.update(ocr_result["features"])

    # 8) Media requirements (min photos, min video seconds)
    media_rules = rules.get("media_requirements", {})
    media_flags, media_feats = _check_media_requirements(payload.media, media_rules)
    flags += media_flags
    features.update(media_feats)

    # 9) Risk scoring
    risk_weights = rules.get("risk_weights", {})
    risk_score = calculate_risk_score(flags, risk_weights)

    # 10) Decision engine
    thresholds = rules.get("thresholds", {})
    decision = make_decision(risk_score, thresholds, flags)

    return {
        "riskScore": risk_score,
        "decision": decision,
        "flags": list(set(flags)),  # dedupe
        "features": features
    }


def _check_media_requirements(media, media_rules: dict):
    flags = []
    features = {}

    min_photos = media_rules.get("min_photos")
    image_count = sum(1 for m in media if m.type == "IMAGE")
    features["image_count"] = image_count
    if min_photos is not None and image_count < min_photos:
        flags.append("LOW_MEDIA_COUNT")

    # You can track video duration on frontend and pass as feature if needed
    # For now, only check presence of at least 1 video if min_video_seconds set
    min_video_seconds = media_rules.get("min_video_seconds")
    video_present = any(m.type == "VIDEO" for m in media)
    features["video_present"] = video_present
    if min_video_seconds and not video_present:
        flags.append("VIDEO_MISSING")

    return flags, features
