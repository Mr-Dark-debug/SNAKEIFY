# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Snakeify is a Snake game that integrates with Spotify, where the snake eats album covers from the user's Liked Songs. Features include audio previews, dynamic background colors extracted from album art, and a global leaderboard.

## Tech Stack

- **Backend**: FastAPI (Python), Supabase (PostgreSQL)
- **Frontend**: React 19, Vite, Zustand (state), Tailwind CSS 4, Framer Motion
- **Deployment**: Docker Compose

## Commands

### Docker (recommended)
```bash
# Run full stack
docker-compose up --build

# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Backend (manual)
```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

### Frontend (manual)
```bash
cd frontend
npm install
npm run dev
npm run lint     # ESLint
npm run build    # Production build
```

## Architecture

### Backend Structure
- `app/main.py` - FastAPI app, CORS config, router registration
- `app/core/config.py` - Pydantic settings from `.env`
- `app/routers/auth.py` - Spotify OAuth2 flow (`/login`, `/callback`)
- `app/routers/game.py` - Score submission, leaderboard, history endpoints
- `app/database.py` - Supabase client initialization
- `app/schemas.py` - Pydantic models for API validation
- `schema/` - SQL migrations for Supabase

### Frontend Structure
- `src/App.jsx` - Main app with auth flow, game state routing
- `src/store/gameStore.js` - Zustand store for all game state (snake, score, tracks, direction)
- `src/components/GameBoard.jsx` - Canvas-based game loop, audio handling, ColorThief integration
- `src/components/Leaderboard.jsx` - Leaderboard display with session history modal
- `src/utils/spotify.js` - Spotify API calls for fetching liked songs

### Key Patterns

**State Management**: All game state flows through Zustand store (`useGameStore`). Components read/write via hooks.

**Audio Preloading**: Next track's audio is preloaded while current plays (`nextAudio` state) for seamless transitions.

**Dynamic Colors**: ColorThief extracts dominant color from album art to set background.

**Game Loop**: 150ms interval in `useEffect`, handles movement, collision, eating logic on canvas.

**API Flow**: 
1. `/login` → Spotify OAuth → `/callback` → creates/updates user in Supabase → redirects to frontend with `access_token` and `user_id`
2. Game over → POST `/score` with eaten songs array
3. Leaderboard fetches `/leaderboard`, clicking entry fetches `/history/{session_id}`

## Environment Variables

Root `.env` (for Docker):
```
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SUPABASE_URL=
SUPABASE_KEY=
```

Frontend uses `VITE_API_URL=http://localhost:8000` (set in docker-compose).

## Database Schema

Two tables in Supabase:
- `users`: spotify_id, display_name, profile_image
- `game_sessions`: user_id (FK), score, eaten_songs (JSONB)
