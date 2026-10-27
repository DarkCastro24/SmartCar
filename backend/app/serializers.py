"""Cómo se ve cada modelo en el JSON de la API (capa de presentación).

Los modelos solo describen tablas; aquí se decide el formato de salida:
fechas en ISO 8601, dinero como número y etiquetas en español.
"""
from app.models import MAINTENANCE_LABELS, FuelLog, MaintenanceRecord, User, Vehicle
from app.models.common import iso, money


def user_json(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "picture": user.picture,
        "created_at": iso(user.created_at),
    }


def vehicle_json(vehicle: Vehicle) -> dict:
    return {
        "id": vehicle.id,
        "make": vehicle.make,
        "model": vehicle.model,
        "year": vehicle.year,
        "plate": vehicle.plate,
        "color": vehicle.color,
        "initial_mileage": vehicle.initial_mileage,
        "created_at": iso(vehicle.created_at),
    }


def maintenance_json(record: MaintenanceRecord) -> dict:
    return {
        "id": record.id,
        "vehicle_id": record.vehicle_id,
        "type": record.type.value,
        "label": MAINTENANCE_LABELS[record.type],
        "date": iso(record.date),
        "mileage": record.mileage,
        "cost": money(record.cost),
        "notes": record.notes,
        "created_at": iso(record.created_at),
    }


def fuel_json(log: FuelLog) -> dict:
    price = None
    if log.total_cost is not None and log.gallons:
        price = round(float(log.total_cost) / float(log.gallons), 3)
    return {
        "id": log.id,
        "vehicle_id": log.vehicle_id,
        "date": iso(log.date),
        "mileage": log.mileage,
        "gallons": float(log.gallons),
        "total_cost": money(log.total_cost),
        "price_per_gallon": price,
        "full_tank": log.full_tank,
        "notes": log.notes,
        "created_at": iso(log.created_at),
    }
