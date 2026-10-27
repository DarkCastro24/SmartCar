from __future__ import annotations

import datetime as dt
from collections.abc import Sequence
from typing import Any, Generic

from app.domain.errors import NotFoundError, OdometerConflictError
from app.models import FuelLog, MaintenanceRecord
from app.repositories import UnitOfWork
from app.repositories.record_repository import Record, VehicleRecordRepository
from app.services.vehicle_service import VehicleService


class VehicleRecordService(Generic[Record]):
    """Casos de uso comunes de mantenimientos y cargas de combustible.

    Las subclases solo cambian el repositorio y el mensaje de "no encontrado";
    la regla del odómetro y el control de dueño se escriben una sola vez.
    """

    not_found_message = "Registro no encontrado"

    def __init__(
        self,
        repository: VehicleRecordRepository[Record],
        vehicles: VehicleService,
        odometer_repositories: Sequence[VehicleRecordRepository],
        uow: UnitOfWork,
    ):
        self.repo = repository
        self.vehicles = vehicles
        # Todos los registros con millaje del vehículo, para validar el odómetro
        self.odometer_repos = odometer_repositories
        self.uow = uow

    def list(self, user_id: int, vehicle_id: int, **filters: Any) -> list[Record]:
        vehicle = self.vehicles.get(user_id, vehicle_id)  # NotFoundError si no es suyo
        return self.repo.list_for_vehicle(vehicle.id, **filters)

    def get(self, user_id: int, record_id: int) -> Record:
        record = self.repo.get_for_user(record_id, user_id)
        if record is None:
            raise NotFoundError(self.not_found_message)
        return record

    def create(self, user_id: int, vehicle_id: int, data: dict[str, Any]) -> Record:
        vehicle = self.vehicles.get(user_id, vehicle_id)
        self.check_odometer(vehicle.id, data["date"], data["mileage"])
        with self.uow.transaction():
            return self.repo.add(self.repo.model(vehicle_id=vehicle.id, **data))

    def update(self, user_id: int, record_id: int, data: dict[str, Any]) -> Record:
        record = self.get(user_id, record_id)
        self.check_odometer(
            record.vehicle_id,
            data.get("date", record.date),
            data.get("mileage", record.mileage),
            exclude=record,
        )
        with self.uow.transaction():
            return self.repo.update(record, data)

    def delete(self, user_id: int, record_id: int) -> None:
        record = self.get(user_id, record_id)
        with self.uow.transaction():
            self.repo.delete(record)

    def check_odometer(
        self, vehicle_id: int, record_date: dt.date, mileage: int, exclude: object | None = None
    ) -> None:
        """El odómetro solo avanza: un registro más reciente no puede tener menos millas.

        Se compara contra mantenimientos Y cargas de combustible del vehículo.
        """
        for repo in self.odometer_repos:
            exclude_id = exclude.id if isinstance(exclude, repo.model) else None
            conflict = repo.find_odometer_conflict(vehicle_id, record_date, mileage, exclude_id)
            if conflict:
                raise OdometerConflictError(mileage, conflict.date, conflict.mileage)


class MaintenanceService(VehicleRecordService[MaintenanceRecord]):
    not_found_message = "Mantenimiento no encontrado"


class FuelService(VehicleRecordService[FuelLog]):
    not_found_message = "Carga de combustible no encontrada"
