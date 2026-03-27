"""Seed initial categories. Run with: flask seed-categories"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from extensions import db
from models.category import Category

CATEGORIES = [
    {'name': 'Electrónica', 'slug': 'electronica', 'icon': 'laptop', 'sort_order': 1},
    {'name': 'Teléfonos', 'slug': 'telefonos', 'icon': 'phone', 'sort_order': 2},
    {'name': 'Moda y Accesorios', 'slug': 'moda', 'icon': 'shirt', 'sort_order': 3},
    {'name': 'Hogar y Jardín', 'slug': 'hogar', 'icon': 'home', 'sort_order': 4},
    {'name': 'Deportes', 'slug': 'deportes', 'icon': 'dumbbell', 'sort_order': 5},
    {'name': 'Vehículos', 'slug': 'vehiculos', 'icon': 'car', 'sort_order': 6},
    {'name': 'Libros y Música', 'slug': 'libros-musica', 'icon': 'book', 'sort_order': 7},
    {'name': 'Videojuegos', 'slug': 'videojuegos', 'icon': 'gamepad', 'sort_order': 8},
    {'name': 'Niños y Bebés', 'slug': 'ninos-bebes', 'icon': 'baby', 'sort_order': 9},
    {'name': 'Electrodomésticos', 'slug': 'electrodomesticos', 'icon': 'zap', 'sort_order': 10},
    {'name': 'Coleccionables', 'slug': 'coleccionables', 'icon': 'star', 'sort_order': 11},
    {'name': 'Otros', 'slug': 'otros', 'icon': 'box', 'sort_order': 99},
]


def seed():
    app = create_app()
    with app.app_context():
        if Category.query.first():
            print('Categories already seeded.')
            return
        for cat_data in CATEGORIES:
            category = Category(**cat_data)
            db.session.add(category)
        db.session.commit()
        print(f'Seeded {len(CATEGORIES)} categories.')


if __name__ == '__main__':
    seed()
