import json
import uuid


def _post(client, url, data=None, headers=None):
    return client.post(
        url,
        data=json.dumps(data) if data else None,
        content_type='application/json',
        headers=headers,
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
    return _post(client, '/api/listings', payload, headers=auth_header)


def _setup_review_scenario(client, db):
    """Create two users, a listing, a conversation with accepted offer.

    Returns (seller_header, buyer_header, listing_id, seller_data, buyer_data).
    """
    cat = _seed_category(db)
    seller_data = _register(client, email='seller@test.com', username='seller')
    seller_header = _auth(seller_data)
    buyer_data = _register(client, email='buyer@test.com', username='buyer')
    buyer_header = _auth(buyer_data)

    listing_resp = _create_listing(client, seller_header, cat.id)
    listing_id = listing_resp.get_json()['id']

    # Buyer creates conversation
    conv_resp = _post(client, '/api/chat/conversations', {
        'listing_id': listing_id,
    }, headers=buyer_header)
    conv_id = conv_resp.get_json()['id']

    # Buyer sends offer
    offer_resp = _post(client, f'/api/chat/conversations/{conv_id}/offer', {
        'amount': 400000,
    }, headers=buyer_header)
    offer_id = offer_resp.get_json()['id']

    # Seller accepts offer
    _patch(client, f'/api/chat/conversations/{conv_id}/offer/{offer_id}', {
        'accept': True,
    }, headers=seller_header)

    return seller_header, buyer_header, listing_id, seller_data, buyer_data


# ── POST /api/reviews ────────────────────────────────────────────


class TestCreateReview:

    def test_create_review_success(self, client, db):
        seller_header, buyer_header, listing_id, seller_data, buyer_data = _setup_review_scenario(client, db)

        resp = _post(client, '/api/reviews', {
            'listing_id': listing_id,
            'rating': 5,
            'comment': 'Excelente vendedor!',
        }, headers=buyer_header)
        assert resp.status_code == 201
        data = resp.get_json()
        assert data['rating'] == 5
        assert data['comment'] == 'Excelente vendedor!'
        assert data['role'] == 'buyer'
        assert data['listing_id'] == listing_id
        assert data['reviewee_id'] == seller_data['user']['id']

    def test_create_review_seller_reviews_buyer(self, client, db):
        seller_header, buyer_header, listing_id, seller_data, buyer_data = _setup_review_scenario(client, db)

        resp = _post(client, '/api/reviews', {
            'listing_id': listing_id,
            'rating': 4,
            'comment': 'Buen comprador',
        }, headers=seller_header)
        assert resp.status_code == 201
        data = resp.get_json()
        assert data['role'] == 'seller'
        assert data['reviewee_id'] == buyer_data['user']['id']

    def test_create_review_no_accepted_offer(self, client, db):
        """User without accepted offer cannot review."""
        cat = _seed_category(db)
        seller_data = _register(client, email='s@test.com', username='seller2')
        buyer_data = _register(client, email='b@test.com', username='buyer2')

        listing_resp = _create_listing(client, _auth(seller_data), cat.id)
        listing_id = listing_resp.get_json()['id']

        # No conversation or offer at all
        resp = _post(client, '/api/reviews', {
            'listing_id': listing_id,
            'rating': 4,
        }, headers=_auth(buyer_data))
        assert resp.status_code == 400

    def test_create_review_duplicate(self, client, db):
        seller_header, buyer_header, listing_id, _, _ = _setup_review_scenario(client, db)

        # First review succeeds
        resp1 = _post(client, '/api/reviews', {
            'listing_id': listing_id,
            'rating': 5,
        }, headers=buyer_header)
        assert resp1.status_code == 201

        # Duplicate fails
        resp2 = _post(client, '/api/reviews', {
            'listing_id': listing_id,
            'rating': 3,
        }, headers=buyer_header)
        assert resp2.status_code == 400

    def test_create_review_invalid_rating_zero(self, client, db):
        seller_header, buyer_header, listing_id, _, _ = _setup_review_scenario(client, db)

        resp = _post(client, '/api/reviews', {
            'listing_id': listing_id,
            'rating': 0,
        }, headers=buyer_header)
        assert resp.status_code == 400

    def test_create_review_invalid_rating_six(self, client, db):
        seller_header, buyer_header, listing_id, _, _ = _setup_review_scenario(client, db)

        resp = _post(client, '/api/reviews', {
            'listing_id': listing_id,
            'rating': 6,
        }, headers=buyer_header)
        assert resp.status_code == 400

    def test_create_review_invalid_rating_string(self, client, db):
        seller_header, buyer_header, listing_id, _, _ = _setup_review_scenario(client, db)

        resp = _post(client, '/api/reviews', {
            'listing_id': listing_id,
            'rating': 'five',
        }, headers=buyer_header)
        assert resp.status_code == 400

    def test_create_review_unauthenticated(self, client, db):
        resp = _post(client, '/api/reviews', {
            'listing_id': str(uuid.uuid4()),
            'rating': 5,
        })
        assert resp.status_code == 401

    def test_create_review_missing_fields(self, client, db):
        seller_header, buyer_header, listing_id, _, _ = _setup_review_scenario(client, db)

        # Missing rating
        resp = _post(client, '/api/reviews', {
            'listing_id': listing_id,
        }, headers=buyer_header)
        assert resp.status_code == 400

        # Missing listing_id
        resp = _post(client, '/api/reviews', {
            'rating': 5,
        }, headers=buyer_header)
        assert resp.status_code == 400


# ── GET /api/users/:id/reviews ───────────────────────────────────


class TestGetUserReviews:

    def test_get_user_reviews_success(self, client, db):
        seller_header, buyer_header, listing_id, seller_data, _ = _setup_review_scenario(client, db)

        # Buyer writes review for seller
        _post(client, '/api/reviews', {
            'listing_id': listing_id,
            'rating': 4,
            'comment': 'Buen trato',
        }, headers=buyer_header)

        seller_id = seller_data['user']['id']
        resp = _get(client, f'/api/users/{seller_id}/reviews')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['total'] == 1
        assert data['items'][0]['rating'] == 4
        assert data['items'][0]['comment'] == 'Buen trato'

    def test_get_user_reviews_empty(self, client, db):
        user = _register(client)
        user_id = user['user']['id']
        resp = _get(client, f'/api/users/{user_id}/reviews')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['total'] == 0
        assert data['items'] == []


# ── GET /api/reviews/can-review/:listing_id ──────────────────────


class TestCanReview:

    def test_can_review_eligible(self, client, db):
        seller_header, buyer_header, listing_id, _, _ = _setup_review_scenario(client, db)

        resp = _get(client, f'/api/reviews/can-review/{listing_id}', headers=buyer_header)
        assert resp.status_code == 200
        assert resp.get_json()['can_review'] is True

    def test_can_review_already_reviewed(self, client, db):
        seller_header, buyer_header, listing_id, _, _ = _setup_review_scenario(client, db)

        # Write the review first
        _post(client, '/api/reviews', {
            'listing_id': listing_id,
            'rating': 5,
        }, headers=buyer_header)

        resp = _get(client, f'/api/reviews/can-review/{listing_id}', headers=buyer_header)
        assert resp.status_code == 200
        assert resp.get_json()['can_review'] is False

    def test_can_review_no_accepted_offer(self, client, db):
        cat = _seed_category(db)
        user = _register(client, email='u@test.com', username='userx')
        seller = _register(client, email='s@test.com', username='sellerx')
        listing_resp = _create_listing(client, _auth(seller), cat.id)
        listing_id = listing_resp.get_json()['id']

        resp = _get(client, f'/api/reviews/can-review/{listing_id}', headers=_auth(user))
        assert resp.status_code == 200
        assert resp.get_json()['can_review'] is False


# ── Denormalized Rating ──────────────────────────────────────────


class TestDenormalizedRating:

    def test_rating_updates_after_review(self, client, db):
        seller_header, buyer_header, listing_id, seller_data, _ = _setup_review_scenario(client, db)

        _post(client, '/api/reviews', {
            'listing_id': listing_id,
            'rating': 4,
        }, headers=buyer_header)

        from models.user import User
        seller = User.query.get(seller_data['user']['id'])
        assert seller.avg_rating == 4.0
        assert seller.review_count == 1

    def test_rating_updates_with_multiple_reviews(self, client, db):
        seller_header, buyer_header, listing_id, seller_data, _ = _setup_review_scenario(client, db)

        # Buyer reviews seller: 4 stars
        _post(client, '/api/reviews', {
            'listing_id': listing_id,
            'rating': 4,
        }, headers=buyer_header)

        # Create another buyer and listing to get a second review on the seller
        buyer2_data = _register(client, email='buyer2@test.com', username='buyer2')
        buyer2_header = _auth(buyer2_data)

        from models.category import Category
        cat = Category.query.first()

        # Create a second listing by same seller
        listing2_resp = _create_listing(client, seller_header, cat.id, title='MacBook Pro')
        listing2_id = listing2_resp.get_json()['id']

        # Buyer2 creates conversation, sends offer, seller accepts
        conv_resp = _post(client, '/api/chat/conversations', {
            'listing_id': listing2_id,
        }, headers=buyer2_header)
        conv_id = conv_resp.get_json()['id']

        offer_resp = _post(client, f'/api/chat/conversations/{conv_id}/offer', {
            'amount': 800000,
        }, headers=buyer2_header)
        offer_id = offer_resp.get_json()['id']

        _patch(client, f'/api/chat/conversations/{conv_id}/offer/{offer_id}', {
            'accept': True,
        }, headers=seller_header)

        # Buyer2 reviews seller: 2 stars
        _post(client, '/api/reviews', {
            'listing_id': listing2_id,
            'rating': 2,
        }, headers=buyer2_header)

        from models.user import User
        seller = User.query.get(seller_data['user']['id'])
        assert seller.review_count == 2
        assert seller.avg_rating == 3.0  # (4 + 2) / 2


# ── POST /api/disputes ───────────────────────────────────────────


class TestCreateDispute:

    def test_create_dispute_success(self, client, db):
        seller_header, buyer_header, listing_id, _, _ = _setup_review_scenario(client, db)

        resp = _post(client, '/api/disputes', {
            'listing_id': listing_id,
            'reason': 'not_received',
            'description': 'Nunca recibí el producto',
        }, headers=buyer_header)
        assert resp.status_code == 201
        data = resp.get_json()
        assert data['reason'] == 'not_received'
        assert data['status'] == 'open'

    def test_create_dispute_invalid_reason(self, client, db):
        seller_header, buyer_header, listing_id, _, _ = _setup_review_scenario(client, db)

        resp = _post(client, '/api/disputes', {
            'listing_id': listing_id,
            'reason': 'just_because',
        }, headers=buyer_header)
        assert resp.status_code == 400

    def test_create_dispute_missing_fields(self, client, db):
        seller_header, buyer_header, listing_id, _, _ = _setup_review_scenario(client, db)

        resp = _post(client, '/api/disputes', {
            'listing_id': listing_id,
        }, headers=buyer_header)
        assert resp.status_code == 400

    def test_create_dispute_unauthenticated(self, client, db):
        resp = _post(client, '/api/disputes', {
            'listing_id': str(uuid.uuid4()),
            'reason': 'not_received',
        })
        assert resp.status_code == 401


# ── GET /api/disputes/:id ────────────────────────────────────────


class TestGetDispute:

    def test_get_dispute_success(self, client, db):
        seller_header, buyer_header, listing_id, _, _ = _setup_review_scenario(client, db)

        create_resp = _post(client, '/api/disputes', {
            'listing_id': listing_id,
            'reason': 'damaged',
            'description': 'Producto dañado',
        }, headers=buyer_header)
        dispute_id = create_resp.get_json()['id']

        resp = _get(client, f'/api/disputes/{dispute_id}', headers=buyer_header)
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['reason'] == 'damaged'
        assert data['description'] == 'Producto dañado'

    def test_get_dispute_not_found(self, client, db):
        user = _register(client)
        resp = _get(client, f'/api/disputes/{uuid.uuid4()}', headers=_auth(user))
        assert resp.status_code == 404
