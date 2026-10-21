from collections import Counter

from app.models import MAINTENANCE_LABELS, MaintenanceType
from app.services.calculations import (
    ALL_STATUSES,
    average_mpg,
    evaluate_item,
    maintenance_cycles,
    monthly_costs,
    mpg_impact,
    mpg_series,
    overall_status,
)
from app.services.clock import local_today


class DashboardService:
    """Datos para la sección "Estado general" y las gráficas de rendimiento."""

    def __init__(self, vehicle_service, interval_service, maintenance_repository, fuel_repository):
        self.vehicles = vehicle_service
        self.intervals = interval_service
        self.maintenance = maintenance_repository
        self.fuel = fuel_repository

    def current_mileage(self, vehicle):
        """El millaje actual es la lectura más alta registrada."""
        readings = [
            vehicle.initial_mileage,
            self.maintenance.max_mileage(vehicle.id),
            self.fuel.max_mileage(vehicle.id),
        ]
        return max(reading for reading in readings if reading is not None)

    def status(self, user_id, vehicle_id, today=None):
        vehicle = self.vehicles.get(user_id, vehicle_id)
        today = today or local_today()
        mileage = self.current_mileage(vehicle)
        intervals = self.intervals.for_vehicle(vehicle)
        latest = self.maintenance.latest_by_type(vehicle.id)

        items = []
        for mtype in MaintenanceType:
            last = latest.get(mtype)
            interval = intervals[mtype]
            items.append(
                {
                    "type": mtype.value,
                    "label": MAINTENANCE_LABELS[mtype],
                    "every_miles": interval["every_miles"],
                    "every_months": interval["every_months"],
                    "last": last.to_dict() if last else None,
                    **evaluate_item(
                        last_date=last.date if last else None,
                        last_mileage=last.mileage if last else None,
                        current_mileage=mileage,
                        today=today,
                        every_miles=interval["every_miles"],
                        every_months=interval["every_months"],
                    ),
                }
            )

        counts = Counter(item["status"] for item in items)
        series = mpg_series(self.fuel.list_for_vehicle(vehicle.id, oldest_first=True))
        return {
            "vehicle": vehicle.to_dict(),
            "current_mileage": mileage,
            "overall": overall_status(counts),
            "summary": {status: counts.get(status, 0) for status in ALL_STATUSES},
            "items": items,
            "fuel": {
                "last_mpg": series[-1]["mpg"] if series else None,
                "avg_mpg": average_mpg(series),
            },
        }

    def stats(self, user_id, vehicle_id):
        vehicle = self.vehicles.get(user_id, vehicle_id)
        maintenance = self.maintenance.list_for_vehicle(vehicle.id, oldest_first=True)
        fuel = self.fuel.list_for_vehicle(vehicle.id, oldest_first=True)
        series = mpg_series(fuel)

        # Millas entre el primer y el último registro
        readings = [r.mileage for r in maintenance] + [f.mileage for f in fuel]
        miles_tracked = max(readings) - min(readings) if readings else 0

        maintenance_total = sum(float(r.cost) for r in maintenance if r.cost is not None)
        priced_fuel = [f for f in fuel if f.total_cost is not None]
        fuel_total = sum(float(f.total_cost) for f in priced_fuel)
        priced_gallons = sum(float(f.gallons) for f in priced_fuel)
        price_per_gallon = fuel_total / priced_gallons if priced_gallons else None
        series_gallons = sum(s["gallons"] for s in series)
        miles_per_gallon = sum(s["miles"] for s in series) / series_gallons if series_gallons else None

        events = [
            {
                "id": r.id,
                "date": r.date.isoformat(),
                "mileage": r.mileage,
                "type": r.type.value,
                "label": MAINTENANCE_LABELS[r.type],
            }
            for r in maintenance
        ]

        return {
            "vehicle_id": vehicle.id,
            "current_mileage": self.current_mileage(vehicle),
            "miles_tracked": miles_tracked,
            "fuel": {
                "fill_ups": len(fuel),
                "total_gallons": round(sum(float(f.gallons) for f in fuel), 3),
                "avg_mpg": average_mpg(series),
                "last_mpg": series[-1]["mpg"] if series else None,
                "best_mpg": max((s["mpg"] for s in series), default=None),
                "worst_mpg": min((s["mpg"] for s in series), default=None),
                "avg_price_per_gallon": round(price_per_gallon, 3) if price_per_gallon else None,
                # Cuánto cuesta en combustible recorrer una milla: precio por galón / MPG
                "cost_per_mile": (
                    round(price_per_gallon / miles_per_gallon, 3)
                    if price_per_gallon and miles_per_gallon
                    else None
                ),
                "mpg_series": series,
            },
            "costs": {
                "maintenance_total": round(maintenance_total, 2),
                "fuel_total": round(fuel_total, 2),
                "total": round(maintenance_total + fuel_total, 2),
                "by_month": monthly_costs(maintenance, fuel),
            },
            # MPG antes y después de cada mantenimiento (para marcarlos en la gráfica)
            "maintenance_impact": mpg_impact(series, events),
            "maintenance_cycles": maintenance_cycles(maintenance),
        }
