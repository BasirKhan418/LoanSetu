from fastapi import APIRouter
from models.request_models import SubmissionPayload
from validation_engine import validate_submission_engine

router = APIRouter()


@router.post("/")
async def validate_submission(payload: SubmissionPayload):
    result = validate_submission_engine(payload)
    return {
        "submissionId": payload.submissionId,
        "aiSummary": result
    }
