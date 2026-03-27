from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from services import listing_service, image_service
from schemas.listing_schema import (
    ListingCreateSchema, ListingUpdateSchema, ListingResponseSchema,
    ListingListSchema, ImageReorderSchema,
)
from models.listing import Listing, ListingImage, SavedListing
from extensions import db

listings_bp = Blueprint('listings', __name__)

create_schema = ListingCreateSchema()
update_schema = ListingUpdateSchema()
response_schema = ListingResponseSchema()
list_schema = ListingListSchema(many=True)
reorder_schema = ImageReorderSchema()


def _add_favorite_flag(listing, user_id=None):
    """Add is_favorited flag to listing for serialization."""
    if user_id:
        listing.is_favorited = listing_service.is_favorited(user_id, listing.id)
    else:
        listing.is_favorited = False
    return listing


def _get_current_user_id():
    """Get current user ID from JWT if present, else None."""
    try:
        from flask_jwt_extended import verify_jwt_in_request
        verify_jwt_in_request(optional=True)
        return get_jwt_identity()
    except Exception:
        return None


@listings_bp.route('/listings', methods=['GET'])
def get_listings():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 24, type=int)
    sort = request.args.get('sort', 'newest')
    user_id = _get_current_user_id()

    result = listing_service.get_listings(page, per_page, sort)
    for item in result['items']:
        _add_favorite_flag(item, user_id)
    result['items'] = list_schema.dump(result['items'])
    return result, 200


@listings_bp.route('/listings', methods=['POST'])
@jwt_required()
def create_listing():
    user_id = get_jwt_identity()

    # Handle multipart form data
    if request.content_type and 'multipart' in request.content_type:
        data = request.form.to_dict()
        # Convert numeric fields
        if 'price' in data:
            data['price'] = data['price']
        if 'category_id' in data:
            data['category_id'] = int(data['category_id'])
    else:
        data = request.get_json(silent=True)

    if not data:
        return {'error': 'ValidationError', 'message': 'Request body is required'}, 400

    errors = create_schema.validate(data)
    if errors:
        return {'error': 'ValidationError', 'messages': errors}, 400

    validated = create_schema.load(data)
    listing = listing_service.create_listing(user_id, validated)

    # Handle image uploads
    files = request.files.getlist('images')
    for i, file in enumerate(files[:10]):
        if file.filename:
            image_service.process_and_save_image(file, listing.id, sort_order=i)
    db.session.commit()

    listing = listing_service.get_listing(listing.id, increment_views=False)
    _add_favorite_flag(listing, user_id)
    return response_schema.dump(listing), 201


@listings_bp.route('/listings/<listing_id>', methods=['GET'])
def get_listing(listing_id):
    user_id = _get_current_user_id()
    listing = listing_service.get_listing(listing_id)
    _add_favorite_flag(listing, user_id)
    return response_schema.dump(listing), 200


@listings_bp.route('/listings/<listing_id>', methods=['PATCH'])
@jwt_required()
def update_listing(listing_id):
    user_id = get_jwt_identity()
    data = request.get_json(silent=True)
    if not data:
        return {'error': 'ValidationError', 'message': 'Request body is required'}, 400

    errors = update_schema.validate(data)
    if errors:
        return {'error': 'ValidationError', 'messages': errors}, 400

    validated = update_schema.load(data)
    listing = listing_service.update_listing(listing_id, user_id, validated)
    _add_favorite_flag(listing, user_id)
    return response_schema.dump(listing), 200


@listings_bp.route('/listings/<listing_id>', methods=['DELETE'])
@jwt_required()
def delete_listing(listing_id):
    user_id = get_jwt_identity()
    listing_service.delete_listing(listing_id, user_id)
    return {'message': 'Listing deleted'}, 200


@listings_bp.route('/listings/<listing_id>/images', methods=['POST'])
@jwt_required()
def add_images(listing_id):
    user_id = get_jwt_identity()
    listing = listing_service.get_listing(listing_id, increment_views=False)
    if listing.seller_id != user_id:
        return {'error': 'AuthorizationError', 'message': 'Not your listing'}, 403

    files = request.files.getlist('images')
    if not files:
        return {'error': 'ValidationError', 'message': 'No images provided'}, 400

    current_count = image_service.validate_image_count(listing_id)
    added = []
    for i, file in enumerate(files):
        if current_count + i >= 10:
            break
        if file.filename:
            img = image_service.process_and_save_image(file, listing_id, sort_order=current_count + i)
            added.append(img)
    db.session.commit()

    return {'message': f'{len(added)} images added', 'count': len(added)}, 201


@listings_bp.route('/listings/<listing_id>/images/<image_id>', methods=['DELETE'])
@jwt_required()
def delete_image(listing_id, image_id):
    user_id = get_jwt_identity()
    listing = listing_service.get_listing(listing_id, increment_views=False)
    if listing.seller_id != user_id:
        return {'error': 'AuthorizationError', 'message': 'Not your listing'}, 403

    image = ListingImage.query.get(image_id)
    if not image or image.listing_id != listing_id:
        return {'error': 'NotFoundError', 'message': 'Image not found'}, 404

    image_service.delete_image(image)
    db.session.commit()
    return {'message': 'Image deleted'}, 200


@listings_bp.route('/listings/<listing_id>/images/reorder', methods=['PATCH'])
@jwt_required()
def reorder_images(listing_id):
    user_id = get_jwt_identity()
    listing = listing_service.get_listing(listing_id, increment_views=False)
    if listing.seller_id != user_id:
        return {'error': 'AuthorizationError', 'message': 'Not your listing'}, 403

    data = request.get_json(silent=True)
    errors = reorder_schema.validate(data)
    if errors:
        return {'error': 'ValidationError', 'messages': errors}, 400

    for i, image_id in enumerate(data['image_ids']):
        image = ListingImage.query.get(image_id)
        if image and image.listing_id == listing_id:
            image.sort_order = i
    db.session.commit()
    return {'message': 'Images reordered'}, 200


@listings_bp.route('/listings/<listing_id>/favorite', methods=['POST'])
@jwt_required()
def toggle_favorite(listing_id):
    user_id = get_jwt_identity()
    is_fav = listing_service.toggle_favorite(user_id, listing_id)
    return {'is_favorited': is_fav}, 200


@listings_bp.route('/users/me/favorites', methods=['GET'])
@jwt_required()
def get_my_favorites():
    user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 24, type=int)
    result = listing_service.get_favorites(user_id, page, per_page)
    for item in result['items']:
        item.is_favorited = True
    result['items'] = list_schema.dump(result['items'])
    return result, 200


@listings_bp.route('/users/me/listings', methods=['GET'])
@jwt_required()
def get_my_listings():
    user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 24, type=int)
    result = listing_service.get_user_listings(user_id, page, per_page, include_all=True)
    for item in result['items']:
        _add_favorite_flag(item, user_id)
    result['items'] = list_schema.dump(result['items'])
    return result, 200


@listings_bp.route('/users/<target_user_id>/listings', methods=['GET'])
def get_user_listings(target_user_id):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 24, type=int)
    user_id = _get_current_user_id()
    result = listing_service.get_user_listings(target_user_id, page, per_page)
    for item in result['items']:
        _add_favorite_flag(item, user_id)
    result['items'] = list_schema.dump(result['items'])
    return result, 200
