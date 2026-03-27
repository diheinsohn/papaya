from sqlalchemy import func, cast, Float
from extensions import db
from models.listing import Listing
from models.category import Category
from utils.pagination import paginate


# Earth radius in km for Haversine
_EARTH_RADIUS_KM = 6371.0


def search_listings(query_text=None, category_slug=None, min_price=None, max_price=None,
                    conditions=None, lat=None, lng=None, radius_km=None,
                    sort_by='relevance', page=1, per_page=24):
    """Search listings with full-text search, filters, and distance."""
    query = Listing.query.filter(Listing.status == 'active')

    # Full-text search
    ts_rank = None
    if query_text:
        ts_vector = func.to_tsvector(
            'spanish',
            func.coalesce(Listing.title, '') + ' ' + func.coalesce(Listing.description, ''),
        )
        ts_query = func.plainto_tsquery('spanish', query_text)
        query = query.filter(ts_vector.op('@@')(ts_query))
        ts_rank = func.ts_rank(ts_vector, ts_query)

    # Category filter
    if category_slug:
        category = Category.query.filter_by(slug=category_slug).first()
        if category:
            category_ids = [category.id] + [c.id for c in category.children]
            query = query.filter(Listing.category_id.in_(category_ids))

    # Price range filter
    if min_price is not None:
        query = query.filter(Listing.price >= min_price)
    if max_price is not None:
        query = query.filter(Listing.price <= max_price)

    # Condition filter
    if conditions:
        condition_list = [c.strip() for c in conditions.split(',')]
        query = query.filter(Listing.condition.in_(condition_list))

    # Distance filter using Haversine formula in SQL
    distance_col = None
    if lat is not None and lng is not None:
        query = query.filter(
            Listing.location_lat.isnot(None),
            Listing.location_lng.isnot(None),
        )

        # Haversine distance in km using PostgreSQL math functions
        lat_rad = func.radians(cast(Listing.location_lat, Float))
        lng_rad = func.radians(cast(Listing.location_lng, Float))
        user_lat_rad = func.radians(lat)
        user_lng_rad = func.radians(lng)

        dlat = lat_rad - user_lat_rad
        dlng = lng_rad - user_lng_rad

        a = func.pow(func.sin(dlat / 2), 2) + \
            func.cos(user_lat_rad) * func.cos(lat_rad) * func.pow(func.sin(dlng / 2), 2)
        distance_col = _EARTH_RADIUS_KM * 2 * func.atan2(func.sqrt(a), func.sqrt(1 - a))

        if radius_km is not None:
            query = query.filter(distance_col <= radius_km)

    # Sorting
    if sort_by == 'price_asc':
        query = query.order_by(Listing.price.asc())
    elif sort_by == 'price_desc':
        query = query.order_by(Listing.price.desc())
    elif sort_by == 'newest':
        query = query.order_by(Listing.created_at.desc())
    elif sort_by == 'closest' and distance_col is not None:
        query = query.order_by(distance_col.asc())
    elif sort_by == 'relevance' and ts_rank is not None:
        query = query.order_by(ts_rank.desc())
    else:
        query = query.order_by(Listing.created_at.desc())

    return paginate(query, page, per_page)


def get_suggestions(prefix, limit=5):
    """Get autocomplete suggestions based on listing titles."""
    if not prefix or len(prefix) < 2:
        return []
    results = db.session.query(Listing.title).filter(
        Listing.status == 'active',
        Listing.title.ilike(f'{prefix}%'),
    ).distinct().limit(limit).all()
    return [r[0] for r in results]


def get_feed(lat=None, lng=None, page=1, per_page=24):
    """Get a feed of listings, optionally sorted by distance."""
    if lat is not None and lng is not None:
        return search_listings(lat=lat, lng=lng, sort_by='closest', page=page, per_page=per_page)
    return search_listings(sort_by='newest', page=page, per_page=per_page)
