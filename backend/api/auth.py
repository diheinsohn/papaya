from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, set_refresh_cookies, unset_jwt_cookies
from schemas.user_schema import RegisterSchema, LoginSchema, ForgotPasswordSchema, ResetPasswordSchema
from services import auth_service

auth_bp = Blueprint('auth', __name__)

register_schema = RegisterSchema()
login_schema = LoginSchema()
forgot_password_schema = ForgotPasswordSchema()
reset_password_schema = ResetPasswordSchema()


@auth_bp.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json(silent=True)
    if not data:
        return {'error': 'ValidationError', 'message': 'Request body is required'}, 400

    errors = register_schema.validate(data)
    if errors:
        return {'error': 'ValidationError', 'messages': errors}, 400

    validated = register_schema.load(data)
    result = auth_service.register(validated['email'], validated['password'], validated['username'])

    response = jsonify({
        'user': result['user'],
        'access_token': result['access_token'],
    })
    set_refresh_cookies(response, result['refresh_token'])
    return response, 201


@auth_bp.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json(silent=True)
    if not data:
        return {'error': 'ValidationError', 'message': 'Request body is required'}, 400

    errors = login_schema.validate(data)
    if errors:
        return {'error': 'ValidationError', 'messages': errors}, 400

    validated = login_schema.load(data)
    result = auth_service.login(validated['email'], validated['password'])

    response = jsonify({
        'user': result['user'],
        'access_token': result['access_token'],
    })
    set_refresh_cookies(response, result['refresh_token'])
    return response, 200


@auth_bp.route('/auth/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    result = auth_service.refresh(user_id)
    return result, 200


@auth_bp.route('/auth/logout', methods=['POST'])
def logout():
    response = jsonify({'message': 'Logged out successfully'})
    unset_jwt_cookies(response)
    return response, 200


@auth_bp.route('/auth/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json(silent=True)
    if not data:
        return {'error': 'ValidationError', 'message': 'Request body is required'}, 400

    errors = forgot_password_schema.validate(data)
    if errors:
        return {'error': 'ValidationError', 'messages': errors}, 400

    validated = forgot_password_schema.load(data)
    auth_service.generate_reset_token(validated['email'])
    # Always return success to not reveal if email exists
    return {'message': 'If the email exists, a reset link has been sent'}, 200


@auth_bp.route('/auth/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json(silent=True)
    if not data:
        return {'error': 'ValidationError', 'message': 'Request body is required'}, 400

    errors = reset_password_schema.validate(data)
    if errors:
        return {'error': 'ValidationError', 'messages': errors}, 400

    validated = reset_password_schema.load(data)
    auth_service.reset_password(validated['token'], validated['password'])
    return {'message': 'Password reset successfully'}, 200
