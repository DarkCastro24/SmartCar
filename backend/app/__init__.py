"""SmartCar API: aquí se arma la aplicación (patrón application factory)."""
from flask import Flask

from app import models  # noqa: F401  (registra las tablas para las migraciones)
from app.commands import register_commands
from app.config import Config
from app.errors import register_error_handlers
from app.extensions import cors, db, jwt, migrate
from app.routes import register_blueprints
from app.security import register_jwt_callbacks
from app.services import register_services


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    app.json.ensure_ascii = False  # "Batería" en vez de "Bater\u00eda"

    if not app.config.get("JWT_SECRET_KEY"):
        raise RuntimeError("Falta JWT_SECRET_KEY. Copia .env.example como .env y complétalo.")

    # 1. Conectar extensiones
    db.init_app(app)
    migrate.init_app(app, db, render_as_batch=True)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})

    # 2. Errores en JSON, tokens, servicios, rutas y comandos
    register_error_handlers(app)
    register_jwt_callbacks()
    register_services(app)
    register_blueprints(app)
    register_commands(app)

    return app
