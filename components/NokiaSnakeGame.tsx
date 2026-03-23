"use client";

import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";

type Position = {
  x: number;
  y: number;
};

type Direction = "up" | "down" | "left" | "right";
type GameStatus = "idle" | "playing" | "paused" | "gameover";
type GameState = {
  snake: Position[];
  direction: Direction;
  food: Position;
  score: number;
};

const GRID_WIDTH = 18;
const GRID_HEIGHT = 24;
const INITIAL_SNAKE: Position[] = [
  { x: 7, y: 12 },
  { x: 6, y: 12 },
  { x: 5, y: 12 }
];
const INITIAL_DIRECTION: Direction = "right";
const INITIAL_FOOD: Position = { x: 12, y: 12 };

const OPPOSITES: Record<Direction, Direction> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left"
};

const KEY_TO_DIRECTION: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  KeyW: "up",
  KeyA: "left",
  KeyS: "down",
  KeyD: "right",
  Numpad8: "up",
  Numpad4: "left",
  Numpad5: "down",
  Numpad2: "down",
  Numpad6: "right",
  w: "up",
  a: "left",
  s: "down",
  d: "right",
  W: "up",
  A: "left",
  S: "down",
  D: "right"
};

function randomFood(snake: Position[]) {
  const taken = new Set(snake.map((segment) => `${segment.x},${segment.y}`));
  const openCells: Position[] = [];

  for (let y = 0; y < GRID_HEIGHT; y += 1) {
    for (let x = 0; x < GRID_WIDTH; x += 1) {
      if (!taken.has(`${x},${y}`)) {
        openCells.push({ x, y });
      }
    }
  }

  return openCells[Math.floor(Math.random() * openCells.length)] ?? INITIAL_FOOD;
}

function move(head: Position, direction: Direction) {
  if (direction === "up") {
    return { x: head.x, y: head.y - 1 };
  }

  if (direction === "down") {
    return { x: head.x, y: head.y + 1 };
  }

  if (direction === "left") {
    return { x: head.x - 1, y: head.y };
  }

  return { x: head.x + 1, y: head.y };
}

function wrapPosition(position: Position) {
  return {
    x: (position.x + GRID_WIDTH) % GRID_WIDTH,
    y: (position.y + GRID_HEIGHT) % GRID_HEIGHT
  };
}

function isReverse(current: Direction, next: Direction) {
  return OPPOSITES[current] === next;
}

function createInitialGame(direction: Direction = INITIAL_DIRECTION): GameState {
  return {
    snake: INITIAL_SNAKE,
    direction,
    food: INITIAL_FOOD,
    score: 0
  };
}

