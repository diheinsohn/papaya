import os
from flask import Flask
from config import config_by_name
from extensions import db, migrate, jwt, socketio, ma, cors


def create_app(config_name=None):
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')

    app = Flask(__name__)
    app.config.from_object(config_by_name[config_name])

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    ma.init_app(app)
    cors.init_app(app)
    socketio.init_app(app, cors_allowed_origins="*", async_mode='eventlet')

    # Register blueprints
    from api import register_blueprints
    register_blueprints(app)

    # Register error handlers
    register_error_handlers(app)

    return app


def register_error_handlers(app):
    @app.errorhandler(404)
    def not_found(error):
        return {'error': 'not_found', 'message': 'Resource not found'}, 404

    @app.errorhandler(405)
    def method_not_allowed(error):
        return {'error': 'method_not_allowed', 'message': 'Method not allowed'}, 405

    @app.errorhandler(500)
    def internal_error(error):
        return {'error': 'internal_error', 'message': 'An internal error occurred'}, 500
