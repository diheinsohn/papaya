import os
import uuid as uuid_lib
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from schemas.user_schema import UserUpdateSchema, UserPublicSchema, UserPrivateSchema
from services import user_service

users_bp = Blueprint('users', __name__)

update_schema = UserUpdateSchema()
public_schema = UserPublicSchema()
private_schema = UserPrivateSchema()


@users_bp.route('/users/me', methods=['GET'])
@jwt_required()
def get_me():
    user_id = get_jwt_identity()
    user = user_service.get_user(user_id)
    return private_schema.dump(user), 200


@users_bp.route('/users/me', methods=['PATCH'])
@jwt_required()
def update_me():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True)
    if not data:
        return {'error': 'ValidationError', 'message': 'Request body is required'}, 400

    errors = update_schema.validate(data)
    if errors:
        return {'error': 'ValidationError', 'messages': errors}, 400

    validated = update_schema.load(data)
    user = user_service.update_profile(user_id, validated)
    return private_schema.dump(user), 200


@users_bp.route('/users/me/avatar', methods=['POST'])
@jwt_required()
def upload_avatar():
    user_id = get_jwt_identity()
    if 'avatar' not in request.files:
        return {'error': 'ValidationError', 'message': 'No avatar file provided'}, 400

    file = request.files['avatar']
    if file.filename == '':
        return {'error': 'ValidationError', 'message': 'No file selected'}, 400

    upload_dir = os.environ.get('UPLOAD_DIR', 'uploads')
    os.makedirs(upload_dir, exist_ok=True)

    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else 'jpg'
    if ext not in ('jpg', 'jpeg', 'png', 'webp'):
        return {'error': 'ValidationError', 'message': 'Invalid file format. Use jpg, png, or webp'}, 400

    filename = f"avatar_{user_id}_{uuid_lib.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(upload_dir, filename)
    file.save(filepath)

    avatar_url = f"/uploads/{filename}"
    user = user_service.update_avatar(user_id, avatar_url)
    return private_schema.dump(user), 200


@users_bp.route('/users/<user_id>', methods=['GET'])
def get_user(user_id):
    user = user_service.get_user(user_id)
    return public_schema.dump(user), 200
