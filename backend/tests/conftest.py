import pytest

from app import create_app
from app.config import TestConfig
from app.container import services
from app.extensions import db


@pytest.fixture
def app():
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def make_user(app):
    """Crea un usuario y devuelve (usuario, headers con su token)."""

    def _make(email="diego@example.com"):
        user = services(app).auth.get_or_create_user(email)
        token = services(app).auth.create_token(user)
        return user, {"Authorization": f"Bearer {token}"}

    return _make


@pytest.fixture
def auth_headers(make_user):
    return make_user()[1]


@pytest.fixture
def vehicle_id(client, auth_headers):
    """Crea un vehículo del usuario de prueba y devuelve su id."""
    res = client.post(
        "/api/vehicles",
        json={"make": "Toyota", "model": "Corolla", "year": 2018, "initial_mileage": 40000},
        headers=auth_headers,
    )
    return res.get_json()["id"]
