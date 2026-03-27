from extensions import db
from models.review import Review
from models.user import User
from models.listing import Listing
from models.message import Conversation, Message
from utils.errors import NotFoundError, ValidationError, AuthorizationError


def _find_accepted_offer(listing_id, user_id):
    """Find an accepted offer conversation involving this user and listing."""
    conv = Conversation.query.filter(
        Conversation.listing_id == listing_id,
        db.or_(Conversation.buyer_id == user_id, Conversation.seller_id == user_id),
    ).first()
    if not conv:
        return None

    accepted_offer = Message.query.filter(
        Message.conversation_id == conv.id,
        Message.message_type == 'offer',
        Message.offer_status == 'accepted',
    ).first()
    return (conv, accepted_offer) if accepted_offer else None


def create_review(listing_id, reviewer_id, rating, comment=''):
    # Validate rating
    if not isinstance(rating, int) or rating < 1 or rating > 5:
        raise ValidationError('La calificación debe ser entre 1 y 5')

    # Get listing
    listing = Listing.query.get(listing_id)
    if not listing:
        raise NotFoundError('Publicación no encontrada')

    # Check the reviewer was involved in an accepted offer for this listing
    result = _find_accepted_offer(listing_id, reviewer_id)
    if not result:
        raise ValidationError('Solo puedes dejar una reseña si hubo una oferta aceptada en esta publicación')

    conv, _ = result

    # Determine role and reviewee
    if conv.buyer_id == reviewer_id:
        role = 'buyer'
        reviewee_id = conv.seller_id
    elif conv.seller_id == reviewer_id:
        role = 'seller'
        reviewee_id = conv.buyer_id
    else:
        raise AuthorizationError('No participaste en esta transacción')

    # Check not already reviewed
    existing = Review.query.filter_by(listing_id=listing_id, reviewer_id=reviewer_id).first()
    if existing:
        raise ValidationError('Ya dejaste una reseña para esta publicación')

    review = Review(
        listing_id=listing_id,
        reviewer_id=reviewer_id,
        reviewee_id=reviewee_id,
        rating=rating,
        comment=comment,
        role=role,
    )
    db.session.add(review)

    # Update reviewee's denormalized rating
    _update_user_rating(reviewee_id)

    db.session.commit()
    return review


def _update_user_rating(user_id):
    """Recalculate user's average rating and review count."""
    from sqlalchemy import func
    result = db.session.query(
        func.avg(Review.rating),
        func.count(Review.id),
    ).filter(Review.reviewee_id == user_id).first()

    user = User.query.get(user_id)
    if user and result:
        user.avg_rating = round(float(result[0] or 0), 2)
        user.review_count = int(result[1] or 0)


def get_user_reviews(user_id, page=1, per_page=10):
    """Get reviews received by a user."""
    from utils.pagination import paginate
    query = Review.query.filter_by(reviewee_id=user_id).order_by(Review.created_at.desc())
    return paginate(query, page, per_page)


def get_review(review_id):
    review = Review.query.get(review_id)
    if not review:
        raise NotFoundError('Reseña no encontrada')
    return review


def can_review(listing_id, user_id, from_listing_page=True):
    """Check if user can leave a review for this listing.
    from_listing_page=True means only buyers can review (from listing detail).
    from_listing_page=False means both buyers and sellers can review (from purchases/sales page)."""
    listing = Listing.query.get(listing_id)
    if not listing:
        return False

    # From listing page, only buyer can review
    if from_listing_page and listing.seller_id == user_id:
        return False

    # Must have an accepted offer
    result = _find_accepted_offer(listing_id, user_id)
    if not result:
        return False

    # Must not have already reviewed
    existing = Review.query.filter_by(listing_id=listing_id, reviewer_id=user_id).first()
    return existing is None
