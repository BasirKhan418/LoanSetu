from typing import List, Dict, Optional
from models.request_models import MediaItem
from utils.s3_utils import download_from_s3_to_temp
from utils.temp_utils import safe_remove
import easyocr
import re

_reader = None


def _get_reader():
    global _reader
    if _reader is None:
        _reader = easyocr.Reader(["en"], gpu=False)
    return _reader


def run_ocr_checks(media: List[MediaItem], document_rules: Dict, expected_amount: Optional[float]):
    flags: list[str] = []
    features: dict = {
        "invoice_present": False,
        "invoice_amount_ocr": None
    }

    invoice_items = [m for m in media if m.type == "DOCUMENT"]
    if not invoice_items:
        flags.append("INVOICE_MISSING")
        return {"flags": flags, "features": features}

    features["invoice_present"] = True

    if not (document_rules.get("invoice_ocr_match_amount") or document_rules.get("invoice_ocr_match_date")):
        return {"flags": flags, "features": features}

    reader = _get_reader()

    # Just take first invoice doc for now
    item = invoice_items[0]
    local_path = None
    try:
        local_path = download_from_s3_to_temp(item.fileKey)
        result = reader.readtext(local_path, detail=0)
        text = " ".join(result)
        features["invoice_ocr_text"] = text[:500]

        # Extract amount-like patterns
        amounts = re.findall(r"\b\d{3,7}\b", text)
        if amounts:
            ocr_amount = float(amounts[-1])  # heuristic: last big number
            features["invoice_amount_ocr"] = ocr_amount
            if expected_amount is not None and document_rules.get("invoice_ocr_match_amount"):
                if abs(ocr_amount - expected_amount) > 5000:  # tolerance
                    flags.append("INVOICE_AMOUNT_MISMATCH")

    except Exception:
        flags.append("INVOICE_OCR_ERROR")
    finally:
        if local_path:
            safe_remove(local_path)

    return {"flags": flags, "features": features}
