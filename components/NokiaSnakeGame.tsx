"use client";

import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";

type Position = {
  x: number;
  y: number;
};

type Direction = "up" | "down" | "left" | "right";
type GameStatus = "idle" | "playing" | "paused" | "gameover";
type SaveState = "idle" | "saving" | "saved" | "error";
type LeaderboardState = "loading" | "ready" | "error";
type GameState = {
  snake: Position[];
  direction: Direction;
  food: Position;
  score: number;
};

type LeaderboardEntry = {
  name: string;
  score: number;
};

const GRID_WIDTH = 18;
const GRID_HEIGHT = 24;
const PLAYER_NAME_KEY = "potato-snake-player-name";
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

function normalizePlayerName(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 24);
}

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

function rankLabel(rank: number) {
  if (rank === 1) {
    return "1st";
  }

  if (rank === 2) {
    return "2nd";
  }

  if (rank === 3) {
    return "3rd";
  }

  return `${rank}th`;
}

function CrownIcon({ rank }: { rank: number }) {
  return (
    <svg aria-hidden="true" className={`crown-icon rank-${rank}`} viewBox="0 0 48 32">
      <path d="M5 25 8 7l10 9 6-11 6 11 10-9 3 18Z" fill="currentColor" />
      <path d="M8 27h32" fill="none" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}

export function NokiaSnakeGame() {
  const [game, setGame] = useState<GameState>(() => createInitialGame());
  const [status, setStatus] = useState<GameStatus>("idle");
  const [highScore, setHighScore] = useState(0);
  const [playerName, setPlayerName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardState, setLeaderboardState] = useState<LeaderboardState>("loading");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastFinishedScore, setLastFinishedScore] = useState(0);
  const screenRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<GameState>(createInitialGame());
  const statusRef = useRef<GameStatus>("idle");
  const pendingDirectionRef = useRef<Direction | null>(null);
  const currentRoundRef = useRef(0);
  const lastSavedRoundRef = useRef(0);

  const speed = Math.max(95, 190 - game.score * 6);

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  async function loadLeaderboard() {
    try {
      setLeaderboardState("loading");
      const response = await fetch("/api/leaderboard", { cache: "no-store" });

      if (!response.ok) {
        throw new Error("Failed to load leaderboard");
      }

      const data = (await response.json()) as { scores?: LeaderboardEntry[] };
      setLeaderboard(data.scores ?? []);
      setLeaderboardState("ready");
    } catch {
      setLeaderboardState("error");
    }
  }

  useEffect(() => {
    const storedHighScore = window.localStorage.getItem("potato-snake-high-score");
    const storedName = window.localStorage.getItem(PLAYER_NAME_KEY) ?? "";

    if (storedHighScore) {
      setHighScore(Number.parseInt(storedHighScore, 10) || 0);
    }

    if (storedName) {
      setPlayerName(storedName);
      setNameInput(storedName);
    }

    screenRef.current?.focus();
    void loadLeaderboard();
  }, []);

  useEffect(() => {
    if (game.score > highScore) {
      setHighScore(game.score);
      window.localStorage.setItem("potato-snake-high-score", String(game.score));
    }
  }, [game.score, highScore]);

  async function submitScore(score: number, name: string) {
    try {
      setSaveState("saving");
      const response = await fetch("/api/scores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, score })
      });

      if (!response.ok) {
        throw new Error("Save failed");
      }

      setSaveState("saved");
      await loadLeaderboard();
    } catch {
      setSaveState("error");
    }
  }

  useEffect(() => {
    if (status !== "gameover" || game.score <= 0 || !playerName) {
      return;
    }

    if (lastSavedRoundRef.current === currentRoundRef.current) {
      return;
    }

    lastSavedRoundRef.current = currentRoundRef.current;
    setLastFinishedScore(game.score);
    void submitScore(game.score, playerName);
  }, [game.score, playerName, status]);

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
    if (!playerName) {
      focusScreen();
      return;
    }

    currentRoundRef.current += 1;
    setSaveState("idle");
    resetGame("playing", openingDirection);
  }

  function commitNameAndStart() {
    const nextName = normalizePlayerName(nameInput);

    if (!nextName) {
      return;
    }

    setPlayerName(nextName);
    setNameInput(nextName);
    window.localStorage.setItem(PLAYER_NAME_KEY, nextName);
    beginGame();
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

    if (!playerName || currentStatus === "paused") {
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

      if (!playerName) {
        return;
      }

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
      if (!playerName && normalizePlayerName(nameInput)) {
        event.preventDefault();
        commitNameAndStart();
        return;
      }

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
  }, [nameInput, playerName]);

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

  const normalizedName = normalizePlayerName(nameInput);
  const startDisabled = normalizedName.length === 0;

  return (
    <section className="nokia-stage">
      <div className="phone-frame" onPointerDown={focusScreen}>
        <div className="speaker-slot" />

        <div className="screen-wrap">
          <div className="screen-topbar">
            <span>Score {game.score.toString().padStart(2, "0")}</span>
            <span>{playerName ? playerName : "Guest"}</span>
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

            {status !== "playing" ? (
              <div className="screen-overlay">
                <p>
                  {status === "gameover"
                    ? "Game over"
                    : playerName
                      ? "Ready"
                      : "Enter name"}
                </p>
                <span>
                  {status === "gameover"
                    ? `Score ${lastFinishedScore}. ${saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved to leaderboard." : saveState === "error" ? "Save failed." : "Try again."}`
                    : playerName
                      ? "Press start or any direction to play."
                      : "Add your name in the menu to begin."}
                </span>
              </div>
            ) : null}
          </div>

          <div className="screen-bottom">
            <span>{status === "playing" ? "Moving" : "Waiting"}</span>
            <span>Best {highScore.toString().padStart(2, "0")}</span>
          </div>
        </div>

        <div className="controls-panel">
          <form
            className="name-form"
            onSubmit={(event) => {
              event.preventDefault();
              commitNameAndStart();
            }}
          >
            <label className="menu-label" htmlFor="player-name">
              Your name
            </label>
            <div className="name-row">
              <input
                className="name-input"
                id="player-name"
                maxLength={24}
                onChange={(event) => setNameInput(event.target.value)}
                placeholder="Player"
                value={nameInput}
              />
              <button className="action-button" disabled={startDisabled} type="submit">
                {playerName ? "Play" : "Start"}
              </button>
            </div>
          </form>

          <div className="control-actions">
            <button className="action-button secondary" onClick={() => beginGame()} type="button">
              {status === "gameover" ? "Retry" : "New run"}
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
              {status === "paused" ? "Resume" : "Pause"}
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

      <aside className="menu-panel">
        <div className="menu-header">
          <p className="menu-kicker">Hall of fame</p>
          <h2>Top 100</h2>
        </div>

        <div className="leaderboard-shell">
          {leaderboardState === "loading" ? <p className="menu-empty">Loading leaderboard...</p> : null}
          {leaderboardState === "error" ? <p className="menu-empty">Leaderboard is unavailable right now.</p> : null}
          {leaderboardState === "ready" && leaderboard.length === 0 ? (
            <p className="menu-empty">No scores yet. Be the first topper.</p>
          ) : null}

          {leaderboardState === "ready" && leaderboard.length > 0 ? (
            <ol className="leaderboard-list">
              {leaderboard.map((entry, index) => {
                const rank = index + 1;
                const isTopThree = rank <= 3;

                return (
                  <li className={`leaderboard-item ${isTopThree ? `top-${rank}` : ""}`} key={`${entry.name}-${rank}`}>
                    <div className="leaderboard-rank">
                      {isTopThree ? (
                        <>
                          <CrownIcon rank={rank} />
                          <span className={`rank-tag rank-${rank}`}>{rankLabel(rank)}</span>
                        </>
                      ) : (
                        <span className="rank-number">{rank.toString().padStart(2, "0")}</span>
                      )}
                    </div>
                    <span className="leaderboard-name">{entry.name}</span>
                    <span className="leaderboard-score">{entry.score}</span>
                  </li>
                );
              })}
            </ol>
          ) : null}
        </div>
      </aside>
    </section>
  );
}
