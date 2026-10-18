COROLLA = {"make": "Toyota", "model": "Corolla", "year": 2018, "plate": "P123-456", "initial_mileage": 45000}


def create_vehicle(client, headers, **overrides):
    res = client.post("/api/vehicles", json={**COROLLA, **overrides}, headers=headers)
    assert res.status_code == 201, res.get_json()
    return res.get_json()


def test_crear_y_listar(client, auth_headers):
    vehicle = create_vehicle(client, auth_headers)
    assert vehicle["make"] == "Toyota"
    assert vehicle["initial_mileage"] == 45000

    res = client.get("/api/vehicles", headers=auth_headers)
    assert [v["id"] for v in res.get_json()] == [vehicle["id"]]


def test_validacion_de_campos(client, auth_headers):
    res = client.post("/api/vehicles", json={"model": "Corolla", "year": 1800}, headers=auth_headers)
    assert res.status_code == 400
    errors = res.get_json()["errors"]
    assert "make" in errors and "year" in errors


def test_textos_vacios_se_rechazan(client, auth_headers):
    res = client.post("/api/vehicles", json={**COROLLA, "make": "   "}, headers=auth_headers)
    assert res.status_code == 400


def test_actualizar_solo_un_campo(client, auth_headers):
    vehicle = create_vehicle(client, auth_headers)
    res = client.put(f"/api/vehicles/{vehicle['id']}", json={"color": "Gris"}, headers=auth_headers)
    assert res.status_code == 200
    assert res.get_json()["color"] == "Gris"
    assert res.get_json()["model"] == "Corolla"


def test_eliminar(client, auth_headers):
    vehicle = create_vehicle(client, auth_headers)
    assert client.delete(f"/api/vehicles/{vehicle['id']}", headers=auth_headers).status_code == 200
    assert client.get(f"/api/vehicles/{vehicle['id']}", headers=auth_headers).status_code == 404


def test_no_se_puede_ver_el_carro_de_otro_usuario(client, make_user):
    _, owner = make_user("duenio@example.com")
    _, other = make_user("otro@example.com")
    vehicle = create_vehicle(client, owner)
    url = f"/api/vehicles/{vehicle['id']}"

    assert client.get("/api/vehicles", headers=other).get_json() == []
    assert client.get(url, headers=other).status_code == 404
    assert client.put(url, json={"color": "Rojo"}, headers=other).status_code == 404
    assert client.delete(url, headers=other).status_code == 404


def test_requiere_token(client):
    assert client.get("/api/vehicles").status_code == 401
