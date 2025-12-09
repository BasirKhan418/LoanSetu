from models.request_models import SubmissionPayload
from services.exif_service import run_exif_checks
from services.exif_extraction_service import extract_exif_data
from services.gps_service import run_gps_checks
from services.forensics_service import run_forensics_checks
from services.duplicate_service import run_duplicate_checks
from services.ela_service import run_ela_checks
from services.classifier_service import run_classifier
from services.ocr_service import run_ocr_checks
from services.scoring_service import calculate_risk_score
from services.decision_service import make_decision
from services.time_service import run_time_checks
from services.ledger_service import (
    log_validation_start,
    log_validation_step,
    log_validation_complete,
    get_ledger_entries
)
from services.callback_service import send_validation_callback_sync


def validate_submission_engine(payload: SubmissionPayload) -> dict:
    submission_id = payload.submissionId
    rules = payload.rullset.get("rules", {})
    flags: list[str] = []
    features: dict = {}

    # Log validation start
    log_validation_start(submission_id, payload.dict())

    exif_extraction = extract_exif_data(payload.media)
    features["exif_details"] = exif_extraction["exif_data"]
    flags += exif_extraction["flags"]
    log_validation_step(submission_id, "EXIF_EXTRACTION", exif_extraction)

    
    exif_result = run_exif_checks(payload.media, rules)
    flags += exif_result["flags"]
    features.update(exif_result["features"])
    log_validation_step(submission_id, "EXIF_CHECKS", exif_result)

  
    gps_rules = rules.get("gps_rules", {})
    gps_result = run_gps_checks(
        device_gps=payload.gps,
        gps_rules=gps_rules,
        media=payload.media
    )
    flags += gps_result["flags"]
    features.update(gps_result["features"])
    log_validation_step(submission_id, "GPS_VALIDATION", gps_result)

    # 4 Time validation
    time_rules = rules.get("time_rules", {})
    sanction_date = payload.loanDetails.sanctionDate or payload.sanctionDate
    if time_rules and sanction_date:
        time_result = run_time_checks(payload.media, time_rules, sanction_date)
        flags += time_result["flags"]
        features.update(time_result["features"])
        log_validation_step(submission_id, "TIME_CHECKS", time_result)

    # 5 Image quality & forensic checks
    img_quality_rules = rules.get("image_quality_rules")
    if img_quality_rules:
        forensics_result = run_forensics_checks(payload.media, img_quality_rules)
        flags += forensics_result["flags"]
        features.update(forensics_result["features"])
        log_validation_step(submission_id, "FORENSICS", forensics_result)
    # 6 Duplicate detection
    fraud_rules = rules.get("fraud_detection_rules", {})
    if fraud_rules.get("duplicate_detection"):
        dup_result = run_duplicate_checks(
            media=payload.media,
            max_hash_distance=fraud_rules.get("max_hash_distance", 8)
        )
        flags += dup_result["flags"]
        features.update(dup_result["features"])
        log_validation_step(submission_id, "DUPLICATE_CHECK", dup_result)

    # 7 ELA tampering
    if fraud_rules.get("ela_tampering_check"):
        ela_result = run_ela_checks(payload.media)
        flags += ela_result["flags"]
        features.update(ela_result["features"])
        log_validation_step(submission_id, "ELA_TAMPERING", ela_result)
    # 8 Asset classifier (dynamic)
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
        log_validation_step(submission_id, "ASSET_CLASSIFIER", class_result)

    # 9 OCR / Invoice rules
    doc_rules = rules.get("document_rules", {})
    if doc_rules.get("require_invoice"):
        expected_amount = payload.loanDetails.sanctionAmount or payload.expectedInvoiceAmount
        ocr_result = run_ocr_checks(
            media=payload.media,
            document_rules=doc_rules,
            expected_amount=expected_amount
        )
        flags += ocr_result["flags"]
        features.update(ocr_result["features"])
        log_validation_step(submission_id, "OCR_INVOICE", ocr_result)

    # 10) Media requirements (min photos, min video seconds)
    media_rules = rules.get("media_requirements", {})
    media_flags, media_feats = _check_media_requirements(payload.media, media_rules)
    flags += media_flags
    features.update(media_feats)
    log_validation_step(submission_id, "MEDIA_REQUIREMENTS", {
        "flags": media_flags,
        "features": media_feats
    })

    # 11 Risk scoring
    risk_weights = rules.get("risk_weights", {})
    risk_score = calculate_risk_score(flags, risk_weights)
    log_validation_step(submission_id, "RISK_SCORING", {
        "risk_score": risk_score,
        "total_flags": len(flags)
    })

    # 12 Decision engine
    thresholds = rules.get("thresholds", {})
    decision = make_decision(risk_score, thresholds, flags)
    log_validation_step(submission_id, "DECISION", {
        "decision": decision,
        "risk_score": risk_score
    })

    # Final result
    result = {
        "riskScore": risk_score,
        "decision": decision,
        "flags": list(set(flags)),  # dedupe
        "features": features
    }

    # Log completion
    log_validation_complete(submission_id, result)

    # 13 Callback to Node.js backend
    try:
        callback_result = send_validation_callback_sync(submission_id, result)
        if callback_result["success"]:
            print(f"[SUCCESS] Callback sent for submission {submission_id}")
        else:
            print(f"[ERROR] Callback failed for submission {submission_id}: {callback_result}")
    except Exception as e:
        print(f"[ERROR] Callback exception for submission {submission_id}: {str(e)}")

    return result


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
