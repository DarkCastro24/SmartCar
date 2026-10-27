from typing import TypeVar

from sqlalchemy import and_, func, or_, select

from app.models import FuelLog, MaintenanceRecord, Vehicle
from app.repositories.base import BaseRepository

Record = TypeVar("Record", MaintenanceRecord, FuelLog)


class VehicleRecordRepository(BaseRepository[Record]):
    """Consultas comunes para registros de un vehículo (mantenimientos y combustible)."""

    def get_for_user(self, record_id, user_id):
        """Solo devuelve el registro si su vehículo pertenece al usuario."""
        model = self.model
        stmt = (
            select(model)
            .join(Vehicle)
            .where(model.id == record_id, Vehicle.user_id == user_id)
        )
        return self.session.scalars(stmt).first()

    def list_for_vehicle(self, vehicle_id, date_from=None, date_to=None, oldest_first=False, **equals):
        model = self.model
        stmt = select(model).where(model.vehicle_id == vehicle_id)
        if date_from:
            stmt = stmt.where(model.date >= date_from)
        if date_to:
            stmt = stmt.where(model.date <= date_to)
        for field, value in equals.items():  # p. ej. type=MaintenanceType.OIL_CHANGE
            if value is not None:
                stmt = stmt.where(getattr(model, field) == value)

        if oldest_first:
            order = (model.date, model.mileage, model.id)
        else:
            order = (model.date.desc(), model.mileage.desc(), model.id.desc())
        return self.session.scalars(stmt.order_by(*order)).all()

    def find_odometer_conflict(self, vehicle_id, record_date, mileage, exclude_id=None):
        """Busca un registro que contradiga el odómetro: una fecha anterior con más
        millas o una fecha posterior con menos millas."""
        model = self.model
        stmt = select(model).where(
            model.vehicle_id == vehicle_id,
            or_(
                and_(model.date < record_date, model.mileage > mileage),
                and_(model.date > record_date, model.mileage < mileage),
            ),
        )
        if exclude_id is not None:
            stmt = stmt.where(model.id != exclude_id)
        return self.session.scalars(stmt.limit(1)).first()

    def max_mileage(self, vehicle_id):
        stmt = select(func.max(self.model.mileage)).where(self.model.vehicle_id == vehicle_id)
        return self.session.scalar(stmt)


class MaintenanceRepository(VehicleRecordRepository[MaintenanceRecord]):
    model = MaintenanceRecord

    def latest_by_type(self, vehicle_id):
        """{tipo: último mantenimiento de ese tipo}"""
        latest = {}
        for record in self.list_for_vehicle(vehicle_id):  # del más reciente al más antiguo
            latest.setdefault(record.type, record)
        return latest


class FuelRepository(VehicleRecordRepository[FuelLog]):
    model = FuelLog
