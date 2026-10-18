from flask import abort, request


def load_body(schema, partial=False):
    """Lee el JSON del request y lo valida con un esquema de marshmallow."""
    data = request.get_json(silent=True)
    if data is None:
        abort(400, description="El cuerpo de la petición debe ser JSON")
    return schema.load(data, partial=partial)
