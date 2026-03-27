from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.message import Conversation, Message
from models.listing import Listing
from models.review import Review
from utils.errors import NotFoundError, ValidationError

transactions_bp = Blueprint('transactions', __name__)


def _get_accepted_offers_for_user(user_id, role):
    """Get listings where user has an accepted offer, as buyer or seller."""
    if role == 'buyer':
        convs = Conversation.query.filter_by(buyer_id=user_id).all()
    else:
        convs = Conversation.query.filter_by(seller_id=user_id).all()

    results = []
    for conv in convs:
        accepted = Message.query.filter(
            Message.conversation_id == conv.id,
            Message.message_type == 'offer',
            Message.offer_status == 'accepted',
        ).first()
        if accepted:
            listing = Listing.query.get(conv.listing_id)
            if listing and listing.status in ('reserved', 'sold'):
                other_user = conv.seller if role == 'buyer' else conv.buyer
                # Check if already reviewed
                has_reviewed = Review.query.filter_by(
                    listing_id=listing.id,
                    reviewer_id=user_id,
                ).first() is not None

                results.append({
                    'listing': {
                        'id': listing.id,
                        'title': listing.title,
                        'price': str(listing.price),
                        'currency': listing.currency,
                        'status': listing.status,
                        'images': [{'url': img.url, 'thumbnail_url': img.thumbnail_url} for img in listing.images[:1]],
                    },
                    'other_user': {
                        'id': other_user.id,
                        'username': other_user.username,
                        'display_name': other_user.display_name,
                        'avatar_url': other_user.avatar_url,
                    },
                    'conversation_id': conv.id,
                    'offer_amount': str(accepted.offer_amount),
                    'accepted_at': accepted.created_at.isoformat(),
                    'has_reviewed': has_reviewed,
                    'receipt_confirmed': listing.status == 'sold',
                })

    # Sort by most recent first
    results.sort(key=lambda x: x['accepted_at'], reverse=True)
    return results


@transactions_bp.route('/my-purchases', methods=['GET'])
@jwt_required()
def get_my_purchases():
    user_id = get_jwt_identity()
    purchases = _get_accepted_offers_for_user(user_id, 'buyer')
    return {'items': purchases}, 200


@transactions_bp.route('/my-sales', methods=['GET'])
@jwt_required()
def get_my_sales():
    user_id = get_jwt_identity()
    sales = _get_accepted_offers_for_user(user_id, 'seller')
    return {'items': sales}, 200


@transactions_bp.route('/listings/<listing_id>/confirm-receipt', methods=['POST'])
@jwt_required()
def confirm_receipt(listing_id):
    user_id = get_jwt_identity()

    listing = Listing.query.get(listing_id)
    if not listing:
        raise NotFoundError('Publicación no encontrada')

    if listing.status != 'reserved':
        raise ValidationError('Esta publicación no está en estado reservado')

    # Verify user is the buyer
    conv = Conversation.query.filter_by(listing_id=listing_id, buyer_id=user_id).first()
    if not conv:
        raise ValidationError('No eres el comprador de esta publicación')

    # Verify there's an accepted offer
    accepted = Message.query.filter(
        Message.conversation_id == conv.id,
        Message.message_type == 'offer',
        Message.offer_status == 'accepted',
    ).first()
    if not accepted:
        raise ValidationError('No hay una oferta aceptada para esta publicación')

    listing.status = 'sold'
    db.session.commit()

    return {'message': 'Recepción confirmada', 'status': 'sold'}, 200
