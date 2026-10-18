from app.repositories.interval_repository import IntervalRepository
from app.repositories.record_repository import FuelRepository, MaintenanceRepository
from app.repositories.user_repository import UserRepository
from app.repositories.vehicle_repository import VehicleRepository

__all__ = [
    "FuelRepository",
    "IntervalRepository",
    "MaintenanceRepository",
    "UserRepository",
    "VehicleRepository",
]
