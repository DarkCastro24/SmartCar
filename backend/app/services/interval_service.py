from __future__ import annotations

from typing import Any

from app.models import DEFAULT_INTERVALS, MAINTENANCE_LABELS, MaintenanceType, Vehicle
from app.repositories import IntervalRepository, UnitOfWork
from app.services.vehicle_service import VehicleService


class IntervalService:
    """Cada cuánto toca cada mantenimiento: valores sugeridos o personalizados."""

    def __init__(self, vehicles: VehicleService, intervals: IntervalRepository, uow: UnitOfWork):
        self.vehicles = vehicles
        self.repo = intervals
        self.uow = uow

    def for_vehicle(self, vehicle: Vehicle) -> dict[MaintenanceType, dict[str, Any]]:
        """{tipo: intervalo}; usa el personalizado si existe y si no el sugerido."""
        custom = self.repo.by_type(vehicle.id)
        result = {}
        for mtype in MaintenanceType:
            if mtype in custom:
                miles, months = custom[mtype].every_miles, custom[mtype].every_months
            else:
                miles, months = DEFAULT_INTERVALS[mtype]
            result[mtype] = {
                "type": mtype.value,
                "label": MAINTENANCE_LABELS[mtype],
                "every_miles": miles,
                "every_months": months,
                "is_custom": mtype in custom,
            }
        return result

    def list(self, user_id: int, vehicle_id: int) -> list[dict[str, Any]]:
        vehicle = self.vehicles.get(user_id, vehicle_id)
        return list(self.for_vehicle(vehicle).values())

    def save(self, user_id: int, vehicle_id: int, items: list[dict[str, Any]]) -> list[dict[str, Any]]:
        vehicle = self.vehicles.get(user_id, vehicle_id)
        with self.uow.transaction():  # se guardan todos o ninguno
            self.repo.save_many(vehicle.id, items)
        return list(self.for_vehicle(vehicle).values())

    def reset(self, user_id: int, vehicle_id: int, mtype: MaintenanceType) -> list[dict[str, Any]]:
        """Vuelve al intervalo sugerido."""
        vehicle = self.vehicles.get(user_id, vehicle_id)
        interval = self.repo.by_type(vehicle.id).get(mtype)
        if interval is not None:
            with self.uow.transaction():
                self.repo.delete(interval)
        return list(self.for_vehicle(vehicle).values())
