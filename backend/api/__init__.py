def register_blueprints(app):
    from api.health import health_bp
    from api.leads import leads_bp

    app.register_blueprint(health_bp, url_prefix='/api')
    app.register_blueprint(leads_bp, url_prefix='/api')
