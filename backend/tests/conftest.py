import pytest

from app import create_app
from app.config import TestConfig
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
        user = app.auth_service.get_or_create_user(email)
        token = app.auth_service.create_token(user)
        return user, {"Authorization": f"Bearer {token}"}

    return _make


@pytest.fixture
def auth_headers(make_user):
    return make_user()[1]
