# Import Uvicorn server to run the FastAPI application
import uvicorn

# Import the FastAPI app instance from app/main.py
from app.main import app

# Execute only when this file is run directly
if __name__ == "__main__":
    
    # Start the FastAPI app on port 8000 and listen on all network interfaces
    uvicorn.run(app, host="0.0.0.0", port=8000)