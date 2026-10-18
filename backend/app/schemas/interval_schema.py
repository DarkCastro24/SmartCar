from marshmallow import ValidationError, fields, validate, validates_schema

from app.models import MaintenanceType
from app.schemas.base import BaseSchema


class IntervalSchema(BaseSchema):
    type = fields.Enum(MaintenanceType, by_value=True, required=True)
    every_miles = fields.Integer(
        allow_none=True, load_default=None, validate=validate.Range(min=100, max=500_000)
    )
    every_months = fields.Integer(
        allow_none=True, load_default=None, validate=validate.Range(min=1, max=240)
    )

    @validates_schema
    def at_least_one(self, data, **kwargs):
        if not data.get("every_miles") and not data.get("every_months"):
            raise ValidationError("Indica every_miles, every_months o ambos.")
