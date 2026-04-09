import os
from dotenv import find_dotenv, load_dotenv

# Load env file manually as fallback
env_path = find_dotenv()
if env_path:
    load_dotenv(dotenv_path=env_path, override=True)

class Settings:
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY")
    FRONTEND_URLS: str = os.getenv("FRONTEND_URLS")
    
    @property
    def cors_origins(self) -> list[str]:
        return [url.strip() for url in self.FRONTEND_URLS.split(",") if url.strip()]

settings = Settings()

if not settings.GROQ_API_KEY:
    raise Exception("GROQ_API_KEY is not set globally in the environment variables.")
