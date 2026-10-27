import datetime as dt
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import db
from app.models.common import TimestampMixin

if TYPE_CHECKING:  # solo para el editor y linters; evita imports circulares
    from app.models.vehicle import Vehicle


class FuelLog(TimestampMixin, db.Model):
    """Una carga de combustible. Con ellas se calcula el rendimiento (MPG)."""

    __tablename__ = "fuel_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    vehicle_id: Mapped[int] = mapped_column(
        ForeignKey("vehicles.id", ondelete="CASCADE"), index=True
    )
    date: Mapped[dt.date]
    mileage: Mapped[int]  # lectura del odómetro al cargar
    gallons: Mapped[Decimal] = mapped_column(Numeric(8, 3))
    total_cost: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    full_tank: Mapped[bool] = mapped_column(default=True)  # ¿se llenó el tanque?
    notes: Mapped[str | None] = mapped_column(Text)

    vehicle: Mapped["Vehicle"] = relationship(back_populates="fuel_logs")
