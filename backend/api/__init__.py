def register_blueprints(app):
    from api.health import health_bp
    from api.leads import leads_bp
    from api.auth import auth_bp
    from api.users import users_bp

    app.register_blueprint(health_bp, url_prefix='/api')
    app.register_blueprint(leads_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(users_bp, url_prefix='/api')
