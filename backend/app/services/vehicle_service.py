from flask import abort

from app.models import Vehicle


class VehicleService:
    def __init__(self, vehicle_repository):
        self.repo = vehicle_repository

    def list(self, user_id):
        return self.repo.list_by_user(user_id)

    def get(self, user_id, vehicle_id):
        """Busca el vehículo del usuario; si es de otra persona responde 404."""
        vehicle = self.repo.get_for_user(vehicle_id, user_id)
        if vehicle is None:
            abort(404, description="Vehículo no encontrado")
        return vehicle

    def create(self, user_id, data):
        return self.repo.add(Vehicle(user_id=user_id, **data))

    def update(self, user_id, vehicle_id, data):
        return self.repo.update(self.get(user_id, vehicle_id), data)

    def delete(self, user_id, vehicle_id):
        # Borra también sus mantenimientos y cargas de combustible (cascade)
        self.repo.delete(self.get(user_id, vehicle_id))
