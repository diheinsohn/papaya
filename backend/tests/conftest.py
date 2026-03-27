import pytest
from app import create_app
from extensions import db as _db


@pytest.fixture(scope='session')
def app():
    app = create_app('testing')
    return app


@pytest.fixture(scope='function')
def client(app, db):
    return app.test_client()


@pytest.fixture(scope='function')
def db(app):
    with app.app_context():
        _db.create_all()
        yield _db
        _db.session.rollback()
        _db.drop_all()


@pytest.fixture()
def registered_user(client):
    """Register a user and return (response_data, password)."""
    import json
    password = 'testpass123'
    response = client.post(
        '/api/auth/register',
        data=json.dumps({
            'email': 'test@example.com',
            'password': password,
            'username': 'testuser',
        }),
        content_type='application/json',
    )
    data = response.get_json()
    return data, password


@pytest.fixture()
def auth_header(registered_user):
    """Return Authorization header dict for the registered user."""
    data, _ = registered_user
    return {'Authorization': f'Bearer {data["access_token"]}'}
