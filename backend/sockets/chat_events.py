from flask import request
from flask_jwt_extended import decode_token
from extensions import db


# Store user_id -> session_id mapping
connected_users = {}


def register_chat_events(socketio):

    @socketio.on('connect')
    def handle_connect(auth=None):
        token = None
        if auth and isinstance(auth, dict):
            token = auth.get('token')

        if not token:
            return False  # reject connection

        try:
            decoded = decode_token(token)
            user_id = decoded['sub']
            connected_users[user_id] = request.sid
            # Join personal room for notifications
            from flask_socketio import join_room
            join_room(f'user_{user_id}')
            print(f'[Socket] User {user_id} connected (sid: {request.sid})')
            return True
        except Exception as e:
            print(f'[Socket] Connection rejected: {e}')
            return False

    @socketio.on('disconnect')
    def handle_disconnect():
        # Find and remove user from connected_users
        sid = request.sid
        user_id = None
        for uid, s in connected_users.items():
            if s == sid:
                user_id = uid
                break
        if user_id:
            del connected_users[user_id]
            print(f'[Socket] User {user_id} disconnected')

    @socketio.on('join_conversation')
    def handle_join_conversation(data):
        conversation_id = data.get('conversation_id')
        if not conversation_id:
            return

        # Verify user is participant
        user_id = _get_user_id_from_sid(request.sid)
        if not user_id:
            return

        from models.message import Conversation
        conv = Conversation.query.get(conversation_id)
        if not conv or (conv.buyer_id != user_id and conv.seller_id != user_id):
            return

        from flask_socketio import join_room
        join_room(f'conv_{conversation_id}')
        print(f'[Socket] User {user_id} joined conv_{conversation_id}')

    @socketio.on('leave_conversation')
    def handle_leave_conversation(data):
        conversation_id = data.get('conversation_id')
        if conversation_id:
            from flask_socketio import leave_room
            leave_room(f'conv_{conversation_id}')

    @socketio.on('send_message')
    def handle_send_message(data):
        user_id = _get_user_id_from_sid(request.sid)
        if not user_id:
            return

        conversation_id = data.get('conversation_id')
        content = data.get('content')
        if not conversation_id or not content:
            return

        from services.chat_service import send_message
        try:
            message = send_message(conversation_id, user_id, content)
            # Serialize and emit to room
            msg_data = {
                'id': message.id,
                'conversation_id': message.conversation_id,
                'sender_id': message.sender_id,
                'sender': {
                    'id': message.sender.id,
                    'username': message.sender.username,
                    'display_name': message.sender.display_name,
                    'avatar_url': message.sender.avatar_url,
                },
                'content': message.content,
                'message_type': message.message_type,
                'offer_amount': None,
                'offer_status': None,
                'is_read': False,
                'created_at': message.created_at.isoformat(),
            }
            socketio.emit('new_message', msg_data, room=f'conv_{conversation_id}')
        except Exception as e:
            print(f'[Socket] Error sending message: {e}')

    @socketio.on('typing')
    def handle_typing(data):
        user_id = _get_user_id_from_sid(request.sid)
        conversation_id = data.get('conversation_id')
        if user_id and conversation_id:
            from models.user import User
            user = User.query.get(user_id)
            username = user.display_name or user.username if user else 'Usuario'
            socketio.emit('user_typing', {
                'user_id': user_id,
                'username': username,
                'conversation_id': conversation_id,
            }, room=f'conv_{conversation_id}', include_self=False)


def _get_user_id_from_sid(sid):
    for uid, s in connected_users.items():
        if s == sid:
            return uid
    return None
