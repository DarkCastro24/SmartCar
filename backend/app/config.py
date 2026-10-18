import os
from datetime import timedelta

from dotenv import load_dotenv

# Lee las variables del archivo .env (si existe)
load_dotenv()


def database_url():
    """Lee DATABASE_URL y la adapta al driver psycopg 3 de PostgreSQL."""
    url = os.getenv("DATABASE_URL") or "sqlite:///smartcar.db"
    # Neon, Supabase y Render entregan "postgres://" o "postgresql://"
    for prefix in ("postgres://", "postgresql://"):
        if url.startswith(prefix):
            return "postgresql+psycopg://" + url[len(prefix):]
    return url


def split_csv(value):
    return [item.strip() for item in value.split(",") if item.strip()]


class Config:
    SQLALCHEMY_DATABASE_URI = database_url()
    # Revisa que la conexión siga viva (las BD en la nube cierran conexiones inactivas)
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=int(os.getenv("JWT_EXPIRES_HOURS", "168")))

    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
    CORS_ORIGINS = split_csv(os.getenv("FRONTEND_URL", "http://localhost:5173"))


class TestConfig(Config):
    """Configuración para pytest: base de datos SQLite en memoria."""

    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite://"
    SQLALCHEMY_ENGINE_OPTIONS = {}
    JWT_SECRET_KEY = "clave-solo-para-pruebas-con-mas-de-32-caracteres"
    GOOGLE_CLIENT_ID = "test-client-id.apps.googleusercontent.com"
    CORS_ORIGINS = ["http://localhost:5173"]
