from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from app.routers.projects import router as projects_router
from app.db.database import engine, Base 

allowed_origins = ["http://localhost:5173"]

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    async with engine.begin() as conn:
        # Warning: This is great for dev, but use migrations (Alembic) for production!
        await conn.run_sync(Base.metadata.create_all)
        
app.include_router(projects_router, prefix="/projects")
 
@app.get("/")
async def root():
    return {"message": "Welcome to the Project Service API"}
