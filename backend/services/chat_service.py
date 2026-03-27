from datetime import datetime, timezone
from extensions import db
from models.message import Conversation, Message
from models.listing import Listing
from utils.errors import NotFoundError, AuthorizationError, ValidationError


def get_or_create_conversation(listing_id, buyer_id):
    """Get existing conversation or create new one for this buyer+listing."""
    listing = Listing.query.get(listing_id)
    if not listing or listing.status == 'deleted':
        raise NotFoundError('Listing not found')
    if listing.seller_id == buyer_id:
        raise ValidationError('No puedes iniciar una conversación con tu propio artículo')

    conv = Conversation.query.filter_by(listing_id=listing_id, buyer_id=buyer_id).first()
    if conv:
        return conv, False  # existing

    conv = Conversation(
        listing_id=listing_id,
        buyer_id=buyer_id,
        seller_id=listing.seller_id,
    )
    db.session.add(conv)
    db.session.commit()
    return conv, True  # new


def get_conversation(conversation_id, user_id):
    """Get conversation if user is a participant."""
    conv = Conversation.query.get(conversation_id)
    if not conv:
        raise NotFoundError('Conversation not found')
    if conv.buyer_id != user_id and conv.seller_id != user_id:
        raise AuthorizationError('Not a participant in this conversation')
    return conv


def get_user_conversations(user_id, page=1, per_page=20):
    """Get all conversations for a user, sorted by last message."""
    from utils.pagination import paginate
    query = Conversation.query.filter(
        db.or_(Conversation.buyer_id == user_id, Conversation.seller_id == user_id),
        Conversation.status == 'active',
    ).order_by(Conversation.last_message_at.desc().nullslast())
    return paginate(query, page, per_page)


def send_message(conversation_id, sender_id, content, message_type='text'):
    """Send a text message in a conversation."""
    conv = get_conversation(conversation_id, sender_id)

    message = Message(
        conversation_id=conv.id,
        sender_id=sender_id,
        content=content,
        message_type=message_type,
    )
    db.session.add(message)
    conv.last_message_at = datetime.now(timezone.utc)
    db.session.commit()
    return message


def send_offer(conversation_id, sender_id, amount):
    """Send a price offer in a conversation."""
    conv = get_conversation(conversation_id, sender_id)

    # Check no pending offer exists
    pending = Message.query.filter_by(
        conversation_id=conv.id,
        message_type='offer',
        offer_status='pending',
    ).first()
    if pending:
        raise ValidationError('Ya hay una oferta pendiente en esta conversación')

    message = Message(
        conversation_id=conv.id,
        sender_id=sender_id,
        content=f'Oferta: ${amount:,.0f} CLP',
        message_type='offer',
        offer_amount=amount,
        offer_status='pending',
    )
    db.session.add(message)
    conv.last_message_at = datetime.now(timezone.utc)
    db.session.commit()
    return message


def respond_to_offer(message_id, user_id, accept):
    """Accept or reject an offer."""
    message = Message.query.get(message_id)
    if not message or message.message_type != 'offer':
        raise NotFoundError('Offer not found')
    if message.offer_status != 'pending':
        raise ValidationError('Esta oferta ya fue respondida')

    conv = get_conversation(message.conversation_id, user_id)

    # Only the OTHER person can respond to an offer
    if message.sender_id == user_id:
        raise ValidationError('No puedes responder tu propia oferta')

    if accept:
        message.offer_status = 'accepted'
        # Mark listing as reserved
        listing = Listing.query.get(conv.listing_id)
        if listing:
            listing.status = 'reserved'
        # Add system message
        sys_msg = Message(
            conversation_id=conv.id,
            sender_id=user_id,
            content=f'Oferta de ${message.offer_amount:,.0f} CLP aceptada',
            message_type='system',
        )
        db.session.add(sys_msg)
    else:
        message.offer_status = 'rejected'
        sys_msg = Message(
            conversation_id=conv.id,
            sender_id=user_id,
            content='Oferta rechazada',
            message_type='system',
        )
        db.session.add(sys_msg)

    conv.last_message_at = datetime.now(timezone.utc)
    db.session.commit()
    return message


def mark_read(conversation_id, user_id):
    """Mark all messages in conversation as read for this user."""
    conv = get_conversation(conversation_id, user_id)
    Message.query.filter(
        Message.conversation_id == conv.id,
        Message.sender_id != user_id,
        Message.is_read == False,
    ).update({'is_read': True})
    db.session.commit()


def get_unread_count(user_id):
    """Get total unread message count for a user."""
    count = db.session.query(db.func.count(Message.id)).join(
        Conversation, Message.conversation_id == Conversation.id
    ).filter(
        db.or_(Conversation.buyer_id == user_id, Conversation.seller_id == user_id),
        Message.sender_id != user_id,
        Message.is_read == False,
    ).scalar()
    return count or 0


def get_messages(conversation_id, user_id, page=1, per_page=50):
    """Get paginated messages for a conversation."""
    conv = get_conversation(conversation_id, user_id)
    from utils.pagination import paginate
    query = Message.query.filter_by(conversation_id=conv.id).order_by(Message.created_at.desc())
    return paginate(query, page, per_page)
