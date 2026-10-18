from flask import Blueprint, current_app, request
from flask_jwt_extended import current_user, jwt_required

from app.models import DEFAULT_INTERVALS, MAINTENANCE_LABELS, MaintenanceType
from app.routes.helpers import load_body
from app.schemas import MaintenanceFilterSchema, MaintenanceSchema

maintenance_bp = Blueprint("maintenance", __name__, url_prefix="/api")
maintenance_schema = MaintenanceSchema()
filter_schema = MaintenanceFilterSchema()


@maintenance_bp.get("/maintenance-types")
def maintenance_types():
    """Catálogo de tipos para los formularios del frontend."""
    return [
        {
            "value": mtype.value,
            "label": MAINTENANCE_LABELS[mtype],
            "default_every_miles": DEFAULT_INTERVALS[mtype][0],
            "default_every_months": DEFAULT_INTERVALS[mtype][1],
        }
        for mtype in MaintenanceType
    ]


@maintenance_bp.get("/vehicles/<int:vehicle_id>/maintenance")
@jwt_required()
def list_maintenance(vehicle_id):
    filters = filter_schema.load(request.args)  # ?type=&from=&to=
    records = current_app.maintenance_service.list(current_user.id, vehicle_id, **filters)
    return [record.to_dict() for record in records]


@maintenance_bp.post("/vehicles/<int:vehicle_id>/maintenance")
@jwt_required()
def create_maintenance(vehicle_id):
    data = load_body(maintenance_schema)
    record = current_app.maintenance_service.create(current_user.id, vehicle_id, data)
    return record.to_dict(), 201


@maintenance_bp.get("/maintenance/<int:record_id>")
@jwt_required()
def get_maintenance(record_id):
    return current_app.maintenance_service.get(current_user.id, record_id).to_dict()


@maintenance_bp.put("/maintenance/<int:record_id>")
@jwt_required()
def update_maintenance(record_id):
    data = load_body(maintenance_schema, partial=True)
    return current_app.maintenance_service.update(current_user.id, record_id, data).to_dict()


@maintenance_bp.delete("/maintenance/<int:record_id>")
@jwt_required()
def delete_maintenance(record_id):
    current_app.maintenance_service.delete(current_user.id, record_id)
    return {"msg": "Mantenimiento eliminado"}
