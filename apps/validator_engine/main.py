from fastapi import FastAPI
from routers.validate_router import router as validate_router
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI(
    title="AI Validation Engine",
    version="1.0.0",
    description="AI-powered fraud detection and risk scoring for loan utilization verification."
)

app.include_router(validate_router, prefix="/validate", tags=["Validation"])


@app.get("/")
def root():
    return {"message": "Validation Engine Running"}
