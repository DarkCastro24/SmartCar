import datetime as dt


def days_ago(days):
    return (dt.date.today() - dt.timedelta(days=days)).isoformat()


def add(client, headers, vehicle_id, kind, **data):
    res = client.post(f"/api/vehicles/{vehicle_id}/{kind}", json=data, headers=headers)
    assert res.status_code == 201, res.get_json()
    return res.get_json()


def by_type(status):
    return {item["type"]: item for item in status["items"]}


def test_estado_sin_registros(client, auth_headers, vehicle_id):
    status = client.get(f"/api/vehicles/{vehicle_id}/status", headers=auth_headers).get_json()
    assert status["current_mileage"] == 40000  # millaje inicial del vehículo
    assert status["overall"] == "sin_registro"
    assert status["summary"]["sin_registro"] == 6


def test_estado_general(client, auth_headers, vehicle_id):
    add(client, auth_headers, vehicle_id, "maintenance", type="air_filter", date=days_ago(400), mileage=30000)
    add(client, auth_headers, vehicle_id, "maintenance", type="battery", date=days_ago(100), mileage=39000)
    add(client, auth_headers, vehicle_id, "maintenance", type="oil_change", date=days_ago(30), mileage=40000)
    add(client, auth_headers, vehicle_id, "fuel", date=days_ago(1), mileage=44500, gallons=10)

    status = client.get(f"/api/vehicles/{vehicle_id}/status", headers=auth_headers).get_json()
    items = by_type(status)

    assert status["current_mileage"] == 44500
    assert items["oil_change"]["status"] == "proximo"  # 4,500 de 5,000 millas
    assert items["oil_change"]["miles_left"] == 500
    assert items["air_filter"]["status"] == "vencido"  # más de 12 meses
    assert items["battery"]["status"] == "al_dia"
    assert items["spark_plugs"]["status"] == "sin_registro"
    assert status["overall"] == "vencido"
    assert status["summary"] == {"al_dia": 1, "proximo": 1, "vencido": 1, "sin_registro": 3}


def test_intervalos_personalizados(client, auth_headers, vehicle_id):
    add(client, auth_headers, vehicle_id, "maintenance", type="oil_change", date=days_ago(30), mileage=40000)
    add(client, auth_headers, vehicle_id, "fuel", date=days_ago(1), mileage=44500, gallons=10)
    url = f"/api/vehicles/{vehicle_id}/intervals"

    saved = client.put(url, json=[{"type": "oil_change", "every_miles": 10000, "every_months": 12}], headers=auth_headers)
    assert saved.status_code == 200
    oil = next(i for i in saved.get_json() if i["type"] == "oil_change")
    assert oil == {"type": "oil_change", "label": "Cambio de aceite", "every_miles": 10000, "every_months": 12, "is_custom": True}

    status = client.get(f"/api/vehicles/{vehicle_id}/status", headers=auth_headers).get_json()
    assert by_type(status)["oil_change"]["status"] == "al_dia"  # 4,500 de 10,000

    reset = client.delete(f"{url}/oil_change", headers=auth_headers).get_json()
    assert next(i for i in reset if i["type"] == "oil_change")["every_miles"] == 5000

    assert client.put(url, json=[{"type": "oil_change"}], headers=auth_headers).status_code == 400
    assert client.put(url, json={"type": "oil_change"}, headers=auth_headers).status_code == 400
    assert client.delete(f"{url}/llantas", headers=auth_headers).status_code == 404


def test_estadisticas(client, auth_headers, vehicle_id):
    add(client, auth_headers, vehicle_id, "fuel", date="2025-01-02", mileage=41000, gallons=10, total_cost=40)
    add(client, auth_headers, vehicle_id, "fuel", date="2025-01-12", mileage=41300, gallons=10, total_cost=40)
    add(client, auth_headers, vehicle_id, "maintenance", type="spark_plugs", date="2025-01-13", mileage=41300, cost=120)
    add(client, auth_headers, vehicle_id, "fuel", date="2025-02-01", mileage=41600, gallons=8, total_cost=32)

    stats = client.get(f"/api/vehicles/{vehicle_id}/stats", headers=auth_headers).get_json()

    assert stats["miles_tracked"] == 600
    assert stats["fuel"]["avg_mpg"] == 33.3  # 600 millas / 18 galones
    assert stats["fuel"]["best_mpg"] == 37.5
    assert stats["fuel"]["avg_price_per_gallon"] == 4.0
    assert stats["costs"]["total"] == 232.0
    assert stats["costs"]["cost_per_mile"] == 0.387
    assert [m["month"] for m in stats["costs"]["by_month"]] == ["2025-01", "2025-02"]

    [impact] = stats["maintenance_impact"]
    assert impact["label"] == "Bujías"
    assert (impact["mpg_before"], impact["mpg_after"], impact["change_pct"]) == (30.0, 37.5, 25.0)


def test_estado_de_vehiculo_ajeno(client, vehicle_id, make_user):
    _, other = make_user("otro@example.com")
    for path in ("status", "stats", "intervals"):
        assert client.get(f"/api/vehicles/{vehicle_id}/{path}", headers=other).status_code == 404
