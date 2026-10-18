"""Cálculos del estado general y del rendimiento.

Son funciones puras: reciben datos y devuelven resultados sin tocar la base de
datos, así se pueden probar fácilmente (ver tests/test_calculations.py).
"""
import calendar
import datetime as dt
from collections import defaultdict
from itertools import pairwise

from app.models import MAINTENANCE_LABELS

SOON_THRESHOLD = 0.8  # desde el 80 % del intervalo se avisa que el mantenimiento se acerca

STATUS_OK = "al_dia"
STATUS_SOON = "proximo"
STATUS_OVERDUE = "vencido"
STATUS_NO_DATA = "sin_registro"
ALL_STATUSES = (STATUS_OK, STATUS_SOON, STATUS_OVERDUE, STATUS_NO_DATA)


def add_months(date, months):
    """Suma meses a una fecha (31 de enero + 1 mes = 28 o 29 de febrero)."""
    index = date.month - 1 + months
    year, month = date.year + index // 12, index % 12 + 1
    return dt.date(year, month, min(date.day, calendar.monthrange(year, month)[1]))


def evaluate_item(*, last_date, last_mileage, current_mileage, today, every_miles, every_months):
    """Qué tan cerca está un componente de su próximo mantenimiento.

    Se mide por millas y por tiempo; manda el que esté más avanzado.
    """
    if last_date is None:
        return {
            "status": STATUS_NO_DATA,
            "percent": None,
            "miles_since": None,
            "days_since": None,
            "next_due_mileage": None,
            "next_due_date": None,
            "miles_left": None,
            "days_left": None,
        }

    miles_since = max(current_mileage - last_mileage, 0)
    days_since = max((today - last_date).days, 0)
    usage = []
    next_due_mileage = next_due_date = None

    if every_miles:
        next_due_mileage = last_mileage + every_miles
        usage.append(miles_since / every_miles)
    if every_months:
        next_due_date = add_months(last_date, every_months)
        usage.append(days_since / max((next_due_date - last_date).days, 1))

    worst = max(usage, default=0)
    if worst >= 1:
        status = STATUS_OVERDUE
    elif worst >= SOON_THRESHOLD:
        status = STATUS_SOON
    else:
        status = STATUS_OK

    return {
        "status": status,
        "percent": round(worst * 100),
        "miles_since": miles_since,
        "days_since": days_since,
        "next_due_mileage": next_due_mileage,
        "next_due_date": next_due_date.isoformat() if next_due_date else None,
        "miles_left": next_due_mileage - current_mileage if next_due_mileage else None,
        "days_left": (next_due_date - today).days if next_due_date else None,
    }


def overall_status(statuses):
    """El estado general del carro es el del componente en peor estado."""
    statuses = set(statuses)
    for status in (STATUS_OVERDUE, STATUS_SOON, STATUS_OK):
        if status in statuses:
            return status
    return STATUS_NO_DATA


def mpg_series(fuel_logs):
    """Rendimiento (millas por galón) con el método de tanque lleno a tanque lleno.

    Entre dos cargas con tanque lleno: millas recorridas / galones cargados.
    Las cargas parciales se suman a la siguiente carga con tanque lleno.
    """
    series = []
    last_full = None
    gallons = 0.0
    for log in sorted(fuel_logs, key=lambda log: (log.mileage, log.date)):
        gallons += float(log.gallons)
        if not log.full_tank:
            continue
        if last_full is not None:
            miles = log.mileage - last_full.mileage
            if miles > 0:
                series.append(
                    {
                        "date": log.date.isoformat(),
                        "start_mileage": last_full.mileage,
                        "end_mileage": log.mileage,
                        "miles": miles,
                        "gallons": round(gallons, 3),
                        "mpg": round(miles / gallons, 1),
                    }
                )
        last_full, gallons = log, 0.0
    return series


def average_mpg(segments):
    """Promedio ponderado: total de millas / total de galones."""
    gallons = sum(segment["gallons"] for segment in segments)
    if not gallons:
        return None
    return round(sum(segment["miles"] for segment in segments) / gallons, 1)


def mpg_impact(series, events, window=3):
    """Compara el MPG antes y después de cada mantenimiento.

    Toma hasta `window` tramos de tanque lleno antes y después del mantenimiento.
    Sirve para ver, por ejemplo, si el carro rinde más después de cambiar las bujías.
    """
    results = []
    for event in events:
        before = [s for s in series if s["end_mileage"] <= event["mileage"]][-window:]
        after = [s for s in series if s["start_mileage"] >= event["mileage"]][:window]
        mpg_before, mpg_after = average_mpg(before), average_mpg(after)
        change = None
        if mpg_before and mpg_after:
            change = round((mpg_after - mpg_before) / mpg_before * 100, 1)
        results.append(
            {**event, "mpg_before": mpg_before, "mpg_after": mpg_after, "change_pct": change}
        )
    return results


def maintenance_cycles(records):
    """Cuántas millas y días duró cada cambio (p. ej. entre cambios de aceite)."""
    by_type = defaultdict(list)
    for record in sorted(records, key=lambda r: (r.date, r.mileage)):
        by_type[record.type].append(record)

    result = []
    for mtype, items in by_type.items():
        cycles = [
            {
                "from_date": a.date.isoformat(),
                "to_date": b.date.isoformat(),
                "miles": b.mileage - a.mileage,
                "days": (b.date - a.date).days,
            }
            for a, b in pairwise(items)
        ]
        result.append(
            {
                "type": mtype.value,
                "label": MAINTENANCE_LABELS[mtype],
                "times": len(items),
                "avg_miles": round(sum(c["miles"] for c in cycles) / len(cycles)) if cycles else None,
                "avg_days": round(sum(c["days"] for c in cycles) / len(cycles)) if cycles else None,
                "cycles": cycles,
            }
        )
    return result


def monthly_costs(maintenance_records, fuel_logs):
    """Gasto por mes separado en mantenimiento y combustible."""
    months = defaultdict(lambda: {"maintenance": 0.0, "fuel": 0.0})
    for record in maintenance_records:
        if record.cost is not None:
            months[record.date.strftime("%Y-%m")]["maintenance"] += float(record.cost)
    for log in fuel_logs:
        if log.total_cost is not None:
            months[log.date.strftime("%Y-%m")]["fuel"] += float(log.total_cost)

    return [
        {
            "month": month,
            "maintenance": round(values["maintenance"], 2),
            "fuel": round(values["fuel"], 2),
            "total": round(values["maintenance"] + values["fuel"], 2),
        }
        for month, values in sorted(months.items())
    ]
