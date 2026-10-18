"""Datos de ejemplo para probar la app (comando `flask seed-demo`)."""
import datetime as dt
import random
from decimal import Decimal

from app.extensions import db
from app.models import FuelLog, MaintenanceRecord, MaintenanceType, Vehicle

COSTS = {
    MaintenanceType.OIL_CHANGE: 45,
    MaintenanceType.AIR_FILTER: 18,
    MaintenanceType.CABIN_FILTER: 22,
    MaintenanceType.SPARK_PLUGS: 120,
    MaintenanceType.BRAKE_PADS: 85,
    MaintenanceType.BATTERY: 140,
}


def create_demo_vehicle(user, today=None):
    """Crea un Corolla con un año de cargas de combustible y mantenimientos.

    El rendimiento mejora después del cambio de bujías para que se note en las gráficas.
    """
    rng = random.Random(42)  # siempre los mismos datos
    today = today or dt.date.today()
    start = today - dt.timedelta(days=365)
    spark_plugs_day = start + dt.timedelta(days=180)

    vehicle = Vehicle(
        user_id=user.id, make="Toyota", model="Corolla (demo)", year=2018,
        plate="P123-456", color="Gris", initial_mileage=52000,
    )
    db.session.add(vehicle)

    # Cargas de combustible cada 9 a 12 días
    day, mileage = start, 52000
    fill_ups = []
    while True:
        day += dt.timedelta(days=rng.randint(9, 12))
        if day > today:
            break
        miles = rng.randint(280, 330)
        mileage += miles
        mpg = (33.5 if day > spark_plugs_day else 30.5) + rng.uniform(-1.2, 1.2)
        gallons = Decimal(f"{miles / mpg:.3f}")
        price = Decimal(f"{rng.uniform(3.85, 4.30):.3f}")
        fill_ups.append(
            FuelLog(
                vehicle=vehicle, date=day, mileage=mileage, gallons=gallons,
                total_cost=(gallons * price).quantize(Decimal("0.01")), full_tank=True,
            )
        )
    db.session.add_all(fill_ups)

    def service(mtype, date, at_mileage):
        db.session.add(
            MaintenanceRecord(
                vehicle=vehicle, type=mtype, date=date, mileage=at_mileage,
                cost=Decimal(COSTS[mtype]),
            )
        )

    def at_day(target):
        """Usa la fecha y millas de la última carga hasta ese día para que el odómetro cuadre."""
        return [log for log in fill_ups if log.date <= target][-1]

    # Cambios de aceite cada ~5,000 millas
    service(MaintenanceType.OIL_CHANGE, start, 52000)
    last_oil = 52000
    for log in fill_ups:
        if log.mileage - last_oil >= rng.randint(4700, 5200):
            service(MaintenanceType.OIL_CHANGE, log.date, log.mileage)
            last_oil = log.mileage

    plugs = at_day(spark_plugs_day)
    service(MaintenanceType.SPARK_PLUGS, plugs.date, plugs.mileage)
    cabin = at_day(today - dt.timedelta(days=90))
    service(MaintenanceType.CABIN_FILTER, cabin.date, cabin.mileage)
    brakes = at_day(today - dt.timedelta(days=300))
    service(MaintenanceType.BRAKE_PADS, brakes.date, brakes.mileage)
    # Filtro de aire hace más de un año (vencido) y batería de casi 4 años (próxima)
    service(MaintenanceType.AIR_FILTER, start - dt.timedelta(days=30), 51700)
    service(MaintenanceType.BATTERY, today - dt.timedelta(days=1400), 30000)

    db.session.commit()
    return vehicle
