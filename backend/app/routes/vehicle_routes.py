from flask import Blueprint
from flask_jwt_extended import current_user, jwt_required

from app.container import services
from app.routes.helpers import load_body
from app.schemas import VehicleSchema
from app.serializers import vehicle_json

vehicles_bp = Blueprint("vehicles", __name__, url_prefix="/api/vehicles")
vehicle_schema = VehicleSchema()


@vehicles_bp.get("")
@jwt_required()
def list_vehicles():
    vehicles = services().vehicles.list(current_user.id)
    return [vehicle_json(vehicle) for vehicle in vehicles]


@vehicles_bp.post("")
@jwt_required()
def create_vehicle():
    data = load_body(vehicle_schema)
    vehicle = services().vehicles.create(current_user.id, data)
    return vehicle_json(vehicle), 201


@vehicles_bp.get("/<int:vehicle_id>")
@jwt_required()
def get_vehicle(vehicle_id):
    return vehicle_json(services().vehicles.get(current_user.id, vehicle_id))


@vehicles_bp.put("/<int:vehicle_id>")
@jwt_required()
def update_vehicle(vehicle_id):
    # partial=True: basta con enviar los campos que cambian
    data = load_body(vehicle_schema, partial=True)
    return vehicle_json(services().vehicles.update(current_user.id, vehicle_id, data))


@vehicles_bp.delete("/<int:vehicle_id>")
@jwt_required()
def delete_vehicle(vehicle_id):
    services().vehicles.delete(current_user.id, vehicle_id)
    return {"msg": "Vehículo eliminado"}
