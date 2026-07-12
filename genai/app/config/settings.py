import os
from dotenv import find_dotenv, load_dotenv

# Load env file manually as fallback
env_path = find_dotenv()
if env_path:
    load_dotenv(dotenv_path=env_path, override=True)

class Settings:
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY")
    GENAI_API_SECRET: str = os.getenv("GENAI_API_SECRET", "my_super_secret_ai_token_123")

settings = Settings()

if not settings.GROQ_API_KEY:
    raise Exception("GROQ_API_KEY is missing. Please set it in the .env file.")
