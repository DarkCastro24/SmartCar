import datetime as dt
from decimal import Decimal

from sqlalchemy import DateTime
from sqlalchemy.orm import Mapped, mapped_column


def utcnow():
    return dt.datetime.now(dt.timezone.utc)


def iso(value):
    """Fecha u hora a texto ISO 8601 (jsonify las convertiría a un formato raro)."""
    return value.isoformat() if value is not None else None


def money(value: Decimal | None):
    return float(value) if value is not None else None


class TimestampMixin:
    """Agrega la columna created_at a cualquier modelo."""

    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
