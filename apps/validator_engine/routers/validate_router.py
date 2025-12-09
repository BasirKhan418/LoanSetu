from fastapi import APIRouter, HTTPException
from models.request_models import SubmissionPayload
from validation_engine import validate_submission_engine
import traceback

router = APIRouter()


@router.post("/")
async def validate_submission(payload: SubmissionPayload):
    try:
        print(f"[VALIDATION] Received submission: {payload.submissionId}")
        
        # Validate that rullset has rules
        if not payload.rullset:
            raise HTTPException(status_code=400, detail="rullset is required")
        
        if "rules" not in payload.rullset:
            raise HTTPException(
                status_code=400, 
                detail="rullset must contain 'rules' property. Received keys: " + str(list(payload.rullset.keys()))
            )
        
        print(f"[VALIDATION] Rules found in rullset: {list(payload.rullset.get('rules', {}).keys())}")
        print(f"[VALIDATION] Media count: {len(payload.media)}")
        print(f"[VALIDATION] Asset type: {payload.loanDetails.assetType}")
        
        # Run validation
        result = validate_submission_engine(payload)
        
        print(f"[VALIDATION] Completed for {payload.submissionId}: {result.get('decision')}")
        
        return {
            "submissionId": payload.submissionId,
            "aiSummary": result
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Validation failed: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")
