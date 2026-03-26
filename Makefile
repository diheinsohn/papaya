.PHONY: dev down test test-backend test-frontend lint migrate migration seed logs shell-backend shell-db

dev:
	docker compose -f docker-compose.dev.yml up --build

down:
	docker compose -f docker-compose.dev.yml down

test: test-backend test-frontend

test-backend:
	docker compose -f docker-compose.dev.yml exec backend python -m pytest

test-frontend:
	docker compose -f docker-compose.dev.yml exec frontend npm test

lint:
	docker compose -f docker-compose.dev.yml exec backend python -m ruff check .
	docker compose -f docker-compose.dev.yml exec frontend npm run lint

migrate:
	docker compose -f docker-compose.dev.yml exec backend flask db upgrade

migration:
	docker compose -f docker-compose.dev.yml exec backend flask db migrate -m "$(msg)"

seed:
	docker compose -f docker-compose.dev.yml exec backend flask seed

logs:
	docker compose -f docker-compose.dev.yml logs -f

shell-backend:
	docker compose -f docker-compose.dev.yml exec backend bash

shell-db:
	docker compose -f docker-compose.dev.yml exec db psql -U papaya -d papaya_dev
