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
    resp = _post(client, '/api/listings', payload, headers=auth_header)
    return resp


def _setup_two_users_and_listing(client, db):
    """Create two users and a listing owned by user1 (seller). Returns (user1_header, user2_header, listing_id)."""
    cat = _seed_category(db)
    user1 = _register(client, email='seller@test.com', username='seller')
    user1_header = _auth(user1)
    user2 = _register(client, email='buyer@test.com', username='buyer')
    user2_header = _auth(user2)

    listing_resp = _create_listing(client, user1_header, cat.id)
    listing_id = listing_resp.get_json()['id']

    return user1_header, user2_header, listing_id


# ── Create Conversation ───────────────────────────────────────────


class TestCreateConversation:

    def test_create_conversation_success(self, client, db):
        user1_header, user2_header, listing_id = _setup_two_users_and_listing(client, db)
        # buyer (user2) creates conversation about seller's listing
        resp = _post(client, '/api/chat/conversations', {
            'listing_id': listing_id,
            'message': 'Hola, sigue disponible?',
        }, headers=user2_header)
        assert resp.status_code == 201
        data = resp.get_json()
        assert 'id' in data
        assert data['listing']['id'] == listing_id
        assert data['last_message'] is not None
        assert data['last_message']['content'] == 'Hola, sigue disponible?'

    def test_create_conversation_returns_existing(self, client, db):
        user1_header, user2_header, listing_id = _setup_two_users_and_listing(client, db)
        # First creation
        resp1 = _post(client, '/api/chat/conversations', {
            'listing_id': listing_id,
        }, headers=user2_header)
        assert resp1.status_code == 201
        conv_id = resp1.get_json()['id']

        # Second call returns existing (200)
        resp2 = _post(client, '/api/chat/conversations', {
            'listing_id': listing_id,
        }, headers=user2_header)
        assert resp2.status_code == 200
        assert resp2.get_json()['id'] == conv_id

    def test_create_conversation_missing_listing_id(self, client, db):
        user1_header, user2_header, listing_id = _setup_two_users_and_listing(client, db)
        resp = _post(client, '/api/chat/conversations', {}, headers=user2_header)
        assert resp.status_code == 400

    def test_create_conversation_self_conversation_blocked(self, client, db):
        user1_header, user2_header, listing_id = _setup_two_users_and_listing(client, db)
        # seller (user1) tries to create conversation on own listing
        resp = _post(client, '/api/chat/conversations', {
            'listing_id': listing_id,
        }, headers=user1_header)
        assert resp.status_code == 400

    def test_create_conversation_unauthenticated(self, client, db):
        user1_header, user2_header, listing_id = _setup_two_users_and_listing(client, db)
        resp = _post(client, '/api/chat/conversations', {
            'listing_id': listing_id,
        })
        assert resp.status_code == 401

    def test_create_conversation_nonexistent_listing(self, client, db):
        user1 = _register(client, email='u1@test.com', username='userone')
        resp = _post(client, '/api/chat/conversations', {
            'listing_id': str(uuid.uuid4()),
        }, headers=_auth(user1))
        assert resp.status_code == 404


# ── List Conversations ────────────────────────────────────────────


class TestListConversations:

    def test_list_conversations_success(self, client, db):
        user1_header, user2_header, listing_id = _setup_two_users_and_listing(client, db)
        # Create a conversation
        _post(client, '/api/chat/conversations', {
            'listing_id': listing_id,
            'message': 'Hola',
        }, headers=user2_header)

        # Both users should see the conversation
        resp1 = _get(client, '/api/chat/conversations', headers=user1_header)
        assert resp1.status_code == 200
        assert resp1.get_json()['total'] >= 1

        resp2 = _get(client, '/api/chat/conversations', headers=user2_header)
        assert resp2.status_code == 200
        assert resp2.get_json()['total'] >= 1

    def test_list_conversations_unauthenticated(self, client, db):
        resp = _get(client, '/api/chat/conversations')
        assert resp.status_code == 401


# ── Send Message ──────────────────────────────────────────────────


