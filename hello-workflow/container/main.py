from fastapi import FastAPI
import uvicorn
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Minimal FastAPI app for container testing
app = FastAPI(title="Hello Container", version="1.0.0")

@app.on_event("startup")
async def startup_event():
    logger.info("FastAPI container started successfully!")

@app.get("/", summary="Hello endpoint")
async def hello():
    """Returns hello message from container"""
    logger.info("Hello endpoint called")
    return {"message": "Hello Containers on Workflows!"}

@app.get("/health", summary="Health check")
async def health():
    """Container health check"""
    logger.info("Health check called")
    return {"status": "OK"}

if __name__ == '__main__':
    import sys
    logger.info("Python version: %s", sys.version)
    logger.info("Starting FastAPI server on 0.0.0.0:8080")
    logger.info("Process starting...")
    
    try:
        uvicorn.run(app, host="0.0.0.0", port=8080, log_level="info")
    except Exception as e:
        logger.error("Failed to start server: %s", e)
        raise
