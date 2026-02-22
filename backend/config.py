import os
from dotenv import load_dotenv

DATABASE_URL = os.getenv("DATABASE_URL")
SECRET_KEY = os.getenv("SECRET_KEY", "supersecret")
CORS_ORIGINS = ["http://localhost:5173"]