import json
import uuid


def _post(client, url, data=None, headers=None, **kwargs):
    return client.post(
        url,
        data=json.dumps(data) if data else None,
        content_type='application/json',
        headers=headers,
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


def _delete(client, url, headers=None):
    return client.delete(url, headers=headers)


def _register(client, email='test@example.com', username='testuser', password='testpass123'):
    resp = client.post(
        '/api/auth/register',
        data=json.dumps({'email': email, 'password': password, 'username': username}),
        content_type='application/json',
    )
    return resp.get_json()


def _auth(data):
    return {'Authorization': f'Bearer {data["access_token"]}'}


def _seed_category(db):
    from models.category import Category
    cat = Category(name='Electrónica', slug='electronica', icon='laptop', sort_order=1)
    db.session.add(cat)
    db.session.commit()
    return cat


def _create_listing(client, auth_header, category_id, **overrides):
    payload = {
        'title': 'iPhone 14 Pro',
        'description': 'En excelente estado',
        'price': '450000',
        'condition': 'like_new',
        'category_id': category_id,
    }
    payload.update(overrides)
    resp = _post(client, '/api/listings', payload, headers=auth_header)
    return resp


# ── Categories ─────────────────────────────────────────────────────


class TestCategories:

    def test_get_categories_returns_200(self, client, db):
        _seed_category(db)
        resp = _get(client, '/api/categories')
        assert resp.status_code == 200
        data = resp.get_json()
        assert 'categories' in data
        assert len(data['categories']) >= 1

    def test_get_categories_structure(self, client, db):
        _seed_category(db)
        resp = _get(client, '/api/categories')
        cat = resp.get_json()['categories'][0]
        assert 'id' in cat
        assert 'name' in cat
        assert 'slug' in cat
        assert 'children' in cat


# ── Create Listing ─────────────────────────────────────────────────


class TestCreateListing:

    def test_create_listing_success(self, client, db):
        cat = _seed_category(db)
        user_data = _register(client)
        header = _auth(user_data)
        resp = _create_listing(client, header, cat.id)
        assert resp.status_code == 201
        data = resp.get_json()
        assert data['title'] == 'iPhone 14 Pro'
        assert data['condition'] == 'like_new'
        assert data['status'] == 'active'
        assert 'id' in data

    def test_create_listing_unauthenticated(self, client, db):
        cat = _seed_category(db)
        resp = _post(client, '/api/listings', {
            'title': 'Test', 'description': 'Desc',
            'price': '1000', 'condition': 'new', 'category_id': cat.id,
        })
        assert resp.status_code == 401

    def test_create_listing_missing_required_fields(self, client, db):
        _seed_category(db)
        user_data = _register(client)
        header = _auth(user_data)
        # Missing title, price, condition, category_id
        resp = _post(client, '/api/listings', {'description': 'only desc'}, headers=header)
        assert resp.status_code == 400

    def test_create_listing_invalid_condition(self, client, db):
        cat = _seed_category(db)
        user_data = _register(client)
        header = _auth(user_data)
        resp = _create_listing(client, header, cat.id, condition='broken')
        assert resp.status_code == 400


# ── Get Listings ───────────────────────────────────────────────────


class TestGetListings:

    def test_get_listings_paginated(self, client, db):
        cat = _seed_category(db)
        user_data = _register(client)
        header = _auth(user_data)
        # Create a couple of listings
        _create_listing(client, header, cat.id, title='Item 1')
        _create_listing(client, header, cat.id, title='Item 2')

        resp = _get(client, '/api/listings')
        assert resp.status_code == 200
        data = resp.get_json()
        assert 'items' in data
        assert 'total' in data
        assert 'page' in data
        assert 'per_page' in data
        assert 'pages' in data
        assert data['total'] >= 2

    def test_get_listings_empty(self, client, db):
        resp = _get(client, '/api/listings')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['total'] == 0
        assert data['items'] == []


# ── Get Single Listing ─────────────────────────────────────────────


class TestGetListing:

    def test_get_listing_success(self, client, db):
        cat = _seed_category(db)
        user_data = _register(client)
        header = _auth(user_data)
        create_resp = _create_listing(client, header, cat.id)
        listing_id = create_resp.get_json()['id']

        resp = _get(client, f'/api/listings/{listing_id}')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['id'] == listing_id
        assert data['title'] == 'iPhone 14 Pro'

    def test_get_listing_increments_view_count(self, client, db):
        cat = _seed_category(db)
        user_data = _register(client)
        header = _auth(user_data)
        create_resp = _create_listing(client, header, cat.id)
        listing_id = create_resp.get_json()['id']

        # First view
        resp1 = _get(client, f'/api/listings/{listing_id}')
        count1 = resp1.get_json()['view_count']

        # Second view
        resp2 = _get(client, f'/api/listings/{listing_id}')
        count2 = resp2.get_json()['view_count']

        assert count2 == count1 + 1

    def test_get_listing_not_found(self, client, db):
        fake_id = str(uuid.uuid4())
        resp = _get(client, f'/api/listings/{fake_id}')
        assert resp.status_code == 404


# ── Update Listing ─────────────────────────────────────────────────


class TestUpdateListing:

    def test_update_listing_owner(self, client, db):
        cat = _seed_category(db)
        user_data = _register(client)
        header = _auth(user_data)
        create_resp = _create_listing(client, header, cat.id)
        listing_id = create_resp.get_json()['id']

        resp = _patch(client, f'/api/listings/{listing_id}', {
            'title': 'Updated Title',
            'price': '500000',
        }, headers=header)
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['title'] == 'Updated Title'

    def test_update_listing_non_owner(self, client, db):
        cat = _seed_category(db)
        owner_data = _register(client, email='owner@test.com', username='owner')
        owner_header = _auth(owner_data)
        create_resp = _create_listing(client, owner_header, cat.id)
        listing_id = create_resp.get_json()['id']

        other_data = _register(client, email='other@test.com', username='other')
        other_header = _auth(other_data)

        resp = _patch(client, f'/api/listings/{listing_id}', {
            'title': 'Hacked Title',
        }, headers=other_header)
        assert resp.status_code == 403

    def test_update_listing_not_found(self, client, db):
        user_data = _register(client)
        header = _auth(user_data)
        fake_id = str(uuid.uuid4())
        resp = _patch(client, f'/api/listings/{fake_id}', {
            'title': 'Nope',
        }, headers=header)
        assert resp.status_code == 404


# ── Delete Listing ─────────────────────────────────────────────────


class TestDeleteListing:

    def test_delete_listing_owner_soft_delete(self, client, db):
        cat = _seed_category(db)
        user_data = _register(client)
        header = _auth(user_data)
        create_resp = _create_listing(client, header, cat.id)
        listing_id = create_resp.get_json()['id']

        resp = _delete(client, f'/api/listings/{listing_id}', headers=header)
        assert resp.status_code == 200

        # Listing should be 404 after soft-delete
        get_resp = _get(client, f'/api/listings/{listing_id}')
        assert get_resp.status_code == 404

    def test_delete_listing_non_owner(self, client, db):
        cat = _seed_category(db)
        owner_data = _register(client, email='owner2@test.com', username='owner2')
        owner_header = _auth(owner_data)
        create_resp = _create_listing(client, owner_header, cat.id)
        listing_id = create_resp.get_json()['id']

        other_data = _register(client, email='other2@test.com', username='other2')
        other_header = _auth(other_data)

        resp = _delete(client, f'/api/listings/{listing_id}', headers=other_header)
        assert resp.status_code == 403

    def test_delete_listing_unauthenticated(self, client, db):
        cat = _seed_category(db)
        user_data = _register(client)
        header = _auth(user_data)
        create_resp = _create_listing(client, header, cat.id)
        listing_id = create_resp.get_json()['id']

        resp = _delete(client, f'/api/listings/{listing_id}')
        assert resp.status_code == 401


# ── Favorite Toggle ────────────────────────────────────────────────


class TestFavorite:

    def test_toggle_favorite(self, client, db):
        cat = _seed_category(db)
        user_data = _register(client)
        header = _auth(user_data)
        create_resp = _create_listing(client, header, cat.id)
        listing_id = create_resp.get_json()['id']

        # First toggle — favorite
        resp1 = _post(client, f'/api/listings/{listing_id}/favorite', headers=header)
        assert resp1.status_code == 200
        assert resp1.get_json()['is_favorited'] is True

        # Second toggle — unfavorite
        resp2 = _post(client, f'/api/listings/{listing_id}/favorite', headers=header)
        assert resp2.status_code == 200
        assert resp2.get_json()['is_favorited'] is False

    def test_favorite_unauthenticated(self, client, db):
        cat = _seed_category(db)
        user_data = _register(client)
        header = _auth(user_data)
        create_resp = _create_listing(client, header, cat.id)
        listing_id = create_resp.get_json()['id']

        resp = _post(client, f'/api/listings/{listing_id}/favorite')
        assert resp.status_code == 401

    def test_favorite_not_found(self, client, db):
        user_data = _register(client)
        header = _auth(user_data)
        fake_id = str(uuid.uuid4())
        resp = _post(client, f'/api/listings/{fake_id}/favorite', headers=header)
        assert resp.status_code == 404


# ── My Listings ────────────────────────────────────────────────────


class TestMyListings:

    def test_get_my_listings(self, client, db):
        cat = _seed_category(db)
        user_data = _register(client)
        header = _auth(user_data)
        _create_listing(client, header, cat.id, title='My Item 1')
        _create_listing(client, header, cat.id, title='My Item 2')

        resp = _get(client, '/api/users/me/listings', headers=header)
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['total'] == 2

    def test_get_my_listings_unauthenticated(self, client, db):
        resp = _get(client, '/api/users/me/listings')
        assert resp.status_code == 401

    def test_get_my_listings_includes_deleted(self, client, db):
        """My listings should include all statuses (including deleted) for the owner."""
        cat = _seed_category(db)
        user_data = _register(client)
        header = _auth(user_data)
        create_resp = _create_listing(client, header, cat.id)
        listing_id = create_resp.get_json()['id']

        # Delete the listing
        _delete(client, f'/api/listings/{listing_id}', headers=header)

        resp = _get(client, '/api/users/me/listings', headers=header)
        data = resp.get_json()
        # include_all=True means deleted listings should still appear
        assert data['total'] == 1
