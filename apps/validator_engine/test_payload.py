"""
Test script to validate payload structure
Run this to test if your submission data is correctly formatted for the validation engine
"""

import json

# Sample submission data (from your request)
sample_submission = {
    "_id": "693796eab9de9a72bea29047",
    "loanId": {
        "_id": "6936ee676905b8dbaa9800a5",
        "sanctionAmount": 2499,
        "sanctionDate": "2025-02-10T00:00:00.000Z"
    },
    "tenantId": "6932e9e9d1c65c91b68a771a",
    "rullsetid": "6935b183fa1422e216152b26",
    "loanDetailsId": {
        "assetType": "TRACTOR",
        "minAmount": 150000,
        "maxAmount": 500000
    },
    "media": [
        {
            "type": "IMAGE",
            "fileKey": "uploads/submissions/abc123/img1.jpg",
            "mimeType": "image/jpeg",
            "gpsLat": 20.9871201,
            "gpsLng": 86.1234521,
            "hasExif": True,
            "hasGpsExif": True
        }
    ],
    "ruleset": {
        "rules": {
            "media_requirements": {
                "min_photos": 5
            },
            "gps_rules": {
                "max_distance_km": 6,
                "require_exif_gps": True
            }
        }
    }
}


def transform_for_validation(submission):
    """Transform submission data to match Python validation service schema"""
    
    payload = {
        "submissionId": str(submission["_id"]),
        "loanId": str(submission["loanId"]["_id"]) if isinstance(submission["loanId"], dict) else str(submission["loanId"]),
        "tenantId": str(submission["tenantId"]),
        "rullsetid": str(submission["rullsetid"]),
        
        # Map 'ruleset' to 'rullset' - this is the key transformation!
        "rullset": submission.get("ruleset", {}),
        
        "loanDetails": {
            "assetType": submission.get("loanDetailsId", {}).get("assetType", "UNKNOWN"),
            "sanctionDate": submission.get("loanId", {}).get("sanctionDate"),
            "sanctionAmount": submission.get("loanId", {}).get("sanctionAmount", 0),
            "minAmount": submission.get("loanDetailsId", {}).get("minAmount", 0),
            "maxAmount": submission.get("loanDetailsId", {}).get("maxAmount", 0),
        },
        
        "gps": {
            "gpsLat": submission.get("media", [{}])[0].get("gpsLat"),
            "gpsLng": submission.get("media", [{}])[0].get("gpsLng"),
        },
        
        "media": submission.get("media", []),
        "sanctionDate": submission.get("loanId", {}).get("sanctionDate"),
        "expectedInvoiceAmount": submission.get("loanId", {}).get("sanctionAmount", 0),
    }
    
    return payload


def validate_payload_structure(payload):
    """Check if payload has correct structure"""
    issues = []
    
    # Check required fields
    required_fields = ["submissionId", "loanId", "tenantId", "rullset", "loanDetails", "gps", "media"]
    for field in required_fields:
        if field not in payload:
            issues.append(f"❌ Missing required field: {field}")
    
    # Check rullset has rules
    if "rullset" in payload:
        if "rules" not in payload["rullset"]:
            issues.append("❌ 'rullset' object missing 'rules' property")
        else:
            print("✅ 'rullset' has 'rules' property")
    
    # Check GPS structure
    if "gps" in payload:
        if "gpsLat" not in payload["gps"] or "gpsLng" not in payload["gps"]:
            issues.append("❌ 'gps' object missing 'gpsLat' or 'gpsLng'")
        else:
            print(f"✅ GPS: {payload['gps']}")
    
    # Check loanDetails structure
    if "loanDetails" in payload:
        if "assetType" not in payload["loanDetails"]:
            issues.append("❌ 'loanDetails' missing 'assetType'")
        else:
            print(f"✅ Asset type: {payload['loanDetails']['assetType']}")
    
    # Check media array
    if "media" in payload:
        print(f"✅ Media count: {len(payload['media'])}")
    
    return issues


if __name__ == "__main__":
    print("=" * 60)
    print("Testing Payload Transformation")
    print("=" * 60)
    
    # Transform the sample submission
    payload = transform_for_validation(sample_submission)
    
    print("\n📦 Transformed Payload Structure:")
    print(json.dumps({
        "submissionId": payload["submissionId"],
        "hasRullset": "rullset" in payload,
        "hasRules": "rules" in payload.get("rullset", {}),
        "rulesKeys": list(payload.get("rullset", {}).get("rules", {}).keys()) if "rules" in payload.get("rullset", {}) else [],
        "loanDetails": payload["loanDetails"],
        "gps": payload["gps"],
        "mediaCount": len(payload["media"])
    }, indent=2))
    
    print("\n" + "=" * 60)
    print("Validation Results:")
    print("=" * 60)
    
    issues = validate_payload_structure(payload)
    
    if issues:
        print("\n⚠️  Issues found:")
        for issue in issues:
            print(f"  {issue}")
    else:
        print("\n✅ All checks passed! Payload is correctly structured.")
    
    print("\n" + "=" * 60)
    print("Full Payload (for debugging):")
    print("=" * 60)
    print(json.dumps(payload, indent=2, default=str))
