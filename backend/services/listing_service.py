from extensions import db
from models.listing import Listing, SavedListing
from models.user import User
from utils.errors import NotFoundError, AuthorizationError, ValidationError
from utils.pagination import paginate


def create_listing(seller_id, data):
    if data.get('condition') not in Listing.VALID_CONDITIONS:
        raise ValidationError(f'Invalid condition. Must be one of: {", ".join(Listing.VALID_CONDITIONS)}')

    listing = Listing(
        seller_id=seller_id,
        title=data['title'],
        description=data.get('description', ''),
        price=data['price'],
        currency=data.get('currency', 'CLP'),
        condition=data['condition'],
        category_id=data['category_id'],
        location_lat=data.get('location_lat'),
        location_lng=data.get('location_lng'),
        location_name=data.get('location_name', ''),
        status='active',
    )
    db.session.add(listing)
    db.session.commit()
    return listing


def get_listing(listing_id, increment_views=True):
    listing = Listing.query.get(listing_id)
    if not listing or listing.status == 'deleted':
        raise NotFoundError('Listing not found')
    if increment_views:
        listing.view_count = (listing.view_count or 0) + 1
        db.session.commit()
    return listing


def update_listing(listing_id, user_id, data):
    listing = Listing.query.get(listing_id)
    if not listing or listing.status == 'deleted':
        raise NotFoundError('Listing not found')
    if listing.seller_id != user_id:
        raise AuthorizationError('You can only edit your own listings')

    allowed_fields = ['title', 'description', 'price', 'currency', 'condition',
                      'category_id', 'location_lat', 'location_lng', 'location_name']
    for field in allowed_fields:
        if field in data:
            if field == 'condition' and data[field] not in Listing.VALID_CONDITIONS:
                raise ValidationError(f'Invalid condition.')
            setattr(listing, field, data[field])

    db.session.commit()
    return listing


def delete_listing(listing_id, user_id):
    listing = Listing.query.get(listing_id)
    if not listing or listing.status == 'deleted':
        raise NotFoundError('Listing not found')
    if listing.seller_id != user_id:
        raise AuthorizationError('You can only delete your own listings')
    listing.status = 'deleted'
    db.session.commit()


def get_listings(page=1, per_page=24, sort='newest'):
    query = Listing.query.filter(Listing.status == 'active')
    if sort == 'newest':
        query = query.order_by(Listing.created_at.desc())
    elif sort == 'price_asc':
        query = query.order_by(Listing.price.asc())
    elif sort == 'price_desc':
        query = query.order_by(Listing.price.desc())
    else:
        query = query.order_by(Listing.created_at.desc())
    return paginate(query, page, per_page)


def get_user_listings(user_id, page=1, per_page=24, include_all=False):
    query = Listing.query.filter(Listing.seller_id == user_id)
    if include_all:
        # Show all statuses except deleted
        query = query.filter(Listing.status != 'deleted')
    else:
        query = query.filter(Listing.status == 'active')
    query = query.order_by(Listing.created_at.desc())
    return paginate(query, page, per_page)


def toggle_favorite(user_id, listing_id):
    listing = Listing.query.get(listing_id)
    if not listing or listing.status == 'deleted':
        raise NotFoundError('Listing not found')

    saved = SavedListing.query.get((user_id, listing_id))
    if saved:
        db.session.delete(saved)
        db.session.commit()
        return False  # unfavorited
    else:
        saved = SavedListing(user_id=user_id, listing_id=listing_id)
        db.session.add(saved)
        db.session.commit()
        return True  # favorited


def get_favorites(user_id, page=1, per_page=24):
    query = Listing.query.join(SavedListing, SavedListing.listing_id == Listing.id).filter(
        SavedListing.user_id == user_id,
        Listing.status == 'active',
    ).order_by(SavedListing.created_at.desc())
    return paginate(query, page, per_page)


def is_favorited(user_id, listing_id):
    return SavedListing.query.get((user_id, listing_id)) is not None
