import os
import json
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")

_raw_origins = os.getenv("CORS_ORIGINS", '["http://localhost:5173"]')
try:
    CORS_ORIGINS = json.loads(_raw_origins)
except Exception:
    CORS_ORIGINS = ["http://localhost:5173"]