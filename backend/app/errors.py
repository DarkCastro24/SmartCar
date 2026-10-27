from flask import jsonify
from marshmallow import ValidationError
from werkzeug.exceptions import HTTPException

from app.domain.errors import (
    AuthenticationError,
    BusinessRuleError,
    ConfigurationError,
    DomainError,
    NotFoundError,
)

# Única traducción de errores de negocio a códigos HTTP
STATUS_BY_ERROR: dict[type[DomainError], int] = {
    NotFoundError: 404,
    BusinessRuleError: 400,
    AuthenticationError: 401,
    ConfigurationError: 500,
}


def status_for(error: DomainError) -> int:
    for error_type in type(error).__mro__:
        if error_type in STATUS_BY_ERROR:
            return STATUS_BY_ERROR[error_type]
    return 400


def register_error_handlers(app):
    """Hace que todos los errores respondan JSON con la forma {"msg": ...}."""

    @app.errorhandler(DomainError)
    def domain_error(err: DomainError):
        return jsonify(msg=err.message), status_for(err)

    @app.errorhandler(ValidationError)
    def validation_error(err: ValidationError):
        # Errores de marshmallow: {"msg": ..., "errors": {"campo": ["mensaje"]}}
        return jsonify(msg="Datos inválidos", errors=err.messages), 400

    @app.errorhandler(HTTPException)
    def http_error(err: HTTPException):
        # Errores propios de la capa web: JSON inválido, ruta inexistente, etc.
        return jsonify(msg=err.description), err.code