class TestSendMessage:

    def test_send_message_success(self, client, db):
        user1_header, user2_header, listing_id = _setup_two_users_and_listing(client, db)
        conv_resp = _post(client, '/api/chat/conversations', {
            'listing_id': listing_id,
        }, headers=user2_header)
        conv_id = conv_resp.get_json()['id']

        resp = _post(client, f'/api/chat/conversations/{conv_id}/messages', {
            'content': 'Hola, me interesa',
        }, headers=user2_header)
        assert resp.status_code == 201
        data = resp.get_json()
        assert data['content'] == 'Hola, me interesa'
        assert data['message_type'] == 'text'

    def test_send_message_non_participant(self, client, db):
        user1_header, user2_header, listing_id = _setup_two_users_and_listing(client, db)
        conv_resp = _post(client, '/api/chat/conversations', {
            'listing_id': listing_id,
        }, headers=user2_header)
        conv_id = conv_resp.get_json()['id']

        # Third user should be blocked
        user3 = _register(client, email='intruder@test.com', username='intruder')
        user3_header = _auth(user3)
        resp = _post(client, f'/api/chat/conversations/{conv_id}/messages', {
            'content': 'Trying to snoop',
        }, headers=user3_header)
        assert resp.status_code == 403

    def test_send_message_unauthenticated(self, client, db):
        user1_header, user2_header, listing_id = _setup_two_users_and_listing(client, db)
        conv_resp = _post(client, '/api/chat/conversations', {
            'listing_id': listing_id,
        }, headers=user2_header)
        conv_id = conv_resp.get_json()['id']

        resp = _post(client, f'/api/chat/conversations/{conv_id}/messages', {
            'content': 'No auth',
        })
        assert resp.status_code == 401

    def test_send_message_empty_content(self, client, db):
        user1_header, user2_header, listing_id = _setup_two_users_and_listing(client, db)
        conv_resp = _post(client, '/api/chat/conversations', {
            'listing_id': listing_id,
        }, headers=user2_header)
        conv_id = conv_resp.get_json()['id']

        resp = _post(client, f'/api/chat/conversations/{conv_id}/messages', {
            'content': '',
        }, headers=user2_header)
        assert resp.status_code == 400


# ── Send Offer ────────────────────────────────────────────────────


class TestSendOffer:

    def test_send_offer_success(self, client, db):
        user1_header, user2_header, listing_id = _setup_two_users_and_listing(client, db)
        conv_resp = _post(client, '/api/chat/conversations', {
            'listing_id': listing_id,
        }, headers=user2_header)
        conv_id = conv_resp.get_json()['id']

        resp = _post(client, f'/api/chat/conversations/{conv_id}/offer', {
            'amount': 400000,
        }, headers=user2_header)
        assert resp.status_code == 201
        data = resp.get_json()
        assert data['message_type'] == 'offer'
        assert data['offer_status'] == 'pending'
        assert data['offer_amount'] is not None

    def test_send_offer_duplicate_pending_blocked(self, client, db):
        user1_header, user2_header, listing_id = _setup_two_users_and_listing(client, db)
        conv_resp = _post(client, '/api/chat/conversations', {
            'listing_id': listing_id,
        }, headers=user2_header)
        conv_id = conv_resp.get_json()['id']

        # First offer
        resp1 = _post(client, f'/api/chat/conversations/{conv_id}/offer', {
            'amount': 400000,
        }, headers=user2_header)
        assert resp1.status_code == 201

        # Duplicate should fail
        resp2 = _post(client, f'/api/chat/conversations/{conv_id}/offer', {
            'amount': 350000,
        }, headers=user2_header)
        assert resp2.status_code == 400


# ── Respond to Offer ──────────────────────────────────────────────


