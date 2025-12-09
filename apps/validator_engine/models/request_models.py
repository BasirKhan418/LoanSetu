from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class MediaItem(BaseModel):
    type: str                       # "IMAGE" | "VIDEO" | "DOCUMENT"
    fileKey: str                    # S3 key
    mimeType: str
    sizeInBytes: Optional[int] = None

    capturedAt: Optional[str] = None
    gpsLat: Optional[float] = None
    gpsLng: Optional[float] = None
    hasExif: Optional[bool] = None
    hasGpsExif: Optional[bool] = None
    isScreenshot: Optional[bool] = None
    isPrintedPhotoSuspect: Optional[bool] = None


class SubmissionPayload(BaseModel):
    submissionId: str
    loanId: str
    tenantId: str

    # Full RuleSet doc from your backend
    rullset: Dict[str, Any]

    # LoanDetails object from your backend
    loanDetails: Dict[str, Any]

    # GPS from device (app)
    gps: Dict[str, float]  # { "lat": ..., "lng": ... }

    # Optional: loan sanction date (ISO string), invoice expectations etc.
    sanctionDate: Optional[str] = None
    expectedInvoiceAmount: Optional[float] = None

    # media array from Submission.media[]
    media: List[MediaItem]
