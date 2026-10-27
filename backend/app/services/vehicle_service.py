from __future__ import annotations

from typing import Any

from app.domain.errors import NotFoundError
from app.models import Vehicle
from app.repositories import UnitOfWork, VehicleRepository


class VehicleService:
    def __init__(self, vehicles: VehicleRepository, uow: UnitOfWork):
        self.repo = vehicles
        self.uow = uow

    def list(self, user_id: int) -> list[Vehicle]:
        return self.repo.list_by_user(user_id)

    def get(self, user_id: int, vehicle_id: int) -> Vehicle:
        """Busca el vehículo del usuario. Si es de otra persona se responde igual
        que si no existiera, para no revelar qué ids están en uso."""
        vehicle = self.repo.get_for_user(vehicle_id, user_id)
        if vehicle is None:
            raise NotFoundError("Vehículo no encontrado")
        return vehicle

    def create(self, user_id: int, data: dict[str, Any]) -> Vehicle:
        with self.uow.transaction():
            return self.repo.add(Vehicle(user_id=user_id, **data))

    def update(self, user_id: int, vehicle_id: int, data: dict[str, Any]) -> Vehicle:
        vehicle = self.get(user_id, vehicle_id)
        with self.uow.transaction():
            return self.repo.update(vehicle, data)

    def delete(self, user_id: int, vehicle_id: int) -> None:
        vehicle = self.get(user_id, vehicle_id)
        # Borra también sus mantenimientos, cargas e intervalos (cascade)
        with self.uow.transaction():
            self.repo.delete(vehicle)
