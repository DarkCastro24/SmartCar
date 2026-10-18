from app.extensions import db
from app.repositories import UserRepository, VehicleRepository
from app.services.auth_service import AuthService
from app.services.vehicle_service import VehicleService


def register_services(app):
    """Crea los repositorios y servicios una sola vez y los guarda en la app.

    En las rutas se usan así: current_app.vehicle_service.list(current_user.id)
    """
    session = db.session
    users = UserRepository(session)
    vehicles = VehicleRepository(session)

    app.auth_service = AuthService(users)
    app.vehicle_service = VehicleService(vehicles)
