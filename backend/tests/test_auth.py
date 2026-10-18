import pytest
from google.oauth2 import id_token

from app.models import User

GOOGLE_INFO = {
    "sub": "google-123",
    "email": "Diego@Gmail.com",
    "email_verified": True,
    "name": "Diego Castro",
    "picture": "https://example.com/foto.png",
}


@pytest.fixture
def fake_google(monkeypatch):
    """Simula la verificación de Google para no depender de internet."""
    state = {"info": dict(GOOGLE_INFO)}

    def fake_verify(token, _request, audience):
        state["audience"] = audience
        if token != "token-valido":
            raise ValueError("Token inválido")
        return dict(state["info"])

    monkeypatch.setattr(id_token, "verify_oauth2_token", fake_verify)
    return state


def login(client, credential="token-valido"):
    return client.post("/api/auth/google", json={"credential": credential})


def test_primer_login_registra_al_usuario(client, fake_google):
    res = login(client)

    assert res.status_code == 200
    body = res.get_json()
    assert body["new_user"] is True
    assert body["user"]["email"] == "diego@gmail.com"
    assert body["user"]["name"] == "Diego Castro"
    assert fake_google["audience"] == "test-client-id.apps.googleusercontent.com"

    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {body['access_token']}"})
    assert me.status_code == 200
    assert me.get_json()["email"] == "diego@gmail.com"


def test_segundo_login_encuentra_al_mismo_usuario(app, client, fake_google):
    first = login(client).get_json()
    fake_google["info"]["name"] = "Diego C."
    second = login(client).get_json()

    assert second["new_user"] is False
    assert second["user"]["id"] == first["user"]["id"]
    assert second["user"]["name"] == "Diego C."
    assert User.query.count() == 1


def test_token_de_google_invalido(client, fake_google):
    res = login(client, credential="token-falso")
    assert res.status_code == 401
    assert res.get_json()["msg"] == "Token de Google inválido o expirado"


def test_correo_no_verificado(client, fake_google):
    fake_google["info"]["email_verified"] = False
    assert login(client).status_code == 401


def test_falta_credential(client):
    res = client.post("/api/auth/google", json={})
    assert res.status_code == 400


def test_me_sin_token(client):
    res = client.get("/api/auth/me")
    assert res.status_code == 401
    assert "Falta el token" in res.get_json()["msg"]


def test_comando_dev_token(app):
    result = app.test_cli_runner().invoke(args=["dev-token", "Prueba@Example.com"])
    assert result.exit_code == 0
    assert "Authorization: Bearer " in result.output
    assert User.query.filter_by(email="prueba@example.com").count() == 1


def test_comando_seed_demo_crea_datos_validos(app, make_user):
    result = app.test_cli_runner().invoke(args=["seed-demo", "demo@example.com"])
    assert result.exit_code == 0, result.output

    _, headers = make_user("demo@example.com")
    client = app.test_client()
    [vehicle] = client.get("/api/vehicles", headers=headers).get_json()
    status = client.get(f"/api/vehicles/{vehicle['id']}/status", headers=headers).get_json()
    items = {item["type"]: item["status"] for item in status["items"]}
    assert items["air_filter"] == "vencido"
    assert items["battery"] == "proximo"
    assert "sin_registro" not in items.values()

    stats = client.get(f"/api/vehicles/{vehicle['id']}/stats", headers=headers).get_json()
    plugs = next(i for i in stats["maintenance_impact"] if i["type"] == "spark_plugs")
    assert plugs["change_pct"] > 0  # el rendimiento mejora después de las bujías
