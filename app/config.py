from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    REDIS_URL: str = "redis://localhost:6379"

    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"

    RESEND_API_KEY: str = ""
    EMAILS_FROM: str = "noreply@smartcity.gov.in"

    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    APP_NAME: str = "Smart City GIMS"
    FRONTEND_URL: str = "http://localhost:5173"
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    SLA_P1_HOURS: int = 4
    SLA_P2_HOURS: int = 24
    SLA_P3_HOURS: int = 72
    SLA_P4_HOURS: int = 168

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
