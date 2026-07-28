import os  # Access environment variables
from dotenv import find_dotenv, load_dotenv  # Find and load .env file

# Find the .env file
env_path = find_dotenv()

# Load variables from .env if found
if env_path:
    load_dotenv(dotenv_path=env_path, override=True)

# Store application configuration
class Settings:
    # Read Groq API key from .env
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY")

    # Read API secret or use default if missing
    GENAI_API_SECRET: str = os.getenv(
        "GENAI_API_SECRET"
    )

# Create a global settings object
settings = Settings()

# Stop the app if the Groq API key is missing
if not settings.GROQ_API_KEY:
    raise Exception("GROQ_API_KEY is missing. Please set it in the .env file.")