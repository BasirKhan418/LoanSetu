from typing import Dict, List


def make_decision(score: int, thresholds: Dict, flags: List[str]) -> str:
    """
    Decision logic:
      - If hard-fail flags present → NEED_RESUBMISSION
      - Else use thresholds on risk score.
    """
    hard_fail_flags = {"LOW_MEDIA_COUNT", "INVOICE_MISSING", "NO_IMAGE"}

    if any(f in hard_fail_flags for f in flags):
        return "NEED_RESUBMISSION"

    auto_approve_max = thresholds.get("auto_approve_max_risk", 20)
    high_risk_min = thresholds.get("high_risk_min_risk", 60)

    if score <= auto_approve_max:
        return "AUTO_APPROVE"
    if score >= high_risk_min:
        return "AUTO_HIGH_RISK"
    return "AUTO_REVIEW"
