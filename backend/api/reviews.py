from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from services import review_service
from models.review import Review, Dispute
from extensions import db

reviews_bp = Blueprint('reviews', __name__)


def _serialize_review(review):
    return {
        'id': review.id,
        'listing_id': review.listing_id,
        'listing': {
            'id': review.listing.id,
            'title': review.listing.title,
        },
        'reviewer': {
            'id': review.reviewer.id,
            'username': review.reviewer.username,
            'display_name': review.reviewer.display_name,
            'avatar_url': review.reviewer.avatar_url,
        },
        'reviewee_id': review.reviewee_id,
        'rating': review.rating,
        'comment': review.comment,
        'role': review.role,
        'created_at': review.created_at.isoformat(),
    }


@reviews_bp.route('/reviews', methods=['POST'])
@jwt_required()
def create_review():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True)
    if not data:
        return {'error': 'ValidationError', 'message': 'Request body is required'}, 400

    listing_id = data.get('listing_id')
    rating = data.get('rating')
    comment = data.get('comment', '')

    if not listing_id or not rating:
        return {'error': 'ValidationError', 'message': 'listing_id and rating are required'}, 400

    try:
        rating = int(rating)
    except (ValueError, TypeError):
        return {'error': 'ValidationError', 'message': 'rating must be an integer'}, 400

    review = review_service.create_review(listing_id, user_id, rating, comment)
    return _serialize_review(review), 201


@reviews_bp.route('/users/<user_id>/reviews', methods=['GET'])
def get_user_reviews(user_id):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    result = review_service.get_user_reviews(user_id, page, per_page)
    result['items'] = [_serialize_review(r) for r in result['items']]
    return result, 200


@reviews_bp.route('/reviews/<review_id>', methods=['GET'])
def get_review(review_id):
    review = review_service.get_review(review_id)
    return _serialize_review(review), 200


@reviews_bp.route('/reviews/can-review/<listing_id>', methods=['GET'])
@jwt_required()
def can_review(listing_id):
    user_id = get_jwt_identity()
    return {'can_review': review_service.can_review(listing_id, user_id)}, 200


@reviews_bp.route('/reviews/can-review-as-seller/<listing_id>', methods=['GET'])
@jwt_required()
def can_review_as_seller(listing_id):
    user_id = get_jwt_identity()
    return {'can_review': review_service.can_review(listing_id, user_id, from_listing_page=False)}, 200


# Disputes
@reviews_bp.route('/disputes', methods=['POST'])
@jwt_required()
def create_dispute():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True)
    if not data:
        return {'error': 'ValidationError', 'message': 'Request body is required'}, 400

    listing_id = data.get('listing_id')
    reason = data.get('reason')
    description = data.get('description', '')

    if not listing_id or not reason:
        return {'error': 'ValidationError', 'message': 'listing_id and reason are required'}, 400

    if reason not in Dispute.VALID_REASONS:
        return {'error': 'ValidationError', 'message': f'reason must be one of: {", ".join(Dispute.VALID_REASONS)}'}, 400

    dispute = Dispute(
        listing_id=listing_id,
        opened_by=user_id,
        reason=reason,
        description=description,
    )
    db.session.add(dispute)
    db.session.commit()

    return {
        'id': dispute.id,
        'listing_id': dispute.listing_id,
        'reason': dispute.reason,
        'status': dispute.status,
        'created_at': dispute.created_at.isoformat(),
    }, 201


@reviews_bp.route('/disputes/<dispute_id>', methods=['GET'])
@jwt_required()
def get_dispute(dispute_id):
    dispute = Dispute.query.get(dispute_id)
    if not dispute:
        return {'error': 'NotFoundError', 'message': 'Dispute not found'}, 404
    return {
        'id': dispute.id,
        'listing_id': dispute.listing_id,
        'opened_by': dispute.opened_by,
        'reason': dispute.reason,
        'description': dispute.description,
        'status': dispute.status,
        'resolution_notes': dispute.resolution_notes,
        'created_at': dispute.created_at.isoformat(),
        'resolved_at': dispute.resolved_at.isoformat() if dispute.resolved_at else None,
    }, 200
