from flask import Blueprint, request
from flask_jwt_extended import current_user, jwt_required

from app.container import services
from app.routes.helpers import load_body
from app.schemas import DateRangeSchema, FuelLogSchema
from app.serializers import fuel_json

fuel_bp = Blueprint("fuel", __name__, url_prefix="/api")
fuel_schema = FuelLogSchema()
filter_schema = DateRangeSchema()


@fuel_bp.get("/vehicles/<int:vehicle_id>/fuel")
@jwt_required()
def list_fuel(vehicle_id):
    filters = filter_schema.load(request.args)  # ?from=&to=
    logs = services().fuel.list(current_user.id, vehicle_id, **filters)
    return [fuel_json(log) for log in logs]


@fuel_bp.post("/vehicles/<int:vehicle_id>/fuel")
@jwt_required()
def create_fuel(vehicle_id):
    data = load_body(fuel_schema)
    log = services().fuel.create(current_user.id, vehicle_id, data)
    return fuel_json(log), 201


@fuel_bp.get("/fuel/<int:log_id>")
@jwt_required()
def get_fuel(log_id):
    return fuel_json(services().fuel.get(current_user.id, log_id))


@fuel_bp.put("/fuel/<int:log_id>")
@jwt_required()
def update_fuel(log_id):
    data = load_body(fuel_schema, partial=True)
    return fuel_json(services().fuel.update(current_user.id, log_id, data))


@fuel_bp.delete("/fuel/<int:log_id>")
@jwt_required()
def delete_fuel(log_id):
    services().fuel.delete(current_user.id, log_id)
    return {"msg": "Carga de combustible eliminada"}
