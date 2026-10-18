from flask import Blueprint, jsonify
from sqlalchemy import text

from app.extensions import db

meta_bp = Blueprint("meta", __name__, url_prefix="/api")


@meta_bp.get("/health")
def health():
    """Comprueba que la API y la base de datos responden (Render lo usa como health check)."""
    db.session.execute(text("SELECT 1"))
    return {"status": "ok"}
