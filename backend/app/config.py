import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-here-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

# Frontend URL for password reset links
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://dayspring-hub.vercel.app")