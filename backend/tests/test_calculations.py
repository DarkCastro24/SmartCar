import datetime as dt
from types import SimpleNamespace as Row

from app.models import MaintenanceType
from app.services.calculations import (
    add_months,
    average_mpg,
    evaluate_item,
    maintenance_cycles,
    monthly_costs,
    mpg_impact,
    mpg_series,
    overall_status,
)

D = dt.date


def fuel(day, mileage, gallons, full=True, cost=None):
    return Row(date=D(2025, 1, day), mileage=mileage, gallons=gallons, full_tank=full, total_cost=cost)


def test_add_months_respeta_fin_de_mes():
    assert add_months(D(2025, 1, 31), 1) == D(2025, 2, 28)
    assert add_months(D(2024, 1, 31), 1) == D(2024, 2, 29)
    assert add_months(D(2025, 11, 15), 3) == D(2026, 2, 15)


def oil(current_mileage, today):
    return evaluate_item(
        last_date=D(2025, 1, 1),
        last_mileage=45000,
        current_mileage=current_mileage,
        today=today,
        every_miles=5000,
        every_months=6,
    )


def test_estado_al_dia_proximo_y_vencido():
    ok = oil(47000, D(2025, 2, 1))
    assert ok["status"] == "al_dia"
    assert ok["percent"] == 40
    assert ok["next_due_mileage"] == 50000
    assert ok["miles_left"] == 3000
    assert ok["next_due_date"] == "2025-07-01"

    assert oil(49200, D(2025, 2, 1))["status"] == "proximo"  # 84 % de las millas
    assert oil(50100, D(2025, 2, 1))["status"] == "vencido"
    assert oil(46000, D(2025, 7, 5))["status"] == "vencido"  # pocas millas, pero pasaron 6 meses


def test_bateria_solo_por_tiempo_y_sin_registro():
    battery = evaluate_item(
        last_date=D(2022, 1, 1), last_mileage=10000, current_mileage=60000,
        today=D(2025, 1, 1), every_miles=None, every_months=48,
    )
    assert battery["status"] == "al_dia"
    assert battery["next_due_mileage"] is None

    empty = evaluate_item(
        last_date=None, last_mileage=None, current_mileage=60000,
        today=D(2025, 1, 1), every_miles=5000, every_months=6,
    )
    assert empty["status"] == "sin_registro"


def test_estado_general_es_el_peor():
    assert overall_status(["al_dia", "vencido", "proximo"]) == "vencido"
    assert overall_status(["al_dia", "sin_registro"]) == "al_dia"
    assert overall_status(["sin_registro"]) == "sin_registro"


def test_mpg_tanque_lleno_a_tanque_lleno():
    logs = [
        fuel(20, 1600, 12),  # desordenado a propósito
        fuel(1, 900, 3, full=False),  # parcial antes del primer lleno: se ignora
        fuel(2, 1000, 10),
        fuel(8, 1150, 4, full=False),  # parcial: se suma a la siguiente
        fuel(12, 1300, 6),
    ]
    series = mpg_series(logs)
    assert [(s["miles"], s["gallons"], s["mpg"]) for s in series] == [(300, 10, 30.0), (300, 12, 25.0)]
    assert average_mpg(series) == 27.3  # 600 millas / 22 galones


def test_mpg_antes_y_despues_de_un_mantenimiento():
    series = mpg_series([fuel(2, 1000, 10), fuel(12, 1300, 10), fuel(20, 1600, 8)])
    [impact] = mpg_impact(series, [{"mileage": 1300, "type": "air_filter"}])
    assert impact["mpg_before"] == 30.0
    assert impact["mpg_after"] == 37.5
    assert impact["change_pct"] == 25.0


def test_ciclos_entre_cambios():
    records = [
        Row(type=MaintenanceType.OIL_CHANGE, date=D(2025, 6, 1), mileage=50000),
        Row(type=MaintenanceType.OIL_CHANGE, date=D(2025, 1, 1), mileage=45000),
        Row(type=MaintenanceType.OIL_CHANGE, date=D(2025, 11, 1), mileage=54000),
        Row(type=MaintenanceType.BATTERY, date=D(2025, 3, 1), mileage=47000),
    ]
    oil_cycles, battery = maintenance_cycles(records)
    assert oil_cycles["times"] == 3
    assert [c["miles"] for c in oil_cycles["cycles"]] == [5000, 4000]
    assert oil_cycles["avg_miles"] == 4500
    assert battery["avg_miles"] is None


def test_gasto_por_mes():
    maintenance = [Row(date=D(2025, 1, 5), cost=35), Row(date=D(2025, 2, 5), cost=None)]
    logs = [fuel(10, 1000, 10, cost=40), Row(date=D(2025, 2, 1), total_cost=38.5)]
    assert monthly_costs(maintenance, logs) == [
        {"month": "2025-01", "maintenance": 35.0, "fuel": 40.0, "total": 75.0},
        {"month": "2025-02", "maintenance": 0.0, "fuel": 38.5, "total": 38.5},
    ]
