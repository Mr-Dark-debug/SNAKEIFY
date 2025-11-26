# Snakeify Backend

FastAPI backend for Snakeify.

## Structure

- `app/main.py`: Entry point.
- `app/core/`: Configuration.
- `app/routers/`: API endpoints (Auth, Game).
- `app/models.py`: Database models.
- `app/schemas.py`: Pydantic schemas.
- `app/database.py`: DB connection.

## Running

1. Ensure `.env` is set in the root directory.
2. Run with Docker Compose (from root):
   ```bash
   docker-compose up --build
   ```

## Endpoints

- `GET /login`: Start Spotify OAuth.
- `GET /callback`: Spotify OAuth callback.
- `POST /score`: Submit game score.
- `GET /leaderboard`: Get top scores.
- `GET /history/{id}`: Get eaten songs for a session.

## Logging

Logs are output to stdout/stderr and captured by Docker.
