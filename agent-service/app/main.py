import sys
import os

# Add the parent directory to Python path so 'app' module can be found
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.routers import agent_route
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

origins = ["http://localhost:8081"]



app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(agent_route.router, prefix="/agent")

@app.get("/")
async def root():
    return {"message": "Welcome to the Agent Service API"}
