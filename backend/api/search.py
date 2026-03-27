from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from services import search_service
from services.listing_service import is_favorited
from schemas.listing_schema import ListingListSchema
from models.saved_search import SavedSearch
from extensions import db

search_bp = Blueprint('search', __name__)
list_schema = ListingListSchema(many=True)


def _get_current_user_id():
    try:
        from flask_jwt_extended import verify_jwt_in_request
        verify_jwt_in_request(optional=True)
        return get_jwt_identity()
    except Exception:
        return None


@search_bp.route('/search', methods=['GET'])
def search():
    query_text = request.args.get('q')
    category = request.args.get('category')
    min_price = request.args.get('min_price', type=float)
    max_price = request.args.get('max_price', type=float)
    conditions = request.args.get('condition')
    lat = request.args.get('lat', type=float)
    lng = request.args.get('lng', type=float)
    radius_km = request.args.get('radius_km', type=float)
    sort_by = request.args.get('sort_by', 'relevance')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 24, type=int)

    result = search_service.search_listings(
        query_text=query_text,
        category_slug=category,
        min_price=min_price,
        max_price=max_price,
        conditions=conditions,
        lat=lat, lng=lng, radius_km=radius_km,
        sort_by=sort_by,
        page=page, per_page=per_page,
    )

    user_id = _get_current_user_id()
    for item in result['items']:
        item.is_favorited = is_favorited(user_id, item.id) if user_id else False

    result['items'] = list_schema.dump(result['items'])
    return result, 200


@search_bp.route('/search/suggestions', methods=['GET'])
def suggestions():
    q = request.args.get('q', '')
    results = search_service.get_suggestions(q)
    return {'suggestions': results}, 200


@search_bp.route('/search/saved', methods=['POST'])
@jwt_required()
def save_search():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True)
    if not data:
        return {'error': 'ValidationError', 'message': 'Request body is required'}, 400

    saved = SavedSearch(
        user_id=user_id,
        query=data.get('query', ''),
        filters=data.get('filters', {}),
        notify=data.get('notify', True),
    )
    db.session.add(saved)
    db.session.commit()
    return {'id': saved.id, 'message': 'Search saved'}, 201


@search_bp.route('/search/saved', methods=['GET'])
@jwt_required()
def get_saved_searches():
    user_id = get_jwt_identity()
    searches = db.session.query(SavedSearch).filter_by(user_id=user_id).order_by(SavedSearch.created_at.desc()).all()
    return {'searches': [
        {'id': s.id, 'query': s.query, 'filters': s.filters, 'notify': s.notify, 'created_at': s.created_at.isoformat()}
        for s in searches
    ]}, 200


@search_bp.route('/search/saved/<search_id>', methods=['DELETE'])
@jwt_required()
def delete_saved_search(search_id):
    user_id = get_jwt_identity()
    saved = db.session.get(SavedSearch, search_id)
    if not saved or saved.user_id != user_id:
        return {'error': 'NotFoundError', 'message': 'Saved search not found'}, 404
    db.session.delete(saved)
    db.session.commit()
    return {'message': 'Saved search deleted'}, 200


@search_bp.route('/feed', methods=['GET'])
def feed():
    lat = request.args.get('lat', type=float)
    lng = request.args.get('lng', type=float)
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 24, type=int)

    result = search_service.get_feed(lat=lat, lng=lng, page=page, per_page=per_page)

    user_id = _get_current_user_id()
    for item in result['items']:
        item.is_favorited = is_favorited(user_id, item.id) if user_id else False

    result['items'] = list_schema.dump(result['items'])
    return result, 200
