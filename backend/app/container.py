"""Raíz de composición: el único lugar donde se crean y conectan las dependencias.

Cada servicio recibe en su constructor lo que necesita (inyección de
dependencias). Así las rutas no construyen nada y las pruebas pueden armar un
servicio con repositorios falsos, sin base de datos.
"""
from dataclasses import dataclass

from flask import Flask, current_app

from app.extensions import db
from app.repositories import (
    FuelRepository,
    IntervalRepository,
    MaintenanceRepository,
    UnitOfWork,
    UserRepository,
    VehicleRepository,
)
from app.services.auth_service import AuthService
from app.services.dashboard_service import DashboardService
from app.services.interval_service import IntervalService
from app.services.record_service import FuelService, MaintenanceService
from app.services.vehicle_service import VehicleService

EXTENSION_KEY = "smartcar"


@dataclass(frozen=True)
class Services:
    auth: AuthService
    vehicles: VehicleService
    maintenance: MaintenanceService
    fuel: FuelService
    intervals: IntervalService
    dashboard: DashboardService


def build_services(app: Flask) -> Services:
    # db.session es una sesión por petición (scoped_session): se puede compartir
    session = db.session
    uow = UnitOfWork(session)

    users = UserRepository(session)
    vehicle_repo = VehicleRepository(session)
    maintenance_repo = MaintenanceRepository(session)
    fuel_repo = FuelRepository(session)
    interval_repo = IntervalRepository(session)
    odometer_repos = (maintenance_repo, fuel_repo)

    vehicles = VehicleService(vehicle_repo, uow)
    intervals = IntervalService(vehicles, interval_repo, uow)
    return Services(
        auth=AuthService(users, uow, app.config.get("GOOGLE_CLIENT_ID")),
        vehicles=vehicles,
        maintenance=MaintenanceService(maintenance_repo, vehicles, odometer_repos, uow),
        fuel=FuelService(fuel_repo, vehicles, odometer_repos, uow),
        intervals=intervals,
        dashboard=DashboardService(vehicles, intervals, maintenance_repo, fuel_repo),
    )


def init_services(app: Flask) -> None:
    app.extensions[EXTENSION_KEY] = build_services(app)


def services(app: Flask | None = None) -> Services:
    """Acceso tipado a los servicios: services().vehicles.list(user_id)."""
    return (app or current_app).extensions[EXTENSION_KEY]
