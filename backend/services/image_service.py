import uuid
import os
from io import BytesIO
from PIL import Image
from extensions import db
from models.listing import ListingImage
from utils.storage import get_storage
from utils.errors import ValidationError

ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
MAX_IMAGES_PER_LISTING = 10

SIZES = {
    'large': 1200,
    'medium': 600,
    'thumbnail': 150,
}


def _get_extension(filename):
    if '.' in filename:
        return filename.rsplit('.', 1)[1].lower()
    return 'jpg'


def _resize_image(image_bytes, max_dimension):
    img = Image.open(BytesIO(image_bytes))
    if img.mode in ('RGBA', 'P'):
        img = img.convert('RGB')
    img.thumbnail((max_dimension, max_dimension), Image.LANCZOS)
    output = BytesIO()
    img.save(output, format='JPEG', quality=85)
    output.seek(0)
    return output.read()


def process_and_save_image(file, listing_id, sort_order=0):
    ext = _get_extension(file.filename)
    if ext not in ALLOWED_EXTENSIONS:
        raise ValidationError(f'Invalid file format. Allowed: {", ".join(ALLOWED_EXTENSIONS)}')

    file_data = file.read()
    if len(file_data) > MAX_FILE_SIZE:
        raise ValidationError('File too large. Maximum 5MB.')

    storage = get_storage()
    unique_id = uuid.uuid4().hex[:12]

    # Save large version
    large_data = _resize_image(file_data, SIZES['large'])
    large_filename = f"listing_{listing_id}_{unique_id}_large.jpg"
    large_url = storage.save(large_data, large_filename)

    # Save thumbnail
    thumb_data = _resize_image(file_data, SIZES['thumbnail'])
    thumb_filename = f"listing_{listing_id}_{unique_id}_thumb.jpg"
    thumb_url = storage.save(thumb_data, thumb_filename)

    image = ListingImage(
        listing_id=listing_id,
        url=large_url,
        thumbnail_url=thumb_url,
        sort_order=sort_order,
    )
    db.session.add(image)
    return image


def delete_image(image):
    storage = get_storage()
    if image.url:
        storage.delete(image.url)
    if image.thumbnail_url:
        storage.delete(image.thumbnail_url)
    db.session.delete(image)


def validate_image_count(listing_id):
    count = ListingImage.query.filter_by(listing_id=listing_id).count()
    if count >= MAX_IMAGES_PER_LISTING:
        raise ValidationError(f'Maximum {MAX_IMAGES_PER_LISTING} images per listing.')
    return count
