# Base image with Python 3.9 (slim = smaller and lighter image)
FROM python:3.9-slim

# Set /app as the working directory inside the container
WORKDIR /app

# Copy dependency list first (helps Docker cache dependencies)
COPY requirements.txt .

# Install all required Python packages
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire project into the container
COPY . .

# Inform Docker that the app runs on port 8000
EXPOSE 8000

# Start the FastAPI app using Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]