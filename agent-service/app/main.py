import sys
import os

# Add the parent directory to Python path so 'app' module can be found
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi import Request

from app.exceptions.architecture_exceptions import InvalidInputError, AIServiceError, ArchitectureError
from app.routers.ai_routes import router as ai_router
from app.routers.chat_routes import router as chat_router

allowed_origins = ["http://localhost:5173"]



app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(InvalidInputError)
async def invalid_input_handler(request: Request, exc: InvalidInputError):
    return JSONResponse(
        status_code=400,
        content={
            "data": None,
            "message": "Invalid request input",
            "error": str(exc),
        },
    )

@app.exception_handler(AIServiceError)
async def ai_service_handler(request: Request, exc: AIServiceError):
    return JSONResponse(
        status_code=502,
        content={
            "data": None,
            "message": "AI service failure",
            "error": str(exc),
        },
    )

@app.exception_handler(ArchitectureError)
async def architecture_base_handler(request: Request, exc: ArchitectureError):
    return JSONResponse(
        status_code=500,
        content={
            "data": None,
            "message": "Architecture generation failed",
            "error": str(exc),
        },
    )

app.include_router(ai_router)
app.include_router(chat_router)

@app.get("/health")
async def health_check():
    return {"message": "Agent service is healthy"}
