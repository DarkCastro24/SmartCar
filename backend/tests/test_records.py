from app.models import FuelLog, MaintenanceRecord

OIL = {"type": "oil_change", "date": "2025-01-10", "mileage": 45000, "cost": 35.5, "notes": "5W-30"}
FUEL = {"date": "2025-01-12", "mileage": 45300, "gallons": 10.5, "total_cost": 42}


def post_maintenance(client, headers, vehicle_id, **data):
    return client.post(f"/api/vehicles/{vehicle_id}/maintenance", json={**OIL, **data}, headers=headers)


def post_fuel(client, headers, vehicle_id, **data):
    return client.post(f"/api/vehicles/{vehicle_id}/fuel", json={**FUEL, **data}, headers=headers)


def test_catalogo_de_tipos(client):
    types = client.get("/api/maintenance-types").get_json()
    assert len(types) == 6
    assert types[0] == {
        "value": "oil_change",
        "label": "Cambio de aceite",
        "default_every_miles": 5000,
        "default_every_months": 6,
    }


def test_registrar_mantenimiento(client, auth_headers, vehicle_id):
    res = post_maintenance(client, auth_headers, vehicle_id)
    assert res.status_code == 201
    body = res.get_json()
    assert body["label"] == "Cambio de aceite"
    assert body["cost"] == 35.5
    assert body["date"] == "2025-01-10"


def test_tipo_invalido_y_fecha_futura(client, auth_headers, vehicle_id):
    res = post_maintenance(client, auth_headers, vehicle_id, type="cambio_de_llantas", date="2999-01-01")
    assert res.status_code == 400
    assert {"type", "date"} <= set(res.get_json()["errors"])


def test_consultar_con_filtros(client, auth_headers, vehicle_id):
    post_maintenance(client, auth_headers, vehicle_id)
    post_maintenance(client, auth_headers, vehicle_id, type="air_filter", date="2025-03-01", mileage=47000)
    post_maintenance(client, auth_headers, vehicle_id, date="2025-06-01", mileage=50000)
    url = f"/api/vehicles/{vehicle_id}/maintenance"

    all_records = client.get(url, headers=auth_headers).get_json()
    assert [r["date"] for r in all_records] == ["2025-06-01", "2025-03-01", "2025-01-10"]

    oil = client.get(url, query_string={"type": "oil_change"}, headers=auth_headers).get_json()
    assert len(oil) == 2

    march = client.get(url, query_string={"from": "2025-02-01", "to": "2025-04-01"}, headers=auth_headers)
    assert [r["type"] for r in march.get_json()] == ["air_filter"]

    bad_range = client.get(url, query_string={"from": "2025-05-01", "to": "2025-01-01"}, headers=auth_headers)
    assert bad_range.status_code == 400


def test_el_odometro_no_puede_retroceder(client, auth_headers, vehicle_id):
    post_maintenance(client, auth_headers, vehicle_id)  # 10/01/2025 a 45,000 mi

    later_with_less_miles = post_maintenance(client, auth_headers, vehicle_id, date="2025-02-01", mileage=44000)
    assert later_with_less_miles.status_code == 400
    assert "45,000" in later_with_less_miles.get_json()["msg"]

    # La validación compara también contra las cargas de combustible
    fuel_before_with_more_miles = post_fuel(client, auth_headers, vehicle_id, date="2025-01-01", mileage=46000)
    assert fuel_before_with_more_miles.status_code == 400

    same_day = post_fuel(client, auth_headers, vehicle_id, date="2025-01-10", mileage=45000)
    assert same_day.status_code == 201


def test_editar_y_eliminar_mantenimiento(client, auth_headers, vehicle_id):
    record = post_maintenance(client, auth_headers, vehicle_id).get_json()
    post_maintenance(client, auth_headers, vehicle_id, date="2025-06-01", mileage=50000)
    url = f"/api/maintenance/{record['id']}"

    updated = client.put(url, json={"cost": 40, "mileage": 45100}, headers=auth_headers)
    assert updated.status_code == 200
    assert updated.get_json()["cost"] == 40.0

    conflict = client.put(url, json={"mileage": 51000}, headers=auth_headers)
    assert conflict.status_code == 400

    assert client.delete(url, headers=auth_headers).status_code == 200
    assert client.get(url, headers=auth_headers).status_code == 404


def test_registrar_combustible(client, auth_headers, vehicle_id):
    res = post_fuel(client, auth_headers, vehicle_id)
    assert res.status_code == 201
    body = res.get_json()
    assert body["full_tank"] is True
    assert body["price_per_gallon"] == 4.0

    zero = post_fuel(client, auth_headers, vehicle_id, gallons=0, date="2025-01-20", mileage=45600)
    assert zero.status_code == 400

    logs = client.get(f"/api/vehicles/{vehicle_id}/fuel", headers=auth_headers).get_json()
    assert len(logs) == 1


def test_registros_de_otro_usuario(client, auth_headers, vehicle_id, make_user):
    record = post_maintenance(client, auth_headers, vehicle_id).get_json()
    fuel = post_fuel(client, auth_headers, vehicle_id).get_json()
    _, intruder = make_user("intruso@example.com")

    assert client.get(f"/api/maintenance/{record['id']}", headers=intruder).status_code == 404
    assert client.delete(f"/api/fuel/{fuel['id']}", headers=intruder).status_code == 404
    assert client.get(f"/api/vehicles/{vehicle_id}/maintenance", headers=intruder).status_code == 404
    assert post_fuel(client, intruder, vehicle_id, date="2025-02-01", mileage=46000).status_code == 404


def test_borrar_vehiculo_borra_sus_registros(app, client, auth_headers, vehicle_id):
    post_maintenance(client, auth_headers, vehicle_id)
    post_fuel(client, auth_headers, vehicle_id)

    client.delete(f"/api/vehicles/{vehicle_id}", headers=auth_headers)

    assert MaintenanceRecord.query.count() == 0
    assert FuelLog.query.count() == 0
