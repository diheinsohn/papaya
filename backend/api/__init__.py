def register_blueprints(app):
    from api.health import health_bp
    app.register_blueprint(health_bp, url_prefix='/api')
