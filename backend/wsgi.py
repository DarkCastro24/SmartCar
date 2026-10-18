"""Punto de entrada: `flask run` en local y `gunicorn wsgi:app` en producción."""
from app import create_app

app = create_app()
