from app.routes.auth_routes import auth_bp
from app.routes.meta_routes import meta_bp
from app.routes.vehicle_routes import vehicles_bp


def register_blueprints(app):
    for blueprint in (meta_bp, auth_bp, vehicles_bp):
        app.register_blueprint(blueprint)
