import uuid
from datetime import datetime, timezone
from extensions import db


class Lead(db.Model):
    __tablename__ = 'leads'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    source = db.Column(db.String(50), default='landing')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f'<Lead {self.email}>'
