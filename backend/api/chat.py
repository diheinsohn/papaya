from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from services import chat_service
from models.message import Conversation, Message

chat_bp = Blueprint('chat', __name__)


def _serialize_message(msg):
    return {
        'id': msg.id,
        'conversation_id': msg.conversation_id,
        'sender_id': msg.sender_id,
        'sender': {
            'id': msg.sender.id,
            'username': msg.sender.username,
            'display_name': msg.sender.display_name,
            'avatar_url': msg.sender.avatar_url,
        },
        'content': msg.content,
        'message_type': msg.message_type,
        'offer_amount': str(msg.offer_amount) if msg.offer_amount else None,
        'offer_status': msg.offer_status,
        'is_read': msg.is_read,
        'created_at': msg.created_at.isoformat(),
    }


def _serialize_conversation(conv, user_id):
    last_msg = Message.query.filter_by(conversation_id=conv.id).order_by(Message.created_at.desc()).first()
    other_user = conv.seller if conv.buyer_id == user_id else conv.buyer
    unread = Message.query.filter(
        Message.conversation_id == conv.id,
        Message.sender_id != user_id,
        Message.is_read == False,
    ).count()

    return {
        'id': conv.id,
        'listing': {
            'id': conv.listing.id,
            'title': conv.listing.title,
            'price': str(conv.listing.price),
            'thumbnail': conv.listing.images[0].thumbnail_url if conv.listing.images else None,
        },
        'other_user': {
            'id': other_user.id,
            'username': other_user.username,
            'display_name': other_user.display_name,
            'avatar_url': other_user.avatar_url,
        },
        'last_message': _serialize_message(last_msg) if last_msg else None,
        'unread_count': unread,
        'status': conv.status,
        'created_at': conv.created_at.isoformat(),
        'last_message_at': conv.last_message_at.isoformat() if conv.last_message_at else None,
    }


@chat_bp.route('/chat/conversations', methods=['GET'])
@jwt_required()
def get_conversations():
    user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    result = chat_service.get_user_conversations(user_id, page, per_page)
    result['items'] = [_serialize_conversation(c, user_id) for c in result['items']]
    return result, 200


@chat_bp.route('/chat/conversations', methods=['POST'])
@jwt_required()
def create_conversation():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True)
    if not data or 'listing_id' not in data:
        return {'error': 'ValidationError', 'message': 'listing_id is required'}, 400

    conv, is_new = chat_service.get_or_create_conversation(data['listing_id'], user_id)

    # Send initial message if provided
    if data.get('message'):
        chat_service.send_message(conv.id, user_id, data['message'])

    return _serialize_conversation(conv, user_id), 201 if is_new else 200


@chat_bp.route('/chat/conversations/<conv_id>', methods=['GET'])
@jwt_required()
def get_conversation(conv_id):
    user_id = get_jwt_identity()
    conv = chat_service.get_conversation(conv_id, user_id)
    return _serialize_conversation(conv, user_id), 200


@chat_bp.route('/chat/conversations/<conv_id>/messages', methods=['GET'])
@jwt_required()
def get_messages(conv_id):
    user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    result = chat_service.get_messages(conv_id, user_id, page, per_page)
    result['items'] = [_serialize_message(m) for m in result['items']]
    return result, 200


@chat_bp.route('/chat/conversations/<conv_id>/messages', methods=['POST'])
@jwt_required()
def send_message(conv_id):
    user_id = get_jwt_identity()
    data = request.get_json(silent=True)
    if not data or not data.get('content'):
        return {'error': 'ValidationError', 'message': 'content is required'}, 400

    message = chat_service.send_message(conv_id, user_id, data['content'])

    # Emit via SocketIO
    from extensions import socketio
    socketio.emit('new_message', _serialize_message(message), room=f'conv_{conv_id}')

    return _serialize_message(message), 201


@chat_bp.route('/chat/conversations/<conv_id>/offer', methods=['POST'])
@jwt_required()
def send_offer(conv_id):
    user_id = get_jwt_identity()
    data = request.get_json(silent=True)
    if not data or not data.get('amount'):
        return {'error': 'ValidationError', 'message': 'amount is required'}, 400

    try:
        amount = float(data['amount'])
    except (ValueError, TypeError):
        return {'error': 'ValidationError', 'message': 'Invalid amount'}, 400

    message = chat_service.send_offer(conv_id, user_id, amount)

    from extensions import socketio
    socketio.emit('new_message', _serialize_message(message), room=f'conv_{conv_id}')

    return _serialize_message(message), 201


@chat_bp.route('/chat/conversations/<conv_id>/offer/<message_id>', methods=['PATCH'])
@jwt_required()
def respond_offer(conv_id, message_id):
    user_id = get_jwt_identity()
    data = request.get_json(silent=True)
    if not data or 'accept' not in data:
        return {'error': 'ValidationError', 'message': 'accept (true/false) is required'}, 400

    message = chat_service.respond_to_offer(message_id, user_id, data['accept'])

    from extensions import socketio
    socketio.emit('offer_updated', _serialize_message(message), room=f'conv_{conv_id}')

    return _serialize_message(message), 200


@chat_bp.route('/chat/conversations/<conv_id>/read', methods=['PATCH'])
@jwt_required()
def mark_read(conv_id):
    user_id = get_jwt_identity()
    chat_service.mark_read(conv_id, user_id)

    from extensions import socketio
    socketio.emit('messages_read', {'conversation_id': conv_id, 'reader_id': user_id}, room=f'conv_{conv_id}')

    return {'message': 'Messages marked as read'}, 200


@chat_bp.route('/chat/unread-count', methods=['GET'])
@jwt_required()
def unread_count():
    user_id = get_jwt_identity()
    count = chat_service.get_unread_count(user_id)
    return {'unread_count': count}, 200
