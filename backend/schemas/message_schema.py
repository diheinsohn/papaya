from marshmallow import fields
from extensions import ma


class MessageSchema(ma.Schema):
    id = fields.String()
    conversation_id = fields.String()
    sender_id = fields.String()
    content = fields.String()
    message_type = fields.String()
    offer_amount = fields.Decimal(as_string=True)
    offer_status = fields.String()
    is_read = fields.Boolean()
    created_at = fields.DateTime()
