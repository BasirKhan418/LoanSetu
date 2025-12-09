import os
import httpx
from typing import Dict, Any


BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3000")
CALLBACK_TIMEOUT = 30  # seconds


async def send_validation_callback(submission_id: str, ai_summary: Dict[str, Any]) -> Dict:
    """
    Send validation results back to Node.js backend
    PATCH /api/submission/update
    """
    url = f"{BACKEND_URL}/api/submission/update"
    
    payload = {
        "submissionId": submission_id,
        "aiSummary": ai_summary
    }
    
    try:
        async with httpx.AsyncClient(timeout=CALLBACK_TIMEOUT) as client:
            response = await client.patch(url, json=payload)
            response.raise_for_status()
            
            data = response.json()
            print(f"[CALLBACK SUCCESS] Submission {submission_id} updated")
            return {
                "success": True,
                "status_code": response.status_code,
                "data": data
            }
    
    except httpx.HTTPStatusError as e:
        print(f"[CALLBACK ERROR] HTTP {e.response.status_code}: {e.response.text}")
        return {
            "success": False,
            "error": f"HTTP {e.response.status_code}",
            "details": e.response.text
        }
    
    except httpx.RequestError as e:
        print(f"[CALLBACK ERROR] Request failed: {str(e)}")
        return {
            "success": False,
            "error": "Request failed",
            "details": str(e)
        }
    
    except Exception as e:
        print(f"[CALLBACK ERROR] Unexpected error: {str(e)}")
        return {
            "success": False,
            "error": "Unexpected error",
            "details": str(e)
        }


def send_validation_callback_sync(submission_id: str, ai_summary: Dict[str, Any]) -> Dict:
    """
    Synchronous version of callback (for non-async contexts)
    """
    import requests
    
    url = f"{BACKEND_URL}/api/submission/update"
    
    payload = {
        "submissionId": submission_id,
        "aiSummary": ai_summary
    }
    
    try:
        response = requests.patch(url, json=payload, timeout=CALLBACK_TIMEOUT)
        response.raise_for_status()
        
        data = response.json()
        print(f"[CALLBACK SUCCESS] Submission {submission_id} updated")
        return {
            "success": True,
            "status_code": response.status_code,
            "data": data
        }
    
    except requests.HTTPError as e:
        print(f"[CALLBACK ERROR] HTTP {e.response.status_code}: {e.response.text}")
        return {
            "success": False,
            "error": f"HTTP {e.response.status_code}",
            "details": e.response.text
        }
    
    except requests.RequestException as e:
        print(f"[CALLBACK ERROR] Request failed: {str(e)}")
        return {
            "success": False,
            "error": "Request failed",
            "details": str(e)
        }
    
    except Exception as e:
        print(f"[CALLBACK ERROR] Unexpected error: {str(e)}")
        return {
            "success": False,
            "error": "Unexpected error",
            "details": str(e)
        }
