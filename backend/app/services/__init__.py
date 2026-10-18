from app.extensions import db
from app.repositories import (
    FuelRepository,
    MaintenanceRepository,
    UserRepository,
    VehicleRepository,
)
from app.services.auth_service import AuthService
from app.services.record_service import FuelService, MaintenanceService
from app.services.vehicle_service import VehicleService


def register_services(app):
    """Crea los repositorios y servicios una sola vez y los guarda en la app.

    En las rutas se usan así: current_app.vehicle_service.list(current_user.id)
    """
    session = db.session
    users = UserRepository(session)
    vehicles = VehicleRepository(session)
    maintenance = MaintenanceRepository(session)
    fuel = FuelRepository(session)
    all_records = (maintenance, fuel)

    app.auth_service = AuthService(users)
    app.vehicle_service = VehicleService(vehicles)
    app.maintenance_service = MaintenanceService(maintenance, app.vehicle_service, all_records)
    app.fuel_service = FuelService(fuel, app.vehicle_service, all_records)
