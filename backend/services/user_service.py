from extensions import db
from models.user import User
from utils.errors import NotFoundError


def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        raise NotFoundError('User not found')
    return user


def update_profile(user_id, data):
    user = User.query.get(user_id)
    if not user:
        raise NotFoundError('User not found')

    allowed_fields = ['display_name', 'bio', 'phone', 'location_lat', 'location_lng', 'location_name']
    for field in allowed_fields:
        if field in data:
            setattr(user, field, data[field])

    db.session.commit()
    return user


def update_avatar(user_id, avatar_url):
    user = User.query.get(user_id)
    if not user:
        raise NotFoundError('User not found')
    user.avatar_url = avatar_url
    db.session.commit()
    return user
