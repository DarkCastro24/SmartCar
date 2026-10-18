from flask import Blueprint, current_app, request
from flask_jwt_extended import current_user, jwt_required

from app.routes.helpers import load_body
from app.schemas import DateRangeSchema, FuelLogSchema

fuel_bp = Blueprint("fuel", __name__, url_prefix="/api")
fuel_schema = FuelLogSchema()
filter_schema = DateRangeSchema()


@fuel_bp.get("/vehicles/<int:vehicle_id>/fuel")
@jwt_required()
def list_fuel(vehicle_id):
    filters = filter_schema.load(request.args)  # ?from=&to=
    logs = current_app.fuel_service.list(current_user.id, vehicle_id, **filters)
    return [log.to_dict() for log in logs]


@fuel_bp.post("/vehicles/<int:vehicle_id>/fuel")
@jwt_required()
def create_fuel(vehicle_id):
    data = load_body(fuel_schema)
    log = current_app.fuel_service.create(current_user.id, vehicle_id, data)
    return log.to_dict(), 201


@fuel_bp.get("/fuel/<int:log_id>")
@jwt_required()
def get_fuel(log_id):
    return current_app.fuel_service.get(current_user.id, log_id).to_dict()


@fuel_bp.put("/fuel/<int:log_id>")
@jwt_required()
def update_fuel(log_id):
    data = load_body(fuel_schema, partial=True)
    return current_app.fuel_service.update(current_user.id, log_id, data).to_dict()


@fuel_bp.delete("/fuel/<int:log_id>")
@jwt_required()
def delete_fuel(log_id):
    current_app.fuel_service.delete(current_user.id, log_id)
    return {"msg": "Carga de combustible eliminada"}
