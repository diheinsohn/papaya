import uuid
from datetime import datetime, timezone
from extensions import db


class SavedSearch(db.Model):
    __tablename__ = 'saved_searches'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    query = db.Column(db.String(200))
    filters = db.Column(db.JSON)  # Serialized filter state
    notify = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    user = db.relationship('User', backref='saved_searches')

    def __repr__(self):
        return f'<SavedSearch {self.query}>'
