from flask import Blueprint, abort, current_app, request
from flask_jwt_extended import current_user, jwt_required

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.post("/google")
def google_login():
    """Recibe el `credential` que entrega el botón de Google en el frontend."""
    credential = (request.get_json(silent=True) or {}).get("credential")
    if not credential or not isinstance(credential, str):
        abort(400, description="Falta el campo credential")

    token, user, is_new = current_app.auth_service.login_with_google(credential)
    return {"access_token": token, "user": user.to_dict(), "new_user": is_new}


@auth_bp.get("/me")
@jwt_required()
def me():
    return current_user.to_dict()
