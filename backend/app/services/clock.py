"""La fecha de "hoy" de los usuarios, no la del servidor.

Render corre en UTC: desde las 18:00 en El Salvador (UTC-6) el servidor ya está
en el día siguiente, y los días que faltan o de atraso saldrían corridos uno.
"""
import datetime as dt
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from flask import current_app, has_app_context

DEFAULT_TIMEZONE = "America/El_Salvador"
# Respaldo si falta la base de zonas horarias (Windows sin el paquete tzdata):
# El Salvador es UTC-6 todo el año, sin horario de verano
EL_SALVADOR = dt.timezone(dt.timedelta(hours=-6), "UTC-6")


def app_timezone():
    name = current_app.config.get("APP_TIMEZONE") if has_app_context() else None
    name = name or DEFAULT_TIMEZONE
    try:
        return ZoneInfo(name)
    except ZoneInfoNotFoundError:
        if name == DEFAULT_TIMEZONE:
            return EL_SALVADOR
        raise


def local_today(now=None):
    """Hoy en la zona horaria de la app (APP_TIMEZONE)."""
    now = now or dt.datetime.now(dt.UTC)
    return now.astimezone(app_timezone()).date()
