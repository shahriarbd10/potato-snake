# Potato Snake

A dark retro snake game with wraparound movement, a chunky square snake, and tiny potato snacks on the grid.

## Features

- Classic snake gameplay with keyboard and on-screen controls
- Wraparound movement through screen edges
- Square pixel-style snake segments
- Dark handheld-inspired interface
- High score saved in the browser
- Mobile-friendly control pad

## Controls

- Arrow keys: move
- W A S D: move
- Space: start or pause
- Enter: start again after game over
- On-screen pad: touch controls for mobile and tablet

## Run Locally

```bash
npm install
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
- `components/NokiaSnakeGame.tsx`: game logic and UI
- `app/globals.css`: styling and retro theme

## Notes

This project uses Next.js with the App Router and is ready to be deployed to any standard Next.js hosting platform.
