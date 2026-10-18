from app.extensions import db
from app.repositories import UserRepository
from app.services.auth_service import AuthService


def register_services(app):
    """Crea los repositorios y servicios una sola vez y los guarda en la app.

    En las rutas se usan así: current_app.auth_service.login_with_google(...)
    """
    session = db.session
    users = UserRepository(session)

    app.auth_service = AuthService(users)
