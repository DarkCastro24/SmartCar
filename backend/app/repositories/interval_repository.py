from sqlalchemy import select

from app.models import MaintenanceInterval
from app.repositories.base import BaseRepository


class IntervalRepository(BaseRepository[MaintenanceInterval]):
    model = MaintenanceInterval

    def by_type(self, vehicle_id):
        """{tipo: intervalo personalizado} de un vehículo."""
        stmt = select(MaintenanceInterval).where(MaintenanceInterval.vehicle_id == vehicle_id)
        return {interval.type: interval for interval in self.session.scalars(stmt)}

    def save_many(self, vehicle_id, items):
        """Crea o actualiza varios intervalos (el servicio confirma la transacción)."""
        existing = self.by_type(vehicle_id)
        for item in items:
            interval = existing.get(item["type"]) or MaintenanceInterval(
                vehicle_id=vehicle_id, type=item["type"]
            )
            interval.every_miles = item["every_miles"]
            interval.every_months = item["every_months"]
            self.session.add(interval)
            existing[item["type"]] = interval
        self.session.flush()
