import os
import sys
from contextlib import asynccontextmanager

# Add the parent directory to Python path so 'app' module can be found
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.redis import close_redis, connect_redis
from app.core.logging import get_logger, setup_logging
from app.routers.ai_routes import router as ai_router
from app.routers.chat_routes import router as chat_router
from app.routers.diagram_routes import router as diagram_router

setup_logging()
logger = get_logger(__name__)

allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8002",
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up agent-service...")
    await connect_redis()
    yield
    logger.info("Shutting down agent-service...")
    await close_redis()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_router)
app.include_router(chat_router)
app.include_router(diagram_router)


@app.get("/health")
async def health_check():
    return {"message": "Agent service is healthy"}
