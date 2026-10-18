from flask import jsonify
from marshmallow import ValidationError
from werkzeug.exceptions import HTTPException


def register_error_handlers(app):
    """Hace que todos los errores respondan JSON con la forma {"msg": ...}."""

    @app.errorhandler(ValidationError)
    def validation_error(err):
        # Errores de marshmallow: {"msg": ..., "errors": {"campo": ["mensaje"]}}
        return jsonify(msg="Datos inválidos", errors=err.messages), 400

    @app.errorhandler(HTTPException)
    def http_error(err):
        # abort(404, description="...") y cualquier otro error HTTP
        return jsonify(msg=err.description), err.code
