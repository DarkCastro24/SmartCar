import datetime as dt

from marshmallow import ValidationError, fields, validate, validates_schema

from app.models import MaintenanceType
from app.schemas.base import BaseSchema

MAX_MILEAGE = 2_000_000


def not_in_future(value):
    # Un día de margen por la diferencia de zona horaria con el servidor (UTC)
    if value > dt.date.today() + dt.timedelta(days=1):
        raise ValidationError("La fecha no puede estar en el futuro.")


class RecordSchema(BaseSchema):
    """Campos comunes de mantenimientos y cargas de combustible."""

    date = fields.Date(required=True, validate=not_in_future)  # formato AAAA-MM-DD
    mileage = fields.Integer(required=True, validate=validate.Range(min=0, max=MAX_MILEAGE))
    notes = fields.String(allow_none=True, validate=validate.Length(max=1000))


class MaintenanceSchema(RecordSchema):
    type = fields.Enum(MaintenanceType, by_value=True, required=True)
    cost = fields.Decimal(allow_none=True, places=2, validate=validate.Range(min=0))


class FuelLogSchema(RecordSchema):
    gallons = fields.Decimal(
        required=True, places=3, validate=validate.Range(min=0, min_inclusive=False, max=200)
    )
    total_cost = fields.Decimal(allow_none=True, places=2, validate=validate.Range(min=0))
    full_tank = fields.Boolean(load_default=True)


class DateRangeSchema(BaseSchema):
    """Filtros de la sección Consultar: ?from=2026-01-01&to=2026-06-30"""

    date_from = fields.Date(data_key="from")
    date_to = fields.Date(data_key="to")

    @validates_schema
    def check_range(self, data, **kwargs):
        if data.get("date_from") and data.get("date_to") and data["date_from"] > data["date_to"]:
            raise ValidationError("'from' debe ser anterior o igual a 'to'.", "from")


class MaintenanceFilterSchema(DateRangeSchema):
    type = fields.Enum(MaintenanceType, by_value=True)  # ?type=oil_change
