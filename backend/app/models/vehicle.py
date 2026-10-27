from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import db
from app.models.common import TimestampMixin

if TYPE_CHECKING:  # solo para el editor y linters; evita imports circulares
    from app.models.fuel import FuelLog
    from app.models.maintenance import MaintenanceInterval, MaintenanceRecord
    from app.models.user import User


class Vehicle(TimestampMixin, db.Model):
    __tablename__ = "vehicles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    make: Mapped[str] = mapped_column(String(50))  # marca: Toyota
    model: Mapped[str] = mapped_column(String(50))  # modelo: Corolla
    year: Mapped[int | None]
    plate: Mapped[str | None] = mapped_column(String(20))  # placa
    color: Mapped[str | None] = mapped_column(String(30))
    initial_mileage: Mapped[int] = mapped_column(default=0)  # millas al registrarlo en la app

    owner: Mapped["User"] = relationship(back_populates="vehicles")
    # cascade: al borrar el vehículo se borran también sus registros
    maintenance_records: Mapped[list["MaintenanceRecord"]] = relationship(
        back_populates="vehicle", cascade="all, delete-orphan"
    )
    fuel_logs: Mapped[list["FuelLog"]] = relationship(
        back_populates="vehicle", cascade="all, delete-orphan"
    )
    intervals: Mapped[list["MaintenanceInterval"]] = relationship(
        back_populates="vehicle", cascade="all, delete-orphan"
    )
