from marshmallow import fields, validate

from app.schemas.base import BaseSchema


class VehicleSchema(BaseSchema):
    make = fields.String(required=True, validate=validate.Length(max=50))
    model = fields.String(required=True, validate=validate.Length(max=50))
    year = fields.Integer(allow_none=True, validate=validate.Range(min=1900, max=2100))
    plate = fields.String(allow_none=True, validate=validate.Length(max=20))
    color = fields.String(allow_none=True, validate=validate.Length(max=30))
    initial_mileage = fields.Integer(
        load_default=0, validate=validate.Range(min=0, max=2_000_000)
    )
