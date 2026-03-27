from marshmallow import fields, validate
from extensions import ma


class RegisterSchema(ma.Schema):
    email = fields.Email(required=True, validate=validate.Length(max=255))
    password = fields.String(required=True, validate=validate.Length(min=8, max=128))
    username = fields.String(required=True, validate=[
        validate.Length(min=3, max=50),
        validate.Regexp(r'^[a-zA-Z0-9_]+$', error='Username must contain only letters, numbers, and underscores')
    ])


class LoginSchema(ma.Schema):
    email = fields.Email(required=True)
    password = fields.String(required=True)


class UserUpdateSchema(ma.Schema):
    display_name = fields.String(validate=validate.Length(max=100))
    bio = fields.String(validate=validate.Length(max=500))
    phone = fields.String(validate=validate.Length(max=20))
    location_lat = fields.Float()
    location_lng = fields.Float()
    location_name = fields.String(validate=validate.Length(max=200))


class UserPublicSchema(ma.Schema):
    id = fields.String()
    username = fields.String()
    display_name = fields.String()
    avatar_url = fields.String()
    bio = fields.String()
    location_name = fields.String()
    is_verified = fields.Boolean()
    created_at = fields.DateTime()


class UserPrivateSchema(UserPublicSchema):
    email = fields.String()
    phone = fields.String()
    location_lat = fields.Float()
    location_lng = fields.Float()
    is_active = fields.Boolean()
    last_seen_at = fields.DateTime()
    updated_at = fields.DateTime()


class ForgotPasswordSchema(ma.Schema):
    email = fields.Email(required=True)


class ResetPasswordSchema(ma.Schema):
    token = fields.String(required=True)
    password = fields.String(required=True, validate=validate.Length(min=8, max=128))
