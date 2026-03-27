import json


def _post(client, url, data=None, **kwargs):
    return client.post(
        url,
        data=json.dumps(data) if data else None,
        content_type='application/json',
        **kwargs,
    )


def _get(client, url, headers=None):
    return client.get(url, headers=headers)


def _patch(client, url, data, headers=None):
    return client.patch(
        url,
        data=json.dumps(data),
        content_type='application/json',
        headers=headers,
    )


# ── Register ──────────────────────────────────────────────────────


class TestRegister:

    def test_register_success(self, client, db):
        resp = _post(client, '/api/auth/register', {
            'email': 'new@example.com',
            'password': 'securepass1',
            'username': 'newuser',
        })
        assert resp.status_code == 201
        data = resp.get_json()
        assert 'access_token' in data
        assert data['user']['email'] == 'new@example.com'
        assert data['user']['username'] == 'newuser'

    def test_register_duplicate_email(self, client, db):
        _post(client, '/api/auth/register', {
            'email': 'dup@example.com', 'password': 'securepass1', 'username': 'user1',
        })
        resp = _post(client, '/api/auth/register', {
            'email': 'dup@example.com', 'password': 'securepass1', 'username': 'user2',
        })
        assert resp.status_code == 409

    def test_register_duplicate_username(self, client, db):
        _post(client, '/api/auth/register', {
            'email': 'a@example.com', 'password': 'securepass1', 'username': 'sameuser',
        })
        resp = _post(client, '/api/auth/register', {
            'email': 'b@example.com', 'password': 'securepass1', 'username': 'sameuser',
        })
        assert resp.status_code == 409

    def test_register_weak_password(self, client, db):
        resp = _post(client, '/api/auth/register', {
            'email': 'wp@example.com', 'password': 'short', 'username': 'wpuser',
        })
        assert resp.status_code == 400

    def test_register_invalid_email(self, client, db):
        resp = _post(client, '/api/auth/register', {
            'email': 'not-an-email', 'password': 'securepass1', 'username': 'badmail',
        })
        assert resp.status_code == 400

    def test_register_missing_fields(self, client, db):
        resp = _post(client, '/api/auth/register', {'email': 'only@example.com'})
        assert resp.status_code == 400


# ── Login ─────────────────────────────────────────────────────────


class TestLogin:

    def test_login_success(self, client, db, registered_user):
        _, password = registered_user
        resp = _post(client, '/api/auth/login', {
            'email': 'test@example.com', 'password': password,
        })
        assert resp.status_code == 200
        data = resp.get_json()
        assert 'access_token' in data
        assert data['user']['email'] == 'test@example.com'

    def test_login_wrong_password(self, client, db, registered_user):
        resp = _post(client, '/api/auth/login', {
            'email': 'test@example.com', 'password': 'wrongpassword',
        })
        assert resp.status_code == 401

    def test_login_nonexistent_email(self, client, db):
        resp = _post(client, '/api/auth/login', {
            'email': 'nobody@example.com', 'password': 'whatever123',
        })
        assert resp.status_code == 401


# ── Refresh ───────────────────────────────────────────────────────


class TestRefresh:

    def test_refresh_without_token(self, client, db):
        resp = _post(client, '/api/auth/refresh')
        assert resp.status_code == 401

    def test_refresh_with_valid_token(self, client, db, registered_user):
        """Register sets a refresh cookie; use it to get a new access token."""
        # The register endpoint sets refresh_token_cookie via set_refresh_cookies.
        # Flask test client stores cookies automatically.
        resp = _post(client, '/api/auth/refresh')
        assert resp.status_code == 200
        data = resp.get_json()
        assert 'access_token' in data


# ── Logout ────────────────────────────────────────────────────────


class TestLogout:

    def test_logout_success(self, client, db):
        resp = _post(client, '/api/auth/logout')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['message'] == 'Logged out successfully'


# ── Protected endpoint: GET /users/me ─────────────────────────────


class TestGetMe:

    def test_get_me_success(self, client, db, auth_header):
        resp = _get(client, '/api/users/me', headers=auth_header)
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['email'] == 'test@example.com'
        assert data['username'] == 'testuser'

    def test_get_me_no_token(self, client, db):
        resp = _get(client, '/api/users/me')
        assert resp.status_code == 401


# ── Update profile: PATCH /users/me ──────────────────────────────


class TestUpdateMe:

    def test_update_profile_success(self, client, db, auth_header):
        resp = _patch(client, '/api/users/me', {
            'display_name': 'Updated Name',
            'bio': 'Hello world',
        }, headers=auth_header)
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['display_name'] == 'Updated Name'
        assert data['bio'] == 'Hello world'

    def test_update_profile_invalid_data(self, client, db, auth_header):
        resp = _patch(client, '/api/users/me', {
            'display_name': 'x' * 200,  # exceeds max 100
        }, headers=auth_header)
        assert resp.status_code == 400


# ── Public profile: GET /users/:id ───────────────────────────────


class TestPublicProfile:

    def test_get_public_profile_success(self, client, db, registered_user):
        data, _ = registered_user
        user_id = data['user']['id']
        resp = _get(client, f'/api/users/{user_id}')
        assert resp.status_code == 200
        profile = resp.get_json()
        assert profile['username'] == 'testuser'
        # Public schema should NOT expose email
        assert 'email' not in profile or profile.get('email') is None

    def test_get_public_profile_not_found(self, client, db):
        resp = _get(client, '/api/users/nonexistent-id-12345')
        assert resp.status_code == 404
