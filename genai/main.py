# Import Uvicorn server to run the FastAPI application
import uvicorn

from app.main import app

# Start the FastAPI server only when this file is executed directly
if __name__ == "__main__":

    # Listen on all network interfaces using port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)