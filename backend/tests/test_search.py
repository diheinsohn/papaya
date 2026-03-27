import json
import uuid

import pytest


# SQLite doesn't support PostgreSQL full-text search (to_tsvector/@@).
# Tests that use ?q= are marked xfail when running against SQLite.
sqlite_fts_xfail = pytest.mark.xfail(
    reason='Full-text search requires PostgreSQL (not available in SQLite test DB)',
    raises=Exception,
)


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


def _delete(client, url, headers=None):
    return client.delete(url, headers=headers)


def _register(client, email='search@example.com', username='searchuser', password='testpass123'):
    resp = client.post(
        '/api/auth/register',
        data=json.dumps({'email': email, 'password': password, 'username': username}),
        content_type='application/json',
    )
    return resp.get_json()


def _auth(data):
    return {'Authorization': f'Bearer {data["access_token"]}'}


def _seed_category(db, name='Electronica', slug='electronica'):
    from models.category import Category
    cat = Category(name=name, slug=slug, icon='laptop', sort_order=1)
    db.session.add(cat)
    db.session.commit()
    return cat


def _seed_category_with_child(db):
    from models.category import Category
    parent = Category(name='Electronica', slug='electronica', icon='laptop', sort_order=1)
    db.session.add(parent)
    db.session.flush()
    child = Category(name='Celulares', slug='celulares', icon='phone', parent_id=parent.id, sort_order=2)
    db.session.add(child)
    db.session.commit()
    return parent, child


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


def _seed_listings(client, db):
    """Create a set of diverse listings for search testing."""
    cat_elec = _seed_category(db, 'Electronica', 'electronica')
    cat_hogar = _seed_category(db, 'Hogar', 'hogar')

    user_data = _register(client)
    header = _auth(user_data)

    _create_listing(client, header, cat_elec.id,
                    title='iPhone 14 Pro Max', description='Nuevo sellado',
                    price='850000', condition='new')
    _create_listing(client, header, cat_elec.id,
                    title='Samsung Galaxy S23', description='Poco uso',
                    price='650000', condition='like_new')
    _create_listing(client, header, cat_elec.id,
                    title='MacBook Air M2', description='Para trabajo',
                    price='1200000', condition='good')
    _create_listing(client, header, cat_hogar.id,
                    title='Mesa de comedor', description='Madera roble',
                    price='150000', condition='good')
    _create_listing(client, header, cat_hogar.id,
                    title='Sofa usado', description='Buen estado general',
                    price='80000', condition='fair')

    return user_data, header, cat_elec, cat_hogar


# ── Text Search ───────────────────────────────────────────────────


class TestSearch:

    @sqlite_fts_xfail
    def test_search_with_query_returns_matches(self, client, db):
        _seed_listings(client, db)
        resp = _get(client, '/api/search?q=iphone')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['total'] >= 1
        titles = [item['title'] for item in data['items']]
        assert any('iPhone' in t for t in titles)

    def test_search_no_params_returns_all_active(self, client, db):
        _seed_listings(client, db)
        resp = _get(client, '/api/search')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['total'] == 5

    @sqlite_fts_xfail
    def test_search_no_results(self, client, db):
        _seed_listings(client, db)
        resp = _get(client, '/api/search?q=xyznotexisting')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['total'] == 0
        assert data['items'] == []

    def test_search_response_structure(self, client, db):
        _seed_listings(client, db)
        resp = _get(client, '/api/search')
        data = resp.get_json()
        assert 'items' in data
        assert 'total' in data
        assert 'page' in data
        assert 'per_page' in data
        assert 'pages' in data


# ── Category Filter ───────────────────────────────────────────────


class TestSearchCategoryFilter:

    def test_filter_by_category(self, client, db):
        _seed_listings(client, db)
        resp = _get(client, '/api/search?category=electronica')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['total'] == 3

    def test_filter_by_category_hogar(self, client, db):
        _seed_listings(client, db)
        resp = _get(client, '/api/search?category=hogar')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['total'] == 2

    def test_filter_by_nonexistent_category(self, client, db):
        _seed_listings(client, db)
        resp = _get(client, '/api/search?category=nope')
        assert resp.status_code == 200
        data = resp.get_json()
        # Non-existent category returns all active (no filter applied)
        assert data['total'] == 5


