from flask import Blueprint, abort, request
from flask_jwt_extended import current_user, jwt_required

from app.container import services
from app.serializers import user_json

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.post("/google")
def google_login():
    """Recibe el `credential` que entrega el botón de Google en el frontend."""
    credential = (request.get_json(silent=True) or {}).get("credential")
    if not credential or not isinstance(credential, str):
        abort(400, description="Falta el campo credential")

    token, user, is_new = services().auth.login_with_google(credential)
    return {"access_token": token, "user": user_json(user), "new_user": is_new}


@auth_bp.get("/me")
@jwt_required()
def me():
    return user_json(current_user)
