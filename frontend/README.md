# Snakeify Frontend

React + Vite frontend for Snakeify.

## Structure

- `src/components/`: React components (GameBoard).
- `src/store/`: Zustand state management.
- `src/utils/`: Helper functions.
- `src/App.jsx`: Main application logic.

## Running

1. Ensure `.env` is set in the root directory.
2. Run with Docker Compose (from root):
   ```bash
   docker-compose up --build
   ```

## Development

To run locally without Docker (requires backend running):

```bash
npm install
npm run dev
```
