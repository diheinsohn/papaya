import os


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'dev-jwt-secret')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'postgresql://papaya:papaya_dev@localhost:5432/papaya_dev')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_TOKEN_LOCATION = ['headers', 'cookies']
    JWT_COOKIE_SECURE = False  # Set True in production
    JWT_ACCESS_TOKEN_EXPIRES = 900  # 15 minutes
    JWT_REFRESH_TOKEN_EXPIRES = 2592000  # 30 days
    UPLOAD_DIR = os.environ.get('UPLOAD_DIR', 'uploads')
    STORAGE_BACKEND = os.environ.get('STORAGE_BACKEND', 'local')
    REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
    PLATFORM_FEE_PERCENT = int(os.environ.get('PLATFORM_FEE_PERCENT', '10'))


class DevConfig(Config):
    DEBUG = True
    FLASK_ENV = 'development'


class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///test.db'
    JWT_COOKIE_SECURE = False


class ProdConfig(Config):
    DEBUG = False
    JWT_COOKIE_SECURE = True


config_by_name = {
    'development': DevConfig,
    'testing': TestConfig,
    'production': ProdConfig,
}
