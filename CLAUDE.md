# Papaya Marketplace

Marketplace C2C de artículos de segunda mano/usados/reciclados, inspirado en Wallapop, para el mercado latinoamericano.

## Stack
- **Backend**: Flask 3.1 (Python) — Application factory pattern, Blueprints, SQLAlchemy
- **Frontend**: React 18+ (TypeScript) — Vite, Tailwind CSS, React Router
- **Database**: PostgreSQL 16 + PostGIS
- **Cache/Queue**: Redis 7
- **Real-time**: Flask-SocketIO + eventlet
- **Async tasks**: Celery + Redis
- **Payments**: Mercado Pago SDK (escrow model)
- **Infrastructure**: Docker Compose, Nginx reverse proxy

## Architecture
- **Backend modular por servicios**: `models/ → services/ → api/` (Blueprints thin, services fat)
- **Extensions centralizadas**: `extensions.py` para evitar imports circulares
- **Frontend por dominio**: `pages/ → hooks/ → api/` con Context providers para estado global
- **API-first**: El backend define todas las reglas de negocio. El frontend es consumidor.

## Conventions
- Python: type hints, PEP 8 enforced by ruff
- TypeScript: strict mode, tipos en `types/`
- Tests: pytest (backend), Vitest (frontend). Target 80% coverage en services.
- Git: commits descriptivos, PRs por feature
- ENV: Toda config via variables de entorno (ver `.env.example`)

## Commands
```bash
make dev          # Levantar stack de desarrollo
make test         # Correr todos los tests
make test-backend # Solo tests backend
make test-frontend # Solo tests frontend
make lint         # Linting (ruff + eslint)
make migrate      # Correr migraciones
make seed         # Seed de categorías y datos de prueba
```

## Team Agents
- `papaya-fullstack` — Tech Lead, arquitectura, coordinación
- `papaya-backend` — Backend Flask/Python, API, DB, servicios
- `papaya-frontend` — Frontend React/TypeScript, UI/UX, componentes
- `papaya-devops` — Docker, CI/CD, infraestructura, monitoreo
- `papaya-payments` — Mercado Pago, flujos de pago, transacciones
- `papaya-qa` — Testing, QA, cobertura, fixtures
