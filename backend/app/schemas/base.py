from marshmallow import EXCLUDE, Schema, pre_load


class BaseSchema(Schema):
    """Base de los esquemas de validación de SmartCar."""

    class Meta:
        unknown = EXCLUDE  # ignora campos extra (id, created_at...) en vez de fallar

    @pre_load
    def clean_strings(self, data, **kwargs):
        # Quita espacios a los textos y convierte "" en null
        if not isinstance(data, dict):
            return data
        return {
            key: (value.strip() or None) if isinstance(value, str) else value
            for key, value in data.items()
        }
