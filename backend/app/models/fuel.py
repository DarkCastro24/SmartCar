import datetime as dt
from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import db
from app.models.common import TimestampMixin, iso, money


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

    def to_dict(self):
        price = None
        if self.total_cost is not None and self.gallons:
            price = round(float(self.total_cost) / float(self.gallons), 3)
        return {
            "id": self.id,
            "vehicle_id": self.vehicle_id,
            "date": iso(self.date),
            "mileage": self.mileage,
            "gallons": float(self.gallons),
            "total_cost": money(self.total_cost),
            "price_per_gallon": price,
            "full_tank": self.full_tank,
            "notes": self.notes,
            "created_at": iso(self.created_at),
        }
