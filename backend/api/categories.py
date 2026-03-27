from flask import Blueprint
from models.category import Category
from schemas.listing_schema import CategorySchema

categories_bp = Blueprint('categories', __name__)
category_schema = CategorySchema(many=True)


@categories_bp.route('/categories', methods=['GET'])
def get_categories():
    categories = Category.query.filter_by(parent_id=None).order_by(Category.sort_order).all()
    result = []
    for cat in categories:
        cat_data = {
            'id': cat.id,
            'name': cat.name,
            'slug': cat.slug,
            'icon': cat.icon,
            'sort_order': cat.sort_order,
            'children': [
                {'id': c.id, 'name': c.name, 'slug': c.slug, 'icon': c.icon, 'sort_order': c.sort_order}
                for c in cat.children
            ],
        }
        result.append(cat_data)
    return {'categories': result}, 200
