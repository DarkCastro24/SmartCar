from flask import jsonify

from app.extensions import db, jwt
from app.models import User


def register_jwt_callbacks():
    """Respuestas en español para los errores de token y carga de `current_user`."""

    @jwt.user_lookup_loader
    def load_user(_jwt_header, jwt_data):
        # Permite usar `current_user` (de flask_jwt_extended) dentro de las rutas
        try:
            return db.session.get(User, int(jwt_data["sub"]))
        except (TypeError, ValueError):
            return None

    @jwt.user_lookup_error_loader
    def user_not_found(_jwt_header, _jwt_data):
        return jsonify(msg="El usuario de este token ya no existe"), 401

    @jwt.unauthorized_loader
    def missing_token(_reason):
        return jsonify(msg="Falta el token de acceso (Authorization: Bearer <token>)"), 401

    @jwt.invalid_token_loader
    def invalid_token(_reason):
        return jsonify(msg="Token inválido"), 401

    @jwt.expired_token_loader
    def expired_token(_jwt_header, _jwt_data):
        return jsonify(msg="La sesión expiró, inicia sesión de nuevo"), 401
