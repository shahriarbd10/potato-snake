# Potato Snake

A dark retro snake game with wraparound movement, a chunky square snake, player name entry, and a MongoDB-backed top 100 leaderboard.

## Features

- Classic snake gameplay with keyboard and on-screen controls
- Name entry before starting a run
- Score shown on game over
- MongoDB-backed leaderboard with the top 100 scorers
- Top 3 leaderboard spots highlighted with crowned rank badges
- Wraparound movement through screen edges
- Square pixel-style snake segments
- Dark handheld-inspired interface
- High score saved in the browser

## Controls

- Arrow keys: move
- W A S D: move
- Space: start or pause
- Enter: start from the name field or start again after game over
- On-screen pad: touch controls for mobile and tablet

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Create a local environment file:

```bash
cp .env.example .env.local
```

3. Add your MongoDB connection string to `.env.local`.

4. Start the app:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Build

```bash
npm run build
npm run start
```

## Project Structure

- `app/page.tsx`: main page
- `components/NokiaSnakeGame.tsx`: game logic, menu flow, and leaderboard UI
- `app/api/scores/route.ts`: score submission API
- `app/api/leaderboard/route.ts`: leaderboard API
- `lib/mongodb.ts`: MongoDB connection helper
- `app/globals.css`: styling and retro theme

## Environment Variables

- `MONGODB_URI`: MongoDB connection string
- `MONGODB_DB`: database name, defaults to `potato-snake`

## Vercel Notes

If `/api/leaderboard` or `/api/scores` returns `500` on Vercel:

- Add `MONGODB_URI` in the Vercel project environment variables
- Add `MONGODB_DB=potato-snake`
- Redeploy after saving the environment variables
- In MongoDB Atlas, make sure the cluster allows connections from Vercel. If needed, temporarily allow `0.0.0.0/0` for testing
- Check Vercel function logs after redeploy. The API routes now log the real MongoDB error message
