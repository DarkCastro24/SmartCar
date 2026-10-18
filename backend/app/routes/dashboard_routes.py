from flask import Blueprint, abort, current_app, request
from flask_jwt_extended import current_user, jwt_required

from app.models import MaintenanceType
from app.schemas import IntervalSchema

# Todas estas rutas cuelgan de un vehículo: /api/vehicles/<id>/...
dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/vehicles/<int:vehicle_id>")
intervals_schema = IntervalSchema(many=True)


@dashboard_bp.get("/status")
@jwt_required()
def vehicle_status(vehicle_id):
    """Estado general: semáforo de cada componente y rendimiento actual."""
    return current_app.dashboard_service.status(current_user.id, vehicle_id)


@dashboard_bp.get("/stats")
@jwt_required()
def vehicle_stats(vehicle_id):
    """Datos para comparar rendimientos: MPG, gastos y duración de cada cambio."""
    return current_app.dashboard_service.stats(current_user.id, vehicle_id)


@dashboard_bp.get("/intervals")
@jwt_required()
def list_intervals(vehicle_id):
    return current_app.interval_service.list(current_user.id, vehicle_id)


@dashboard_bp.put("/intervals")
@jwt_required()
def save_intervals(vehicle_id):
    """Recibe una lista: [{"type": "oil_change", "every_miles": 7500, "every_months": 6}]"""
    data = request.get_json(silent=True)
    if not isinstance(data, list):
        abort(400, description="Envía una lista de intervalos")
    items = intervals_schema.load(data)
    return current_app.interval_service.save(current_user.id, vehicle_id, items)


@dashboard_bp.delete("/intervals/<maintenance_type>")
@jwt_required()
def reset_interval(vehicle_id, maintenance_type):
    """Vuelve al intervalo sugerido para ese tipo de mantenimiento."""
    try:
        mtype = MaintenanceType(maintenance_type)
    except ValueError:
        abort(404, description="Tipo de mantenimiento no encontrado")
    return current_app.interval_service.reset(current_user.id, vehicle_id, mtype)
