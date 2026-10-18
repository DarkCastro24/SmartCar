import datetime as dt
import enum
from decimal import Decimal

from sqlalchemy import Enum, ForeignKey, Numeric, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import db
from app.models.common import TimestampMixin, iso, money


class MaintenanceType(enum.StrEnum):
    OIL_CHANGE = "oil_change"
    AIR_FILTER = "air_filter"
    CABIN_FILTER = "cabin_filter"
    SPARK_PLUGS = "spark_plugs"
    BRAKE_PADS = "brake_pads"
    BATTERY = "battery"


MAINTENANCE_LABELS = {
    MaintenanceType.OIL_CHANGE: "Cambio de aceite",
    MaintenanceType.AIR_FILTER: "Filtro de aire",
    MaintenanceType.CABIN_FILTER: "Filtro de cabina",
    MaintenanceType.SPARK_PLUGS: "Bujías",
    MaintenanceType.BRAKE_PADS: "Pastillas de freno",
    MaintenanceType.BATTERY: "Batería",
}

# Cada cuánto toca (millas, meses). Son valores de referencia: cada usuario
# puede cambiarlos por vehículo según el manual de su carro.
DEFAULT_INTERVALS = {
    MaintenanceType.OIL_CHANGE: (5000, 6),
    MaintenanceType.AIR_FILTER: (15000, 12),
    MaintenanceType.CABIN_FILTER: (15000, 12),
    MaintenanceType.SPARK_PLUGS: (60000, 60),
    MaintenanceType.BRAKE_PADS: (30000, 36),
    MaintenanceType.BATTERY: (None, 48),
}

# Se guarda como texto ("oil_change"); así agregar un tipo nuevo no requiere migración
maintenance_type_column = Enum(
    MaintenanceType,
    name="maintenance_type",
    native_enum=False,
    length=30,
    values_callable=lambda enum_cls: [member.value for member in enum_cls],
)


class MaintenanceRecord(TimestampMixin, db.Model):
    __tablename__ = "maintenance_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    vehicle_id: Mapped[int] = mapped_column(
        ForeignKey("vehicles.id", ondelete="CASCADE"), index=True
    )
    type: Mapped[MaintenanceType] = mapped_column(maintenance_type_column)
    date: Mapped[dt.date]
    mileage: Mapped[int]
    cost: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    notes: Mapped[str | None] = mapped_column(Text)

    vehicle: Mapped["Vehicle"] = relationship(back_populates="maintenance_records")

    def to_dict(self):
        return {
            "id": self.id,
            "vehicle_id": self.vehicle_id,
            "type": self.type.value,
            "label": MAINTENANCE_LABELS[self.type],
            "date": iso(self.date),
            "mileage": self.mileage,
            "cost": money(self.cost),
            "notes": self.notes,
            "created_at": iso(self.created_at),
        }


class MaintenanceInterval(db.Model):
    """Intervalo personalizado de un vehículo; si no existe se usa DEFAULT_INTERVALS."""

    __tablename__ = "maintenance_intervals"
    __table_args__ = (UniqueConstraint("vehicle_id", "type"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    vehicle_id: Mapped[int] = mapped_column(
        ForeignKey("vehicles.id", ondelete="CASCADE"), index=True
    )
    type: Mapped[MaintenanceType] = mapped_column(maintenance_type_column)
    every_miles: Mapped[int | None]
    every_months: Mapped[int | None]

    vehicle: Mapped["Vehicle"] = relationship(back_populates="intervals")