# ── Price Filter ──────────────────────────────────────────────────


class TestSearchPriceFilter:

    def test_filter_min_price(self, client, db):
        _seed_listings(client, db)
        resp = _get(client, '/api/search?min_price=800000')
        assert resp.status_code == 200
        data = resp.get_json()
        # iPhone 14 Pro Max (850000) and MacBook Air M2 (1200000)
        assert data['total'] == 2

    def test_filter_max_price(self, client, db):
        _seed_listings(client, db)
        resp = _get(client, '/api/search?max_price=100000')
        assert resp.status_code == 200
        data = resp.get_json()
        # Sofa usado (80000)
        assert data['total'] == 1

    def test_filter_price_range(self, client, db):
        _seed_listings(client, db)
        resp = _get(client, '/api/search?min_price=100000&max_price=700000')
        assert resp.status_code == 200
        data = resp.get_json()
        # Mesa (150000), Samsung (650000)
        assert data['total'] == 2


# ── Condition Filter ──────────────────────────────────────────────


class TestSearchConditionFilter:

    def test_filter_single_condition(self, client, db):
        _seed_listings(client, db)
        resp = _get(client, '/api/search?condition=new')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['total'] == 1

    def test_filter_multiple_conditions(self, client, db):
        _seed_listings(client, db)
        resp = _get(client, '/api/search?condition=new,like_new')
        assert resp.status_code == 200
        data = resp.get_json()
        # iPhone 14 Pro Max (new) + Samsung (like_new)
        assert data['total'] == 2

    def test_filter_condition_fair(self, client, db):
        _seed_listings(client, db)
        resp = _get(client, '/api/search?condition=fair')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['total'] == 1


# ── Sort Options ──────────────────────────────────────────────────


class TestSearchSort:

    def test_sort_price_asc(self, client, db):
        _seed_listings(client, db)
        resp = _get(client, '/api/search?sort_by=price_asc')
        assert resp.status_code == 200
        data = resp.get_json()
        prices = [float(item['price']) for item in data['items']]
        assert prices == sorted(prices)

    def test_sort_price_desc(self, client, db):
        _seed_listings(client, db)
        resp = _get(client, '/api/search?sort_by=price_desc')
        assert resp.status_code == 200
        data = resp.get_json()
        prices = [float(item['price']) for item in data['items']]
        assert prices == sorted(prices, reverse=True)

    def test_sort_newest(self, client, db):
        _seed_listings(client, db)
        resp = _get(client, '/api/search?sort_by=newest')
        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data['items']) == 5


# ── Suggestions ───────────────────────────────────────────────────


class TestSuggestions:

    def test_suggestions_returns_matches(self, client, db):
        _seed_listings(client, db)
        resp = _get(client, '/api/search/suggestions?q=iP')
        assert resp.status_code == 200
        data = resp.get_json()
        assert 'suggestions' in data
        assert any('iPhone' in s for s in data['suggestions'])

    def test_suggestions_short_query(self, client, db):
        _seed_listings(client, db)
        resp = _get(client, '/api/search/suggestions?q=i')
        assert resp.status_code == 200
        data = resp.get_json()
        # Prefix < 2 chars returns empty
        assert data['suggestions'] == []

    def test_suggestions_empty_query(self, client, db):
        resp = _get(client, '/api/search/suggestions')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['suggestions'] == []

    def test_suggestions_no_match(self, client, db):
        _seed_listings(client, db)
        resp = _get(client, '/api/search/suggestions?q=zzzzz')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['suggestions'] == []


# ── Feed ──────────────────────────────────────────────────────────


class TestFeed:

    def test_feed_returns_listings(self, client, db):
        _seed_listings(client, db)
        resp = _get(client, '/api/feed')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['total'] == 5
        assert 'items' in data

    def test_feed_empty(self, client, db):
        resp = _get(client, '/api/feed')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['total'] == 0

    def test_feed_pagination(self, client, db):
        _seed_listings(client, db)
        resp = _get(client, '/api/feed?per_page=2&page=1')
        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data['items']) == 2
        assert data['total'] == 5
        assert data['pages'] == 3


