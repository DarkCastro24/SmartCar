from flask import abort, current_app
from flask_jwt_extended import create_access_token
from google.auth.exceptions import GoogleAuthError
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from app.models import User
from app.models.common import utcnow


class AuthService:
    def __init__(self, user_repository):
        self.users = user_repository

    def login_with_google(self, credential):
        """Verifica el token de Google, registra al usuario si no existe y devuelve un JWT propio.

        Retorna (token, usuario, es_nuevo).
        """
        info = self._verify_google_token(credential)
        email = info["email"].lower()

        user = self.users.get_by_email(email)
        is_new = user is None
        if is_new:
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

    def get_or_create_user(self, email, name=None):
        """Usado por el comando `flask dev-token` para pruebas locales."""
        email = email.lower()
        return self.users.get_by_email(email) or self.users.add(User(email=email, name=name))

    @staticmethod
    def create_token(user):
        # El "sub" del JWT debe ser texto; con un número las rutas responden 422
        return create_access_token(identity=str(user.id))

    @staticmethod
    def _verify_google_token(credential):
        client_id = current_app.config.get("GOOGLE_CLIENT_ID")
        if not client_id:
            abort(500, description="GOOGLE_CLIENT_ID no está configurado en el servidor")
        try:
            # Revisa la firma de Google, que no haya expirado y que sea para nuestra app
            info = id_token.verify_oauth2_token(credential, google_requests.Request(), client_id)
        except (ValueError, GoogleAuthError):
            abort(401, description="Token de Google inválido o expirado")
        if not info.get("email") or not info.get("email_verified"):
            abort(401, description="La cuenta de Google no tiene un correo verificado")
        return info
