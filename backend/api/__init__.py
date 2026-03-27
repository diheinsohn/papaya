def register_blueprints(app):
    from api.health import health_bp
    from api.leads import leads_bp
    from api.auth import auth_bp
    from api.users import users_bp
    from api.categories import categories_bp
    from api.listings import listings_bp
    from api.search import search_bp
    from api.chat import chat_bp

    app.register_blueprint(health_bp, url_prefix='/api')
    app.register_blueprint(leads_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(users_bp, url_prefix='/api')
    app.register_blueprint(categories_bp, url_prefix='/api')
    app.register_blueprint(listings_bp, url_prefix='/api')
    app.register_blueprint(search_bp, url_prefix='/api')
    app.register_blueprint(chat_bp, url_prefix='/api')
