import logging
from datetime import datetime
from typing import Optional
from app.database import supabase

logger = logging.getLogger(__name__)

async def audit_log(
    action: str,
    user_id: Optional[str] = None,
    user_email: Optional[str] = None,
    status: str = "INFO",
    ip_address: Optional[str] = None,
    token: Optional[str] = None,
    token_expiry: Optional[str] = None,
    error: Optional[str] = None
):
    """Log security-related events for auditing"""
    log_entry = {
        "action": action,
        "timestamp": datetime.utcnow().isoformat(),
        "status": status,
        "user_id": user_id,
        "user_email": user_email,
        "ip_address": ip_address
    }
    
    if token:
        log_entry["token"] = token[:20] + "..."
    if token_expiry:
        log_entry["token_expiry"] = token_expiry
    if error:
        log_entry["error"] = error
    
    try:
        supabase.table("audit_logs").insert(log_entry).execute()
    except Exception as db_error:
        logger.error(f"Failed to write audit log: {db_error}")
    
    log_message = f"[AUDIT] {action} | User: {user_id or user_email or 'anonymous'} | Status: {status} | IP: {ip_address}"
    if error:
        log_message += f" | Error: {error}"
    logger.info(log_message)