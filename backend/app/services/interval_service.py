from app.models import DEFAULT_INTERVALS, MAINTENANCE_LABELS, MaintenanceType


class IntervalService:
    """Cada cuánto toca cada mantenimiento: valores sugeridos o personalizados."""

    def __init__(self, vehicle_service, interval_repository):
        self.vehicles = vehicle_service
        self.repo = interval_repository

    def for_vehicle(self, vehicle):
        """{tipo: intervalo}; usa el personalizado si existe y si no el sugerido."""
        custom = self.repo.by_type(vehicle.id)
        result = {}
        for mtype in MaintenanceType:
            if mtype in custom:
                miles, months = custom[mtype].every_miles, custom[mtype].every_months
            else:
                miles, months = DEFAULT_INTERVALS[mtype]
            result[mtype] = {
                "type": mtype.value,
                "label": MAINTENANCE_LABELS[mtype],
                "every_miles": miles,
                "every_months": months,
                "is_custom": mtype in custom,
            }
        return result

    def list(self, user_id, vehicle_id):
        vehicle = self.vehicles.get(user_id, vehicle_id)
        return list(self.for_vehicle(vehicle).values())

    def save(self, user_id, vehicle_id, items):
        vehicle = self.vehicles.get(user_id, vehicle_id)
        self.repo.save_many(vehicle.id, items)
        return list(self.for_vehicle(vehicle).values())

    def reset(self, user_id, vehicle_id, mtype):
        """Vuelve al intervalo sugerido."""
        vehicle = self.vehicles.get(user_id, vehicle_id)
        interval = self.repo.by_type(vehicle.id).get(mtype)
        if interval is not None:
            self.repo.delete(interval)
        return list(self.for_vehicle(vehicle).values())
