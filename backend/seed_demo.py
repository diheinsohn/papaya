"""Seed script for demo data - creates users and listings for investor demo."""
import uuid
from datetime import datetime, timezone
from werkzeug.security import generate_password_hash
from app import create_app
from extensions import db
from models.user import User
from models.listing import Listing

app = create_app()

DEMO_USERS = [
    {
        "email": "maria@demo.com",
        "username": "maria_lopez",
        "display_name": "Maria Lopez",
        "phone": "+56912345678",
        "location_name": "Santiago, RM",
        "location_lat": -33.4489,
        "location_lng": -70.6693,
    },
    {
        "email": "carlos@demo.com",
        "username": "carlos_soto",
        "display_name": "Carlos Soto",
        "phone": "+56923456789",
        "location_name": "Providencia, RM",
        "location_lat": -33.4265,
        "location_lng": -70.6108,
    },
    {
        "email": "valentina@demo.com",
        "username": "valentina_rojas",
        "display_name": "Valentina Rojas",
        "phone": "+56934567890",
        "location_name": "Vina del Mar, Valparaiso",
        "location_lat": -33.0153,
        "location_lng": -71.5500,
    },
    {
        "email": "andres@demo.com",
        "username": "andres_munoz",
        "display_name": "Andres Munoz",
        "phone": "+56945678901",
        "location_name": "Las Condes, RM",
        "location_lat": -33.4073,
        "location_lng": -70.5670,
    },
]

LOCATIONS = [
    ("Santiago, RM", -33.4489, -70.6693),
    ("Providencia, RM", -33.4265, -70.6108),
    ("Las Condes, RM", -33.4073, -70.5670),
    ("Vina del Mar, Valparaiso", -33.0153, -71.5500),
    ("Concepcion, Biobio", -36.8201, -73.0444),
]

# (title, price, condition, description, category_id, user_index, location_index)
LISTINGS = [
    ("MacBook Air M2 2022 - Como nuevo", 650000, "like_new",
     "Usado 6 meses, bateria al 98%. Incluye cargador original y caja.",
     1, 0, 0),
    ("Monitor Samsung 27\" 4K", 180000, "good",
     "Excelente monitor para trabajo y gaming. Tiene un pixel muerto casi imperceptible.",
     1, 1, 1),
    ("iPhone 14 Pro 256GB", 520000, "like_new",
     "Sin rayaduras, con protector desde el dia 1. Incluye caja, cable y cargador.",
     2, 2, 3),
    ("Samsung Galaxy S23 128GB", 350000, "good",
     "Funciona perfecto. Pequena marca en la esquina.",
     2, 3, 2),
    ("Zapatillas Nike Air Max 90 - Talla 42", 45000, "like_new",
     "Usadas solo 3 veces. Como nuevas.",
     3, 0, 0),
    ("Chaqueta The North Face talla M", 60000, "good",
     "Original, buen estado. Ideal para trekking.",
     3, 1, 4),
    ("Bolso Louis Vuitton Neverfull", 280000, "like_new",
     "Con certificado de autenticidad. Usado pocas veces.",
     3, 2, 3),
    ("Sofa 3 cuerpos gris", 120000, "good",
     "Muy comodo, sin manchas. Se retira en Providencia.",
     4, 3, 1),
    ("Mesa de comedor madera 6 personas", 85000, "fair",
     "Tiene algunas marcas de uso pero estructura perfecta.",
     4, 0, 0),
    ("Lampara de pie nordica", 25000, "new",
     "Nueva, sin usar. Regalo que nunca ocupe.",
     4, 1, 2),
    ("Bicicleta de montana Trek Marlin 7", 450000, "good",
     "Talla M, mantencion al dia. Incluye luces y candado.",
     5, 2, 3),
    ("Set de pesas y mancuernas 50kg", 55000, "good",
     "Completo, buen estado. Ideal para gimnasio en casa.",
     5, 3, 4),
    ("Scooter electrico Xiaomi Pro 2", 180000, "like_new",
     "1500 km recorridos. Bateria impecable.",
     6, 0, 0),
    ("Coleccion Harry Potter completa (7 libros)", 35000, "good",
     "Edicion en espanol, tapas blandas. Buen estado.",
     7, 1, 1),
    ("PlayStation 5 + 2 controles", 380000, "like_new",
     "Con caja original. Incluye Horizon y God of War.",
     8, 2, 2),
    ("Nintendo Switch OLED + 3 juegos", 250000, "good",
     "Funciona perfecto. Incluye Mario Kart, Zelda y Animal Crossing.",
     8, 3, 3),
    ("Coche de bebe Chicco", 70000, "good",
     "Usado con un hijo. Limpio y funcional.",
     9, 0, 1),
    ("Aspiradora Dyson V11", 220000, "like_new",
     "Comprada hace 4 meses. Con todos los accesorios.",
     10, 1, 0),
    ("Vinilos clasicos - lote de 20", 40000, "fair",
     "Beatles, Pink Floyd, Led Zeppelin y mas. Algunos con marcas.",
     11, 2, 4),
]

PASSWORD = "demo123456"


def seed():
    with app.app_context():
        # Create demo users
        user_ids = []
        for u in DEMO_USERS:
            existing = User.query.filter_by(email=u["email"]).first()
            if existing:
                print(f"User {u['email']} already exists, skipping.")
                user_ids.append(existing.id)
                continue
            user = User(
                id=str(uuid.uuid4()),
                email=u["email"],
                username=u["username"],
                display_name=u["display_name"],
                phone=u["phone"],
                location_name=u["location_name"],
                location_lat=u["location_lat"],
                location_lng=u["location_lng"],
                is_verified=True,
                is_active=True,
            )
            user.set_password(PASSWORD)
            db.session.add(user)
            db.session.flush()
            user_ids.append(user.id)
            print(f"Created user: {u['display_name']} ({u['email']})")

        # Create listings
        created = 0
        for title, price, condition, desc, cat_id, user_idx, loc_idx in LISTINGS:
            # Check if listing with same title already exists
            existing = Listing.query.filter_by(title=title).first()
            if existing:
                print(f"Listing '{title}' already exists, skipping.")
                continue
            loc_name, loc_lat, loc_lng = LOCATIONS[loc_idx]
            listing = Listing(
                id=str(uuid.uuid4()),
                seller_id=user_ids[user_idx],
                title=title,
                description=desc,
                price=price,
                currency="CLP",
                condition=condition,
                category_id=cat_id,
                location_name=loc_name,
                location_lat=loc_lat,
                location_lng=loc_lng,
                status="active",
                view_count=0,
            )
            db.session.add(listing)
            created += 1
            print(f"Created listing: {title} - ${price:,} CLP")

        db.session.commit()
        print(f"\nDone! Created {created} listings.")
        total = Listing.query.filter_by(status="active").count()
        print(f"Total active listings in database: {total}")


if __name__ == "__main__":
    seed()
