from marshmallow import fields, validate
from extensions import ma


class LeadCreateSchema(ma.Schema):
    email = fields.Email(required=True, validate=validate.Length(max=255))
    source = fields.String(load_default='landing', validate=validate.Length(max=50))
