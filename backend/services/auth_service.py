import uuid
import hashlib
import time
from flask_jwt_extended import create_access_token, create_refresh_token
from extensions import db
from models.user import User
from utils.errors import AuthenticationError, ConflictError, ValidationError, NotFoundError


# Simple token store for password reset (in production, use Redis or DB)
_reset_tokens = {}


def register(email, password, username):
    if User.query.filter_by(email=email).first():
        raise ConflictError('Email already registered')
    if User.query.filter_by(username=username).first():
        raise ConflictError('Username already taken')

    user = User(email=email, username=username, display_name=username)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)

    return {
        'user': {'id': user.id, 'email': user.email, 'username': user.username},
        'access_token': access_token,
        'refresh_token': refresh_token,
    }


def login(email, password):
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        raise AuthenticationError('Invalid email or password')
    if not user.is_active:
        raise AuthenticationError('Account is deactivated')

    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)

    return {
        'user': {'id': user.id, 'email': user.email, 'username': user.username},
        'access_token': access_token,
        'refresh_token': refresh_token,
    }


def refresh(user_id):
    user = User.query.get(user_id)
    if not user or not user.is_active:
        raise AuthenticationError('User not found or inactive')
    access_token = create_access_token(identity=user.id)
    return {'access_token': access_token}


def generate_reset_token(email):
    user = User.query.filter_by(email=email).first()
    if not user:
        # Don't reveal whether email exists
        return
    token = hashlib.sha256(f"{user.id}{time.time()}{uuid.uuid4()}".encode()).hexdigest()
    _reset_tokens[token] = {'user_id': user.id, 'expires': time.time() + 3600}
    # In production: send email with reset link
    # For dev: log to console
    print(f"[DEV] Password reset token for {email}: {token}")
    return token


def reset_password(token, new_password):
    token_data = _reset_tokens.get(token)
    if not token_data or token_data['expires'] < time.time():
        raise ValidationError('Invalid or expired reset token')

    user = User.query.get(token_data['user_id'])
    if not user:
        raise NotFoundError('User not found')

    user.set_password(new_password)
    db.session.commit()
    del _reset_tokens[token]
