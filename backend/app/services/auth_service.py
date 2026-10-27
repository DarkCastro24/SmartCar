from collections.abc import Callable
from typing import Any

from flask_jwt_extended import create_access_token
from google.auth.exceptions import GoogleAuthError
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from app.domain.errors import AuthenticationError, ConfigurationError
from app.models import User
from app.models.common import utcnow
from app.repositories import UnitOfWork, UserRepository

# (credential, client_id) -> datos del usuario según Google
GoogleVerifier = Callable[[str, str], dict[str, Any]]


def verify_with_google(credential: str, client_id: str) -> dict[str, Any]:
    """Revisa la firma de Google, que no haya expirado y que sea para nuestra app."""
    return id_token.verify_oauth2_token(credential, google_requests.Request(), client_id)


class AuthService:
    def __init__(
        self,
        users: UserRepository,
        uow: UnitOfWork,
        google_client_id: str | None,
        verify_google_token: GoogleVerifier = verify_with_google,
    ):
        self.users = users
        self.uow = uow
        self.google_client_id = google_client_id
        # Se inyecta para poder probar el servicio sin llamar a Google
        self.verify_google_token = verify_google_token

    def login_with_google(self, credential: str) -> tuple[str, User, bool]:
        """Verifica el token de Google, registra al usuario si no existe y devuelve un JWT propio.

        Retorna (token, usuario, es_nuevo).
        """
        info = self._google_identity(credential)
        email = info["email"].lower()

        with self.uow.transaction():
            user = self.users.get_by_email(email)
            is_new = user is None
            if user is None:
                user = self.users.add(
                    User(
                        email=email,
                        google_sub=info["sub"],
                        name=info.get("name"),
                        picture=info.get("picture"),
                        last_login_at=utcnow(),
                    )
                )
            else:
                # Mantener nombre y foto al día con la cuenta de Google
                self.users.update(
                    user,
                    {
                        "google_sub": user.google_sub or info["sub"],
                        "name": info.get("name") or user.name,
                        "picture": info.get("picture") or user.picture,
                        "last_login_at": utcnow(),
                    },
                )
        return self.create_token(user), user, is_new

    def get_or_create_user(self, email: str, name: str | None = None) -> User:
        """Usado por los comandos `flask dev-token` y `flask seed-demo`."""
        email = email.lower()
        with self.uow.transaction():
            return self.users.get_by_email(email) or self.users.add(User(email=email, name=name))

    @staticmethod
    def create_token(user: User) -> str:
        # El "sub" del JWT debe ser texto; con un número las rutas responden 422
        return create_access_token(identity=str(user.id))

    def _google_identity(self, credential: str) -> dict[str, Any]:
        if not self.google_client_id:
            raise ConfigurationError("GOOGLE_CLIENT_ID no está configurado en el servidor")
        try:
            info = self.verify_google_token(credential, self.google_client_id)
        except (ValueError, GoogleAuthError) as error:
            raise AuthenticationError("Token de Google inválido o expirado") from error
        if not info.get("email") or not info.get("email_verified"):
            raise AuthenticationError("La cuenta de Google no tiene un correo verificado")
        return info
