from sqlalchemy import select

from app.models import Vehicle
from app.repositories.base import BaseRepository


class VehicleRepository(BaseRepository):
    model = Vehicle

    def list_by_user(self, user_id):
        stmt = select(Vehicle).where(Vehicle.user_id == user_id).order_by(Vehicle.id)
        return self.session.scalars(stmt).all()

    def get_for_user(self, vehicle_id, user_id):
        """Solo devuelve el vehículo si pertenece al usuario."""
        stmt = select(Vehicle).where(Vehicle.id == vehicle_id, Vehicle.user_id == user_id)
        return self.session.scalars(stmt).first()
