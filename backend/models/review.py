import uuid
from datetime import datetime, timezone
from extensions import db


class Review(db.Model):
    __tablename__ = 'reviews'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    listing_id = db.Column(db.String(36), db.ForeignKey('listings.id'), nullable=False)
    reviewer_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    reviewee_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)  # 1-5
    comment = db.Column(db.Text)
    role = db.Column(db.String(10), nullable=False)  # 'buyer' or 'seller'
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    listing = db.relationship('Listing', backref='reviews')
    reviewer = db.relationship('User', foreign_keys=[reviewer_id], backref='reviews_written')
    reviewee = db.relationship('User', foreign_keys=[reviewee_id], backref='reviews_received')

    __table_args__ = (
        db.UniqueConstraint('listing_id', 'reviewer_id', name='uq_review_listing_reviewer'),
    )

    def __repr__(self):
        return f'<Review {self.rating}★ by {self.reviewer_id}>'


class Dispute(db.Model):
    __tablename__ = 'disputes'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    listing_id = db.Column(db.String(36), db.ForeignKey('listings.id'), nullable=False)
    opened_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    reason = db.Column(db.String(30), nullable=False)  # not_received, not_as_described, damaged, other
    description = db.Column(db.Text)
    status = db.Column(db.String(20), default='open')  # open, under_review, resolved_buyer, resolved_seller, closed
    resolution_notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    resolved_at = db.Column(db.DateTime, nullable=True)

    listing = db.relationship('Listing', backref='disputes')
    opener = db.relationship('User', backref='disputes_opened')

    VALID_REASONS = ('not_received', 'not_as_described', 'damaged', 'other')

    def __repr__(self):
        return f'<Dispute {self.id} - {self.status}>'