# ── Saved Search CRUD ─────────────────────────────────────────────


class TestSavedSearch:

    def test_save_search_authenticated(self, client, db):
        user_data = _register(client)
        header = _auth(user_data)
        resp = _post(client, '/api/search/saved', {
            'query': 'iphone',
            'filters': {'category': 'electronica'},
        }, headers=header)
        assert resp.status_code == 201
        data = resp.get_json()
        assert 'id' in data
        assert data['message'] == 'Search saved'

    def test_save_search_unauthenticated(self, client, db):
        resp = _post(client, '/api/search/saved', {
            'query': 'iphone',
        })
        assert resp.status_code == 401

    def test_save_search_no_body(self, client, db):
        user_data = _register(client)
        header = _auth(user_data)
        resp = client.post('/api/search/saved', headers=header)
        assert resp.status_code == 400

    def test_list_saved_searches(self, client, db):
        user_data = _register(client)
        header = _auth(user_data)
        # Create two saved searches
        _post(client, '/api/search/saved', {'query': 'iphone'}, headers=header)
        _post(client, '/api/search/saved', {'query': 'macbook'}, headers=header)

        resp = _get(client, '/api/search/saved', headers=header)
        assert resp.status_code == 200
        data = resp.get_json()
        assert 'searches' in data
        assert len(data['searches']) == 2

    def test_list_saved_searches_unauthenticated(self, client, db):
        resp = _get(client, '/api/search/saved')
        assert resp.status_code == 401

    def test_delete_saved_search_owner(self, client, db):
        user_data = _register(client)
        header = _auth(user_data)
        create_resp = _post(client, '/api/search/saved', {'query': 'iphone'}, headers=header)
        search_id = create_resp.get_json()['id']

        resp = _delete(client, f'/api/search/saved/{search_id}', headers=header)
        assert resp.status_code == 200
        assert resp.get_json()['message'] == 'Saved search deleted'

        # Verify it's gone
        list_resp = _get(client, '/api/search/saved', headers=header)
        assert len(list_resp.get_json()['searches']) == 0

    def test_delete_saved_search_non_owner(self, client, db):
        owner_data = _register(client, email='owner@test.com', username='owner')
        owner_header = _auth(owner_data)
        create_resp = _post(client, '/api/search/saved', {'query': 'iphone'}, headers=owner_header)
        search_id = create_resp.get_json()['id']

        other_data = _register(client, email='other@test.com', username='other')
        other_header = _auth(other_data)

        resp = _delete(client, f'/api/search/saved/{search_id}', headers=other_header)
        assert resp.status_code == 404

    def test_delete_saved_search_not_found(self, client, db):
        user_data = _register(client)
        header = _auth(user_data)
        fake_id = str(uuid.uuid4())
        resp = _delete(client, f'/api/search/saved/{fake_id}', headers=header)
        assert resp.status_code == 404

    def test_delete_saved_search_unauthenticated(self, client, db):
        resp = _delete(client, f'/api/search/saved/{str(uuid.uuid4())}')
        assert resp.status_code == 401


# ── Combined Filters ──────────────────────────────────────────────


class TestSearchCombinedFilters:

    def test_category_and_price(self, client, db):
        _seed_listings(client, db)
        resp = _get(client, '/api/search?category=electronica&max_price=700000')
        assert resp.status_code == 200
        data = resp.get_json()
        # Samsung (650000) only — iPhone is 850000, MacBook is 1200000
        assert data['total'] == 1

    @sqlite_fts_xfail
    def test_query_and_condition(self, client, db):
        _seed_listings(client, db)
        resp = _get(client, '/api/search?q=iphone&condition=new')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['total'] == 1

    def test_pagination(self, client, db):
        _seed_listings(client, db)
        resp = _get(client, '/api/search?per_page=2&page=1')
        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data['items']) == 2
        assert data['page'] == 1
        assert data['total'] == 5
