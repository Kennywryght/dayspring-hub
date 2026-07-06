import time
from typing import Dict, Tuple
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)

class RateLimiter:
    """
    In-memory rate limiter for password reset requests
    """
    def __init__(self):
        self.requests: Dict[str, list] = defaultdict(list)
        self.max_requests = 5
        self.time_window = 3600  # 1 hour
    
    def is_allowed(self, email: str, ip_address: str) -> Tuple[bool, int]:
        current_time = time.time()
        
        # Clean old requests
        self.requests[email] = [
            req for req in self.requests[email] 
            if current_time - req[0] < self.time_window
        ]
        
        if len(self.requests[email]) >= self.max_requests:
            oldest = min(req[0] for req in self.requests[email])
            wait_time = int(self.time_window - (current_time - oldest))
            return False, wait_time
        
        self.requests[email].append((current_time, ip_address))
        remaining = self.max_requests - len(self.requests[email])
        return True, remaining

rate_limiter = RateLimiter()