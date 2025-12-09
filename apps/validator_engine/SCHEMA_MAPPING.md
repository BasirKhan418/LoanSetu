# 🔄 Schema Mapping Guide

## Problem
The Node.js backend stores data with field names that differ from what the Python validation service expects.

## Field Mappings

### 1. Submission ID
- **Database:** `_id` (MongoDB ObjectId)
- **Python expects:** `submissionId` (string)
- **Transformation:** `submission._id.toString()`

### 2. RuleSet
- **Database:** `ruleset` object with nested `rules`
  ```json
  {
    "ruleset": {
      "_id": "...",
      "name": "...",
      "rules": {
        "media_requirements": {...},
        "gps_rules": {...}
      }
    }
  }
  ```
- **Python expects:** `rullset` (note the spelling!) with `rules` property
  ```json
  {
    "rullset": {
      "rules": {
        "media_requirements": {...},
        "gps_rules": {...}
      }
    }
  }
  ```
- **Transformation:** Map `ruleset` → `rullset`

### 3. Loan Details
- **Database:** Data spread across `loanDetailsId` and `loanId` objects
- **Python expects:** Consolidated `loanDetails` object
- **Transformation:**
  ```javascript
  loanDetails: {
    assetType: submission.loanDetailsId.assetType,
    sanctionDate: submission.loanId.sanctionDate,
    sanctionAmount: submission.loanId.sanctionAmount,
    minAmount: submission.loanDetailsId.minAmount,
    maxAmount: submission.loanDetailsId.maxAmount,
  }
  ```

### 4. GPS Data
- **Database:** Embedded in first media item
- **Python expects:** Separate `gps` object with `gpsLat` and `gpsLng`
- **Transformation:**
  ```javascript
  gps: {
    gpsLat: submission.media[0]?.gpsLat || null,
    gpsLng: submission.media[0]?.gpsLng || null,
  }
  ```

## Complete Transformation Function

```javascript
function transformSubmissionForValidation(submission) {
  return {
    // Required fields with proper naming
    submissionId: submission._id.toString(),
    loanId: submission.loanId._id.toString(),
    tenantId: submission.tenantId.toString(),
    rullsetid: submission.rullsetid.toString(),
    
    // CRITICAL: Map 'ruleset' to 'rullset'
    rullset: submission.ruleset || {},
    
    // Consolidated loan details
    loanDetails: {
      assetType: submission.loanDetailsId?.assetType || "UNKNOWN",
      sanctionDate: submission.loanId?.sanctionDate || null,
      sanctionAmount: submission.loanId?.sanctionAmount || 0,
      minAmount: submission.loanDetailsId?.minAmount || 0,
      maxAmount: submission.loanDetailsId?.maxAmount || 0,
    },
    
    // GPS from first media item
    gps: {
      gpsLat: submission.media?.[0]?.gpsLat || null,
      gpsLng: submission.media?.[0]?.gpsLng || null,
    },
    
    // Pass through as-is
    media: submission.media || [],
    sanctionDate: submission.loanId?.sanctionDate || null,
    expectedInvoiceAmount: submission.loanId?.sanctionAmount || 0,
  };
}
```

## Validation Checklist

Before sending to Python service, verify:

✅ `submissionId` is a string (not ObjectId)
✅ `rullset` exists (not `ruleset`)
✅ `rullset.rules` exists and has keys like `media_requirements`, `gps_rules`, etc.
✅ `loanDetails.assetType` is set
✅ `gps.gpsLat` and `gps.gpsLng` are numbers or null
✅ `media` is an array with at least one item
✅ All ObjectIds are converted to strings

## Common Errors

### Error: "rullset must contain 'rules' property"
**Cause:** The `ruleset` object wasn't properly mapped to `rullset`, or the object is empty.

**Fix:** Ensure `submission.ruleset` exists and contains a `rules` property:
```javascript
// Check before sending
console.log("Has ruleset:", !!submission.ruleset);
console.log("Has rules:", !!submission.ruleset?.rules);
console.log("Rules keys:", Object.keys(submission.ruleset?.rules || {}));
```

### Error: "Field required" for submissionId
**Cause:** `_id` wasn't converted to `submissionId` string.

**Fix:**
```javascript
submissionId: submission._id.toString() // Not just submission._id
```

### Error: GPS validation fails
**Cause:** GPS coordinates not properly extracted from media.

**Fix:** Ensure media array has items with GPS:
```javascript
console.log("First media GPS:", {
  lat: submission.media[0]?.gpsLat,
  lng: submission.media[0]?.gpsLng
});
```

## Testing Your Payload

Use the test script:
```bash
cd apps/validator_engine
python test_payload.py
```

This will validate your payload structure and show any issues.

## Debug Logs to Add

In your worker, add these logs before sending:
```javascript
console.log("📦 Payload check:", {
  submissionId: payload.submissionId,
  hasRullset: !!payload.rullset,
  hasRulesInRullset: !!payload.rullset?.rules,
  rulesKeys: Object.keys(payload.rullset?.rules || {}),
  mediaCount: payload.media?.length,
  gps: payload.gps,
  assetType: payload.loanDetails?.assetType
});
```

## Summary

The key issue is the field name mismatch:
- Database uses `ruleset` → Python expects `rullset`
- Database uses `_id` → Python expects `submissionId`
- Database spreads loan data → Python expects `loanDetails` object
- Database embeds GPS in media → Python expects separate `gps` object

All transformations are now handled in the updated `worker_cluster/index.js` file.
