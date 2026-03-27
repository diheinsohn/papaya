import uuid
from datetime import datetime, timezone
from extensions import db


class Listing(db.Model):
    __tablename__ = 'listings'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    seller_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Numeric(12, 2), nullable=False)
    currency = db.Column(db.String(3), default='CLP')
    condition = db.Column(db.String(20), nullable=False)  # new, like_new, good, fair, poor
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)
    location_lat = db.Column(db.Float)
    location_lng = db.Column(db.Float)
    location_name = db.Column(db.String(200))
    status = db.Column(db.String(20), default='active')  # active, sold, reserved, draft, deleted
    view_count = db.Column(db.Integer, default=0)
    is_promoted = db.Column(db.Boolean, default=False)
    promoted_until = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    seller = db.relationship('User', backref='listings')
    category = db.relationship('Category', backref='listings')
    images = db.relationship('ListingImage', backref='listing', order_by='ListingImage.sort_order', cascade='all, delete-orphan')

    VALID_CONDITIONS = ('new', 'like_new', 'good', 'fair', 'poor')
    VALID_STATUSES = ('active', 'sold', 'reserved', 'draft', 'deleted')

    def __repr__(self):
        return f'<Listing {self.title}>'


class ListingImage(db.Model):
    __tablename__ = 'listing_images'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    listing_id = db.Column(db.String(36), db.ForeignKey('listings.id'), nullable=False)
    url = db.Column(db.String(500), nullable=False)
    thumbnail_url = db.Column(db.String(500))
    sort_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f'<ListingImage {self.url}>'


class SavedListing(db.Model):
    __tablename__ = 'saved_listings'

    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), primary_key=True)
    listing_id = db.Column(db.String(36), db.ForeignKey('listings.id'), primary_key=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
