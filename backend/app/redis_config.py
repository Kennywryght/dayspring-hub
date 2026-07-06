import redis
import os
import json
import logging
from functools import wraps
from typing import Optional, Any, Dict
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class RedisClient:
    """Singleton Redis client for caching"""
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(RedisClient, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance
    
    def _initialize(self):
        redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')
        self.default_ttl = int(os.getenv('REDIS_DEFAULT_TTL', '300'))
        self.enabled = os.getenv('CACHE_ENABLED', 'true').lower() == 'true'
        
        try:
            self.client = redis.from_url(
                redis_url,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True,
                health_check_interval=30
            )
            # Test connection
            self.client.ping()
            logger.info(f"✅ Redis connected successfully at {redis_url}")
        except Exception as e:
            logger.warning(f"⚠️ Redis connection failed: {e}. Caching will be disabled.")
            self.client = None
            self.enabled = False
    
    def is_connected(self) -> bool:
        """Check if Redis is connected"""
        if not self.enabled or not self.client:
            return False
        try:
            return self.client.ping()
        except:
            return False
    
    def get(self, key: str) -> Optional[str]:
        """Get value from cache"""
        if not self.is_connected():
            return None
        try:
            return self.client.get(key)
        except redis.RedisError as e:
            logger.warning(f"Redis get error: {e}")
            return None
    
    def set(self, key: str, value: str, ttl: int = None):
        """Set value in cache with TTL"""
        if not self.is_connected():
            return
        try:
            self.client.setex(
                key,
                ttl or self.default_ttl,
                value
            )
        except redis.RedisError as e:
            logger.warning(f"Redis set error: {e}")
    
    def delete(self, key: str):
        """Delete a key from cache"""
        if not self.is_connected():
            return
        try:
            self.client.delete(key)
        except redis.RedisError as e:
            logger.warning(f"Redis delete error: {e}")
    
    def clear_pattern(self, pattern: str):
        """Clear all keys matching a pattern"""
        if not self.is_connected():
            return
        try:
            keys = self.client.keys(pattern)
            if keys:
                self.client.delete(*keys)
                logger.info(f"Cleared {len(keys)} cache keys matching pattern: {pattern}")
        except redis.RedisError as e:
            logger.warning(f"Redis clear pattern error: {e}")
    
    def get_cached_or_fetch(self, key: str, fetch_func, ttl: int = None):
        """Get from cache or fetch and cache"""
        if not self.is_connected():
            return fetch_func()
        
        cached = self.get(key)
        if cached is not None:
            return json.loads(cached)
        
        result = fetch_func()
        if result is not None:
            self.set(key, json.dumps(result), ttl)
        return result
    
    def get_stats(self) -> Dict:
        """Get Redis stats"""
        if not self.is_connected():
            return {"connected": False}
        try:
            info = self.client.info()
            keys = self.client.keys("*")
            return {
                "connected": True,
                "used_memory": info.get("used_memory_human", "N/A"),
                "total_keys": len(keys),
                "uptime": info.get("uptime_in_seconds", 0),
                "hit_rate": info.get("keyspace_hits", 0) / max(
                    info.get("keyspace_hits", 0) + info.get("keyspace_misses", 0), 1
                )
            }
        except Exception as e:
            return {"connected": False, "error": str(e)}


# Cache decorator for FastAPI endpoints
def cache_response(ttl: int = 300, key_prefix: str = "", user_specific: bool = False, class_specific: bool = False):
    """
    Decorator to cache FastAPI endpoint responses
    
    Args:
        ttl: Time to live in seconds
        key_prefix: Prefix for cache key
        user_specific: Include user ID in cache key
        class_specific: Include class_id in cache key
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            redis_client = RedisClient()
            
            if not redis_client.is_connected():
                return await func(*args, **kwargs)
            
            # Build cache key
            cache_key = f"{key_prefix}:{func.__name__}"
            
            # Add user-specific key if needed
            if user_specific and kwargs.get('current_user'):
                user_id = kwargs['current_user'].get('user_id', 'anonymous')
                cache_key = f"{cache_key}:user_{user_id}"
            
            # Add class-specific key if needed
            if class_specific and kwargs.get('class_id'):
                cache_key = f"{cache_key}:class_{kwargs['class_id']}"
            
            # Try to get from cache
            cached_data = redis_client.get(cache_key)
            if cached_data is not None:
                return json.loads(cached_data)
            
            # Execute function
            result = await func(*args, **kwargs)
            
            # Cache result if not None
            if result is not None:
                redis_client.set(cache_key, json.dumps(result), ttl)
            
            return result
        return wrapper
    return decorator


# Cache invalidation helpers
def invalidate_cache(pattern: str):
    """Invalidate all cache keys matching a pattern"""
    redis_client = RedisClient()
    if redis_client.is_connected():
        redis_client.clear_pattern(pattern)


def invalidate_user_cache(user_id: str):
    """Invalidate all cache for a specific user"""
    invalidate_cache(f"*user_{user_id}*")


def invalidate_class_cache(class_id: str):
    """Invalidate all cache for a specific class"""
    invalidate_cache(f"*class_{class_id}*")


def invalidate_all_assignments():
    """Invalidate all assignment caches"""
    invalidate_cache("assignments:*")


def invalidate_all_quizzes():
    """Invalidate all quiz caches"""
    invalidate_cache("quizzes:*")