class TestRespondOffer:

    def _create_conv_with_offer(self, client, db):
        user1_header, user2_header, listing_id = _setup_two_users_and_listing(client, db)
        conv_resp = _post(client, '/api/chat/conversations', {
            'listing_id': listing_id,
        }, headers=user2_header)
        conv_id = conv_resp.get_json()['id']

        offer_resp = _post(client, f'/api/chat/conversations/{conv_id}/offer', {
            'amount': 400000,
        }, headers=user2_header)
        offer_id = offer_resp.get_json()['id']

        return user1_header, user2_header, conv_id, offer_id, listing_id

    def test_accept_offer_reserves_listing(self, client, db):
        user1_header, user2_header, conv_id, offer_id, listing_id = self._create_conv_with_offer(client, db)

        # Seller (user1) accepts buyer's offer
        resp = _patch(client, f'/api/chat/conversations/{conv_id}/offer/{offer_id}', {
            'accept': True,
        }, headers=user1_header)
        assert resp.status_code == 200
        assert resp.get_json()['offer_status'] == 'accepted'

        # Listing should be reserved
        listing_resp = _get(client, f'/api/listings/{listing_id}')
        assert listing_resp.get_json()['status'] == 'reserved'

    def test_reject_offer(self, client, db):
        user1_header, user2_header, conv_id, offer_id, listing_id = self._create_conv_with_offer(client, db)

        resp = _patch(client, f'/api/chat/conversations/{conv_id}/offer/{offer_id}', {
            'accept': False,
        }, headers=user1_header)
        assert resp.status_code == 200
        assert resp.get_json()['offer_status'] == 'rejected'

    def test_cannot_respond_to_own_offer(self, client, db):
        user1_header, user2_header, conv_id, offer_id, listing_id = self._create_conv_with_offer(client, db)

        # Buyer (user2) sent the offer, cannot respond to it
        resp = _patch(client, f'/api/chat/conversations/{conv_id}/offer/{offer_id}', {
            'accept': True,
        }, headers=user2_header)
        assert resp.status_code == 400

    def test_respond_offer_already_responded(self, client, db):
        user1_header, user2_header, conv_id, offer_id, listing_id = self._create_conv_with_offer(client, db)

        # Accept first
        _patch(client, f'/api/chat/conversations/{conv_id}/offer/{offer_id}', {
            'accept': True,
        }, headers=user1_header)

        # Try again
        resp = _patch(client, f'/api/chat/conversations/{conv_id}/offer/{offer_id}', {
            'accept': False,
        }, headers=user1_header)
        assert resp.status_code == 400


# ── Mark Read ─────────────────────────────────────────────────────


class TestMarkRead:

    def test_mark_read_success(self, client, db):
        user1_header, user2_header, listing_id = _setup_two_users_and_listing(client, db)
        conv_resp = _post(client, '/api/chat/conversations', {
            'listing_id': listing_id,
            'message': 'Hola',
        }, headers=user2_header)
        conv_id = conv_resp.get_json()['id']

        # Seller marks as read
        resp = _patch(client, f'/api/chat/conversations/{conv_id}/read', {}, headers=user1_header)
        assert resp.status_code == 200


# ── Unread Count ──────────────────────────────────────────────────


class TestUnreadCount:

    def test_unread_count(self, client, db):
        user1_header, user2_header, listing_id = _setup_two_users_and_listing(client, db)

        # Initially zero for seller
        resp0 = _get(client, '/api/chat/unread-count', headers=user1_header)
        assert resp0.status_code == 200
        assert resp0.get_json()['unread_count'] == 0

        # Buyer sends a message
        conv_resp = _post(client, '/api/chat/conversations', {
            'listing_id': listing_id,
            'message': 'Hola',
        }, headers=user2_header)
        conv_id = conv_resp.get_json()['id']

        # Seller should have 1 unread
        resp1 = _get(client, '/api/chat/unread-count', headers=user1_header)
        assert resp1.get_json()['unread_count'] == 1

        # After marking read, count goes back to 0
        _patch(client, f'/api/chat/conversations/{conv_id}/read', {}, headers=user1_header)
        resp2 = _get(client, '/api/chat/unread-count', headers=user1_header)
        assert resp2.get_json()['unread_count'] == 0

    def test_unread_count_unauthenticated(self, client, db):
        resp = _get(client, '/api/chat/unread-count')
        assert resp.status_code == 401
