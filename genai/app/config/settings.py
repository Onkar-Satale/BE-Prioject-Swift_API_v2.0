import os
from dotenv import find_dotenv, load_dotenv

# Locate the .env file
env_path = find_dotenv()

# Load environment variables if the .env file exists
if env_path:
    load_dotenv(dotenv_path=env_path, override=True)

# Centralized application configuration
class Settings:
    # API key used to access Groq LLM services
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY")

    # Shared secret used to authenticate requests from the backend
    GENAI_API_SECRET: str = os.getenv(
        "GENAI_API_SECRET"
    )

# Create a single shared configuration instance
settings = Settings()

# Stop startup if the Groq API key is missing
if not settings.GROQ_API_KEY:
    raise Exception("GROQ_API_KEY is missing. Please set it in the .env file.")