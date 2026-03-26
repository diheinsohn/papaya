# Database Migrations

This directory will contain Alembic/Flask-Migrate migration files.

Run `flask db init` when the Docker stack is up for the first time to generate
the standard Alembic configuration files (env.py, alembic.ini, script.py.mako).

Then use:
- `flask db migrate -m "description"` to generate a new migration
- `flask db upgrade` to apply migrations
- `flask db downgrade` to roll back