export function NokiaSnakeGame() {
  const [game, setGame] = useState<GameState>(() => createInitialGame());
  const [status, setStatus] = useState<GameStatus>("idle");
  const [highScore, setHighScore] = useState(0);
  const screenRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<GameState>(createInitialGame());
  const statusRef = useRef<GameStatus>("idle");
  const pendingDirectionRef = useRef<Direction | null>(null);

  const speed = Math.max(95, 190 - game.score * 6);

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    const stored = window.localStorage.getItem("potato-snake-high-score");
    if (stored) {
      setHighScore(Number.parseInt(stored, 10) || 0);
    }
    screenRef.current?.focus();
  }, []);

  useEffect(() => {
    if (game.score > highScore) {
      setHighScore(game.score);
      window.localStorage.setItem("potato-snake-high-score", String(game.score));
    }
  }, [game.score, highScore]);

  function focusScreen() {
    window.requestAnimationFrame(() => {
      screenRef.current?.focus();
    });
  }

  function applyGame(nextGame: GameState) {
    gameRef.current = nextGame;
    setGame(nextGame);
  }

  function setGameStatus(nextStatus: GameStatus) {
    statusRef.current = nextStatus;
    setStatus(nextStatus);
  }

  function resetGame(nextStatus: GameStatus = "idle", openingDirection?: Direction) {
    const nextGame = createInitialGame(openingDirection ?? INITIAL_DIRECTION);
    pendingDirectionRef.current = null;
    applyGame(nextGame);
    setGameStatus(nextStatus);
    focusScreen();
  }

  function beginGame(openingDirection?: Direction) {
    resetGame("playing", openingDirection);
  }

  function queueDirection(nextDirection: Direction) {
    const currentDirection = pendingDirectionRef.current ?? gameRef.current.direction;

    if (isReverse(currentDirection, nextDirection) || currentDirection === nextDirection) {
      return;
    }

    pendingDirectionRef.current = nextDirection;
  }

  function handleDirectionInput(nextDirection: Direction) {
    const currentStatus = statusRef.current;

    if (currentStatus === "paused") {
      return;
    }

    if (currentStatus === "idle" || currentStatus === "gameover") {
      beginGame(nextDirection);
      return;
    }

    queueDirection(nextDirection);
  }

  function readDirectionFromKey(event: Pick<KeyboardEvent, "code" | "key">) {
    return KEY_TO_DIRECTION[event.code] ?? KEY_TO_DIRECTION[event.key] ?? null;
  }

  function handleKeyboardEvent(event: Pick<KeyboardEvent, "code" | "key" | "preventDefault">) {
    const currentStatus = statusRef.current;

    if (event.code === "Space" || event.key === " ") {
      event.preventDefault();

      if (currentStatus === "idle" || currentStatus === "gameover") {
        beginGame();
        return;
      }

      if (currentStatus === "playing") {
        setGameStatus("paused");
        return;
      }

      if (currentStatus === "paused") {
        setGameStatus("playing");
        focusScreen();
      }

      return;
    }

    if (event.code === "Enter" || event.key === "Enter") {
      if (currentStatus === "idle" || currentStatus === "gameover") {
        event.preventDefault();
        beginGame();
      }
      return;
    }

    const nextDirection = readDirectionFromKey(event);

    if (!nextDirection) {
      return;
    }

    event.preventDefault();
    handleDirectionInput(nextDirection);
  }

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      handleKeyboardEvent(event);
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  useEffect(() => {
    if (status !== "playing") {
      return undefined;
    }

    const timer = window.setInterval(() => {
      const currentGame = gameRef.current;
      const activeDirection = pendingDirectionRef.current ?? currentGame.direction;
      pendingDirectionRef.current = null;

      const nextHead = wrapPosition(move(currentGame.snake[0], activeDirection));
      const grew = nextHead.x === currentGame.food.x && nextHead.y === currentGame.food.y;
      const bodyToCheck = grew ? currentGame.snake : currentGame.snake.slice(0, -1);
      const hitSelf = bodyToCheck.some(
        (segment) => segment.x === nextHead.x && segment.y === nextHead.y
      );

      if (hitSelf) {
        setGameStatus("gameover");
        return;
      }

      const updatedSnake = [nextHead, ...currentGame.snake];
      if (!grew) {
        updatedSnake.pop();
      }

      applyGame({
        snake: updatedSnake,
        direction: activeDirection,
        food: grew ? randomFood(updatedSnake) : currentGame.food,
        score: grew ? currentGame.score + 1 : currentGame.score
      });
    }, speed);

    return () => window.clearInterval(timer);
  }, [speed, status]);

  const cells = [];

  for (let y = 0; y < GRID_HEIGHT; y += 1) {
    for (let x = 0; x < GRID_WIDTH; x += 1) {
      const segmentIndex = game.snake.findIndex(
        (segment) => segment.x === x && segment.y === y
      );
      const isFood = game.food.x === x && game.food.y === y;
      const isHead = segmentIndex === 0;
      const cellClassName = [
        "game-cell",
        segmentIndex >= 0 ? "is-potato" : "",
        isHead ? "is-head" : "",
        isFood ? "is-food" : ""
      ]
        .filter(Boolean)
        .join(" ");

      cells.push(<div className={cellClassName} key={`${x}-${y}`} />);
    }
  }

  const overlayText =
    status === "idle"
      ? "Press space or tap start"
      : status === "paused"
        ? "Paused"
        : status === "gameover"
          ? "Game over"
          : "";

  return (
    <section className="nokia-stage">
      <div className="phone-frame" onPointerDown={focusScreen}>
        <div className="speaker-slot" />

        <div className="screen-wrap">
          <div className="screen-topbar">
            <span>Score {game.score.toString().padStart(2, "0")}</span>
            <span>Best {highScore.toString().padStart(2, "0")}</span>
          </div>

          <div
            aria-label="Potato Snake game board"
            className="game-screen"
            onKeyDown={(event: ReactKeyboardEvent<HTMLDivElement>) => handleKeyboardEvent(event)}
            ref={screenRef}
            role="application"
            style={
              {
                "--grid-columns": GRID_WIDTH,
                "--grid-rows": GRID_HEIGHT
              } as CSSProperties
            }
            tabIndex={0}
          >
            {cells}

            {overlayText ? (
              <div className="screen-overlay">
                <p>{overlayText}</p>
                <span>
                  {status === "gameover"
                    ? "Restart and chase a longer pixel trail."
                    : "Use the keys or the control pad."}
                </span>
              </div>
            ) : null}
          </div>

          <div className="screen-bottom">
            <span>{status === "playing" ? "Moving" : "Ready"}</span>
            <span>Night play</span>
          </div>
        </div>

        <div className="controls-panel">
          <div className="control-actions">
            <button className="action-button" onClick={() => beginGame()} type="button">
              {status === "gameover" ? "Retry" : "Start"}
            </button>
            <button
              className="action-button secondary"
              onClick={() => {
                if (statusRef.current === "playing") {
                  setGameStatus("paused");
                  return;
                }

                if (statusRef.current === "paused") {
                  setGameStatus("playing");
                  focusScreen();
                }
              }}
              type="button"
            >
              {status === "paused" ? "Play" : "Pause"}
            </button>
          </div>

          <div className="dpad" aria-label="Touch controls">
            <button
              aria-label="Move up"
              className="dpad-button up"
              onPointerDown={() => handleDirectionInput("up")}
              type="button"
            >
              ^
            </button>
            <button
              aria-label="Move left"
              className="dpad-button left"
              onPointerDown={() => handleDirectionInput("left")}
              type="button"
            >
              &lt;
            </button>
            <button
              aria-label="Move right"
              className="dpad-button right"
              onPointerDown={() => handleDirectionInput("right")}
              type="button"
            >
              &gt;
            </button>
            <button
              aria-label="Move down"
              className="dpad-button down"
              onPointerDown={() => handleDirectionInput("down")}
              type="button"
            >
              v
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

