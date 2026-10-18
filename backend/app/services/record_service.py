from flask import abort


class VehicleRecordService:
    """Lógica común para registrar y consultar mantenimientos y cargas de combustible."""

    not_found_message = "Registro no encontrado"

    def __init__(self, repository, vehicle_service, odometer_repositories):
        self.repo = repository
        self.vehicles = vehicle_service
        # Repositorios cuyos registros se comparan para validar el odómetro
        self.odometer_repos = odometer_repositories

    def list(self, user_id, vehicle_id, **filters):
        vehicle = self.vehicles.get(user_id, vehicle_id)  # 404 si no es suyo
        return self.repo.list_for_vehicle(vehicle.id, **filters)

    def get(self, user_id, record_id):
        record = self.repo.get_for_user(record_id, user_id)
        if record is None:
            abort(404, description=self.not_found_message)
        return record

    def create(self, user_id, vehicle_id, data):
        vehicle = self.vehicles.get(user_id, vehicle_id)
        self._check_odometer(vehicle.id, data["date"], data["mileage"])
        return self.repo.add(self.repo.model(vehicle_id=vehicle.id, **data))

    def update(self, user_id, record_id, data):
        record = self.get(user_id, record_id)
        self._check_odometer(
            record.vehicle_id,
            data.get("date", record.date),
            data.get("mileage", record.mileage),
            exclude=record,
        )
        return self.repo.update(record, data)

    def delete(self, user_id, record_id):
        self.repo.delete(self.get(user_id, record_id))

    def _check_odometer(self, vehicle_id, record_date, mileage, exclude=None):
        """El odómetro solo avanza: un registro más reciente no puede tener menos millas."""
        for repo in self.odometer_repos:
            exclude_id = exclude.id if isinstance(exclude, repo.model) else None
            conflict = repo.find_odometer_conflict(vehicle_id, record_date, mileage, exclude_id)
            if conflict:
                abort(
                    400,
                    description=(
                        f"El millaje {mileage:,} no cuadra con el registro del "
                        f"{conflict.date:%d/%m/%Y} ({conflict.mileage:,} mi). "
                        "Revisa la fecha o las millas."
                    ),
                )


class MaintenanceService(VehicleRecordService):
    not_found_message = "Mantenimiento no encontrado"


class FuelService(VehicleRecordService):
    not_found_message = "Carga de combustible no encontrada"
