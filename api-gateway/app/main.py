from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.middleware.auth import auth_middleware
from app.routes.ai_routes import router as ai_router
from app.routes.project_routes import router as project_router

app = FastAPI()

# 1. Define allowed origins (your frontend development port)
origins = [
    "http://localhost:5173",
]

# 2. Add CORSMiddleware FIRST
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],  # Allows all headers (Authorization, Content-Type, etc.)
)

# 3. Add your custom Auth middleware SECOND
app.middleware("http")(auth_middleware)

# 4. Include your routers
app.include_router(project_router, prefix="/api")
app.include_router(ai_router, prefix="/api")
