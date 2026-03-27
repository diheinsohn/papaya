from marshmallow import fields, validate
from extensions import ma


class ListingImageSchema(ma.Schema):
    id = fields.String()
    url = fields.String()
    thumbnail_url = fields.String()
    sort_order = fields.Integer()


class SellerSummarySchema(ma.Schema):
    id = fields.String()
    username = fields.String()
    display_name = fields.String()
    avatar_url = fields.String()


class CategorySchema(ma.Schema):
    id = fields.Integer()
    name = fields.String()
    slug = fields.String()
    icon = fields.String()
    parent_id = fields.Integer()
    sort_order = fields.Integer()


class ListingCreateSchema(ma.Schema):
    title = fields.String(required=True, validate=validate.Length(min=3, max=200))
    description = fields.String(validate=validate.Length(max=5000))
    price = fields.Decimal(required=True, as_string=True)
    currency = fields.String(load_default='CLP', validate=validate.Length(max=3))
    condition = fields.String(required=True, validate=validate.OneOf(['new', 'like_new', 'good', 'fair', 'poor']))
    category_id = fields.Integer(required=True)
    location_lat = fields.Float()
    location_lng = fields.Float()
    location_name = fields.String(validate=validate.Length(max=200))


class ListingUpdateSchema(ma.Schema):
    title = fields.String(validate=validate.Length(min=3, max=200))
    description = fields.String(validate=validate.Length(max=5000))
    price = fields.Decimal(as_string=True)
    currency = fields.String(validate=validate.Length(max=3))
    condition = fields.String(validate=validate.OneOf(['new', 'like_new', 'good', 'fair', 'poor']))
    category_id = fields.Integer()
    location_lat = fields.Float()
    location_lng = fields.Float()
    location_name = fields.String(validate=validate.Length(max=200))


class ListingResponseSchema(ma.Schema):
    id = fields.String()
    title = fields.String()
    description = fields.String()
    price = fields.Decimal(as_string=True)
    currency = fields.String()
    condition = fields.String()
    category_id = fields.Integer()
    category = fields.Nested(CategorySchema)
    location_lat = fields.Float()
    location_lng = fields.Float()
    location_name = fields.String()
    status = fields.String()
    view_count = fields.Integer()
    is_promoted = fields.Boolean()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()
    images = fields.Nested(ListingImageSchema, many=True)
    seller = fields.Nested(SellerSummarySchema)
    is_favorited = fields.Boolean()


class ListingListSchema(ma.Schema):
    id = fields.String()
    title = fields.String()
    price = fields.Decimal(as_string=True)
    currency = fields.String()
    condition = fields.String()
    location_name = fields.String()
    status = fields.String()
    is_promoted = fields.Boolean()
    created_at = fields.DateTime()
    images = fields.Nested(ListingImageSchema, many=True)
    seller = fields.Nested(SellerSummarySchema)
    is_favorited = fields.Boolean()


class ImageReorderSchema(ma.Schema):
    image_ids = fields.List(fields.String(), required=True)
