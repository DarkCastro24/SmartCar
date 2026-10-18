from flask import Blueprint, current_app
from flask_jwt_extended import current_user, jwt_required

from app.routes.helpers import load_body
from app.schemas import VehicleSchema

vehicles_bp = Blueprint("vehicles", __name__, url_prefix="/api/vehicles")
vehicle_schema = VehicleSchema()


@vehicles_bp.get("")
@jwt_required()
def list_vehicles():
    vehicles = current_app.vehicle_service.list(current_user.id)
    return [vehicle.to_dict() for vehicle in vehicles]


@vehicles_bp.post("")
@jwt_required()
def create_vehicle():
    data = load_body(vehicle_schema)
    vehicle = current_app.vehicle_service.create(current_user.id, data)
    return vehicle.to_dict(), 201


@vehicles_bp.get("/<int:vehicle_id>")
@jwt_required()
def get_vehicle(vehicle_id):
    return current_app.vehicle_service.get(current_user.id, vehicle_id).to_dict()


@vehicles_bp.put("/<int:vehicle_id>")
@jwt_required()
def update_vehicle(vehicle_id):
    # partial=True: basta con enviar los campos que cambian
    data = load_body(vehicle_schema, partial=True)
    return current_app.vehicle_service.update(current_user.id, vehicle_id, data).to_dict()


@vehicles_bp.delete("/<int:vehicle_id>")
@jwt_required()
def delete_vehicle(vehicle_id):
    current_app.vehicle_service.delete(current_user.id, vehicle_id)
    return {"msg": "Vehículo eliminado"}
