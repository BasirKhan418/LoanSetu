# 📡 Validation Engine API Specification

## Base URL
```
http://localhost:8000
```

## Endpoints

### 1. Health Check

**GET** `/`

**Response:**
```json
{
  "message": "Validation Engine Running"
}
```

---

### 2. Validate Submission

**POST** `/validate`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "submissionId": "693796eab9de9a72bea29047",
  "loanId": "6936ee676905b8dbaa9800a5",
  "tenantId": "6932e9e9d1c65c91b68a771a",
  "rullsetid": "6935b183fa1422e216152b26",
  "rullset": {
    "rules": {
      "media_requirements": {
        "min_photos": 5,
        "min_video_seconds": 10,
        "allowed_mime_types": ["image/jpeg", "image/png", "video/mp4"]
      },
      "gps_rules": {
        "max_distance_km": 6,
        "require_exif_gps": true,
        "mock_location_block": true
      },
      "time_rules": {
        "max_days_after_sanction": 30,
        "allow_before_sanction": false
      },
      "image_quality_rules": {
        "max_blur_variance": 120,
        "min_resolution": {
          "width": 800,
          "height": 600
        },
        "reject_screenshots": true,
        "reject_printed_photos": true
      },
      "fraud_detection_rules": {
        "duplicate_detection": true,
        "max_hash_distance": 8,
        "ela_tampering_check": true,
        "ai_generated_detection": true,
        "printed_photo_detection": true
      },
      "document_rules": {
        "require_invoice": true,
        "invoice_ocr_match_amount": true,
        "invoice_ocr_match_date": true
      },
      "asset_rules": {
        "allowed_asset_types": ["TRACTOR"],
        "classifier_required": true,
        "confidence_threshold": 0.8
      },
      "risk_weights": {
        "GPS_MISMATCH": 25,
        "EXIF_MISSING": 20,
        "TIME_MISMATCH": 15,
        "DUPLICATE_IMAGE": 35,
        "UNKNOWN_ASSET": 30,
        "ELA_TAMPERED": 30,
        "AI_GENERATED": 40,
        "INVOICE_MISSING": 20,
        "LOW_QUALITY": 15,
        "PRINTED_PHOTO_DETECTED": 25,
        "SCREENSHOT_DETECTED": 20
      },
      "thresholds": {
        "auto_approve_max_risk": 20,
        "manual_review_min_risk": 21,
        "high_risk_min_risk": 60
      }
    }
  },
  "loanDetails": {
    "assetType": "TRACTOR",
    "sanctionDate": "2025-02-10T00:00:00.000Z",
    "sanctionAmount": 2499,
    "minAmount": 150000,
    "maxAmount": 500000
  },
  "gps": {
    "gpsLat": 20.9871201,
    "gpsLng": 86.1234521
  },
  "media": [
    {
      "type": "IMAGE",
      "fileKey": "uploads/submissions/abc123/img1.jpg",
      "mimeType": "image/jpeg",
      "sizeInBytes": 345234,
      "capturedAt": "2025-02-01T08:32:10.000Z",
      "gpsLat": 20.9871201,
      "gpsLng": 86.1234521,
      "hasExif": true,
      "hasGpsExif": true,
      "isScreenshot": false,
      "isPrintedPhotoSuspect": false
    },
    {
      "type": "VIDEO",
      "fileKey": "uploads/submissions/abc123/video1.mp4",
      "mimeType": "video/mp4",
      "sizeInBytes": 1200345,
      "capturedAt": "2025-02-01T08:34:10.000Z",
      "gpsLat": 20.9871201,
      "gpsLng": 86.1234521,
      "hasExif": false,
      "hasGpsExif": false,
      "isScreenshot": false,
      "isPrintedPhotoSuspect": false
    },
    {
      "type": "DOCUMENT",
      "fileKey": "uploads/submissions/abc123/invoice.jpg",
      "mimeType": "image/jpeg",
      "sizeInBytes": 205670,
      "capturedAt": "2025-02-01T08:35:12.000Z",
      "gpsLat": 20.9871201,
      "gpsLng": 86.1234521,
      "hasExif": true,
      "hasGpsExif": false,
      "isScreenshot": false,
      "isPrintedPhotoSuspect": false
    }
  ],
  "sanctionDate": "2025-02-10T00:00:00.000Z",
  "expectedInvoiceAmount": 2499
}
```

**Response (Success):**
```json
{
  "submissionId": "693796eab9de9a72bea29047",
  "aiSummary": {
    "riskScore": 15,
    "decision": "AUTO_APPROVE",
    "flags": [],
    "features": {
      "exif_details": [...],
      "exif_any_present": true,
      "exif_any_gps_present": true,
      "gps_home_vs_asset_km": 0.015,
      "home_location": {"lat": 20.9871201, "lng": 86.1234521},
      "asset_location": {"lat": 20.9871201, "lng": 86.1234521},
      "earliest_capture_date": "2025-02-01T08:32:10.000Z",
      "latest_capture_date": "2025-02-01T08:35:12.000Z",
      "sanction_date": "2025-02-10T00:00:00.000Z",
      "days_after_sanction": -9,
      "avg_blur_variance": 450.5,
      "image_resolutions": [[1920, 1080], [1920, 1080], [1920, 1080]],
      "screenshot_count": 0,
      "printed_suspect_count": 0,
      "duplicate_matches": [],
      "ela_avg_score": 245.3,
      "rekognition_labels": ["Tractor", "Vehicle", "Machine", "Farm Equipment"],
      "classifier_predicted": "TRACTOR",
      "classifier_confidence": 0.95,
      "asset_matches": ["TRACTOR"],
      "invoice_present": true,
      "invoice_amount_ocr": 2500,
      "invoice_date_ocr": "01/02/2025",
      "image_count": 3,
      "video_present": true
    }
  }
}
```

**Response (High Risk):**
```json
{
  "submissionId": "693796eab9de9a72bea29047",
  "aiSummary": {
    "riskScore": 85,
    "decision": "AUTO_HIGH_RISK",
    "flags": [
      "GPS_MISMATCH",
      "DUPLICATE_IMAGE",
      "ELA_TAMPERED",
      "INVOICE_AMOUNT_MISMATCH"
    ],
    "features": {
      "gps_home_vs_asset_km": 12.5,
      "duplicate_matches": [{"current": "abc123", "match": "def456"}],
      "ela_avg_score": 850,
      "invoice_amount_ocr": 15000,
      ...
    }
  }
}
```

**Response (Error):**
```json
{
  "detail": "Error message here"
}
```

**Status Codes:**
- `200 OK` - Validation completed successfully
- `400 Bad Request` - Invalid request body
- `422 Unprocessable Entity` - Validation error in request schema
- `500 Internal Server Error` - Server error during validation

---

## Decision Values

| Decision | Risk Score Range | Description |
|----------|-----------------|-------------|
| `AUTO_APPROVE` | 0-20 | Low risk, automatically approve |
| `AUTO_REVIEW` | 21-59 | Medium risk, requires manual review |
| `AUTO_HIGH_RISK` | 60-100 | High risk, likely fraud |
| `NEED_RESUBMISSION` | Any | Hard fail flags present, resubmission required |

---

## Flags Reference

### GPS Flags
- `GPS_MISSING` - No GPS data provided
- `GPS_MISMATCH` - Distance between home and asset location exceeds threshold
- `EXIF_GPS_MISSING` - GPS data missing from image EXIF

### EXIF Flags
- `EXIF_MISSING` - No EXIF data found in images
- `EXIF_EDITING_SOFTWARE` - Image edited with software (Photoshop, GIMP, etc.)

### Time Flags
- `PHOTO_BEFORE_SANCTION` - Photo taken before loan sanction date
- `PHOTO_TOO_LATE` - Photo taken too long after sanction
- `TIME_MISMATCH` - General time mismatch
- `INVALID_SANCTION_DATE` - Sanction date format invalid

### Quality Flags
- `LOW_QUALITY` - Image blur variance below threshold
- `SCREENSHOT_DETECTED` - Screenshot detected
- `PRINTED_PHOTO_DETECTED` - Printed photo detected

### Fraud Flags
- `DUPLICATE_IMAGE` - Duplicate or similar image found
- `ELA_TAMPERED` - Image tampering detected via ELA

### Asset Flags
- `UNKNOWN_ASSET` - Asset type doesn't match allowed types
- `LOW_CONFIDENCE` - Classifier confidence below threshold
- `NO_IMAGE` - No image provided for classification
- `CLASSIFIER_ERROR` - Error during classification

### Document Flags
- `INVOICE_MISSING` - Required invoice not provided
- `INVOICE_AMOUNT_MISMATCH` - Invoice amount doesn't match expected
- `INVOICE_DATE_MISSING` - Invoice date not found in OCR
- `INVOICE_OCR_ERROR` - Error during OCR processing

### Media Flags
- `LOW_MEDIA_COUNT` - Not enough photos provided
- `VIDEO_MISSING` - Required video not provided

---

## Callback to Node.js

After validation completes, the engine automatically calls:

**PATCH** `{BACKEND_URL}/api/submission/update`

**Request Body:**
```json
{
  "submissionId": "693796eab9de9a72bea29047",
  "aiSummary": {
    "riskScore": 15,
    "decision": "AUTO_APPROVE",
    "flags": [],
    "features": {...}
  }
}
```

This updates the submission in your database with the validation results.

---

## Testing with cURL

### Health Check
```bash
curl http://localhost:8000/
```

### Full Validation
```bash
curl -X POST http://localhost:8000/validate \
  -H "Content-Type: application/json" \
  -d @sample_payload.json
```

---

## Integration Guide

### From Node.js/BullMQ Worker
```javascript
import axios from 'axios';

const response = await axios.post(
  'http://localhost:8000/validate',
  payload,
  {
    timeout: 120000, // 2 minutes
    headers: { 'Content-Type': 'application/json' }
  }
);

const aiSummary = response.data.aiSummary;
```

### From Python
```python
import requests

response = requests.post(
    'http://localhost:8000/validate',
    json=payload,
    timeout=120
)

ai_summary = response.json()['aiSummary']
```

---

## Performance Considerations

- **Timeout:** Set client timeout to at least 2 minutes
- **Concurrency:** Service can handle multiple requests concurrently
- **Caching:** Duplicate hashes cached in Redis
- **AWS Rekognition:** Rate limits apply (check AWS quotas)
- **OCR:** EasyOCR loads model on first request (warmup ~10s)

---

## Error Handling

All errors return JSON format:
```json
{
  "detail": "Error description"
}
```

Common errors:
- S3 download failures
- AWS Rekognition API errors
- Redis connection issues
- OCR processing errors

All errors are logged to console for debugging.

---

🎯 **Ready to integrate!** Follow the Quick Start guide to get started.
