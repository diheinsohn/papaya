import uuid
from datetime import datetime, timezone
from extensions import db


class Conversation(db.Model):
    __tablename__ = 'conversations'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    listing_id = db.Column(db.String(36), db.ForeignKey('listings.id'), nullable=False)
    buyer_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    seller_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(20), default='active')  # active, archived, blocked
    last_message_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    listing = db.relationship('Listing', backref='conversations')
    buyer = db.relationship('User', foreign_keys=[buyer_id], backref='conversations_as_buyer')
    seller = db.relationship('User', foreign_keys=[seller_id], backref='conversations_as_seller')
    messages = db.relationship('Message', backref='conversation', order_by='Message.created_at', cascade='all, delete-orphan')

    __table_args__ = (
        db.UniqueConstraint('listing_id', 'buyer_id', name='uq_conversation_listing_buyer'),
    )

    def __repr__(self):
        return f'<Conversation {self.id}>'


class Message(db.Model):
    __tablename__ = 'messages'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = db.Column(db.String(36), db.ForeignKey('conversations.id'), nullable=False)
    sender_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text)
    message_type = db.Column(db.String(20), default='text')  # text, offer, system
    offer_amount = db.Column(db.Numeric(12, 2), nullable=True)
    offer_status = db.Column(db.String(20), nullable=True)  # pending, accepted, rejected, expired
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    sender = db.relationship('User', backref='messages')

    def __repr__(self):
        return f'<Message {self.id}>'
