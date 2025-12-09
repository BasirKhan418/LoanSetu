import hashlib
import json
from datetime import datetime
from typing import Dict, Any, Optional
import os


class LedgerService:
    """
    Blockchain-style ledger for audit trail
    Each entry is hash-chained to previous entry
    """
    
    def __init__(self):
        self.entries = []
        self.previous_hash = "0" * 64  # Genesis hash
    
    def add_entry(self, event_type: str, event_data: Dict[str, Any], 
                  submission_id: str, performed_by: str = "system") -> Dict:
        """
        Add a new ledger entry with hash chaining
        """
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        entry = {
            "timestamp": timestamp,
            "event_type": event_type,
            "submission_id": submission_id,
            "event_data": event_data,
            "performed_by": performed_by,
            "previous_hash": self.previous_hash
        }
        
        # Calculate hash of this entry
        entry_hash = self._calculate_hash(entry)
        entry["entry_hash"] = entry_hash
        
        # Update previous hash for next entry
        self.previous_hash = entry_hash
        
        self.entries.append(entry)
        
        # Log to console (in production, send to backend or file)
        print(f"[LEDGER] {event_type} | Hash: {entry_hash[:16]}... | Submission: {submission_id}")
        
        return entry
    
    def _calculate_hash(self, entry: Dict) -> str:
        """
        Calculate SHA-256 hash of entry
        """
        # Create deterministic string from entry
        entry_copy = entry.copy()
        entry_copy.pop("entry_hash", None)  # Remove hash if exists
        
        entry_string = json.dumps(entry_copy, sort_keys=True)
        return hashlib.sha256(entry_string.encode()).hexdigest()
    
    def get_entries(self) -> list:
        """
        Get all ledger entries
        """
        return self.entries
    
    def verify_chain(self) -> bool:
        """
        Verify integrity of hash chain
        """
        if not self.entries:
            return True
        
        previous_hash = "0" * 64
        
        for entry in self.entries:
            # Verify previous hash matches
            if entry["previous_hash"] != previous_hash:
                print(f"[LEDGER ERROR] Hash chain broken at {entry['timestamp']}")
                return False
            
            # Verify entry hash
            calculated_hash = self._calculate_hash(entry)
            if calculated_hash != entry["entry_hash"]:
                print(f"[LEDGER ERROR] Entry hash mismatch at {entry['timestamp']}")
                return False
            
            previous_hash = entry["entry_hash"]
        
        return True


# Global ledger instance
_ledger = LedgerService()


def log_validation_step(submission_id: str, step_name: str, result: Dict[str, Any]):
    """
    Log a validation step to the ledger
    """
    _ledger.add_entry(
        event_type=f"VALIDATION_{step_name.upper()}",
        event_data=result,
        submission_id=submission_id,
        performed_by="validation_engine"
    )


def log_validation_start(submission_id: str, payload: Dict[str, Any]):
    """
    Log start of validation
    """
    _ledger.add_entry(
        event_type="VALIDATION_STARTED",
        event_data={
            "tenant_id": payload.get("tenantId"),
            "loan_id": payload.get("loanId"),
            "media_count": len(payload.get("media", []))
        },
        submission_id=submission_id,
        performed_by="validation_engine"
    )


def log_validation_complete(submission_id: str, result: Dict[str, Any]):
    """
    Log completion of validation
    """
    _ledger.add_entry(
        event_type="VALIDATION_COMPLETED",
        event_data=result,
        submission_id=submission_id,
        performed_by="validation_engine"
    )


def get_ledger_entries():
    """
    Get all ledger entries
    """
    return _ledger.get_entries()


def verify_ledger_integrity():
    """
    Verify ledger hash chain integrity
    """
    return _ledger.verify_chain()
