from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.api.routes import router

app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "CINEVERSE AI: Cinematic movie discovery & popularity-based recommendation platform. "
        "Implements the IMDb Weighted Rating algorithm and curated entertainment discovery."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Safe error response that does not expose internal stack traces
    return JSONResponse(
        status_code=500,
        content={"error": "An unexpected error occurred while processing the request."}
    )


# Register all API endpoints
app.include_router(router)

# Mount local posters directory if available
posters_dir = Path(__file__).resolve().parent.parent.parent / "frontend" / "public" / "posters"
if posters_dir.exists():
    app.mount("/posters", StaticFiles(directory=str(posters_dir)), name="posters")


@app.get("/")
def root():
    return {
        "service": settings.APP_NAME,
        "tagline": "Discover Beyond the Screen.",
        "documentation": "/docs",
        "health": "/api/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
