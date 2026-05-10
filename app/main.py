from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import auth, complaints, webhooks, analytics

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="AI-powered citizen grievance & infrastructure management platform for smart cities.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(complaints.router)
app.include_router(webhooks.router)
app.include_router(analytics.router)


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok", "version": "1.0.0"}
