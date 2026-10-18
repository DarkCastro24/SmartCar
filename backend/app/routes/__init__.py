from app.routes.meta_routes import meta_bp


def register_blueprints(app):
    for blueprint in (meta_bp,):
        app.register_blueprint(blueprint)
