"use client";

import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { getPlayerNameValidationError, normalizePlayerName } from "@/lib/playerNameModeration";

type Position = {
  x: number;
  y: number;
};

type Direction = "up" | "down" | "left" | "right";
type GameStatus = "idle" | "playing" | "paused" | "gameover";
type SaveState = "idle" | "saving" | "saved" | "error";
type LeaderboardState = "loading" | "ready" | "error";
type PanelView = "menu" | "leaderboard";
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

type SwipePoint = {
  x: number;
  y: number;
};

const GRID_WIDTH = 18;
const GRID_HEIGHT = 24;
const PLAYER_NAME_KEY = "potato-snake-player-name";
const PLAYER_ID_KEY = "potato-snake-player-id";
const SWIPE_GUIDE_DISMISSED_KEY = "potato-snake-swipe-guide-dismissed";
const LEADERBOARD_PREVIEW_COUNT = 10;
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

function createPlayerId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `player-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
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

function getSwipeDirection(start: SwipePoint, end: SwipePoint) {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);
  const minimumSwipeDistance = 24;

  if (Math.max(absX, absY) < minimumSwipeDistance) {
    return null;
  }

  if (absX > absY) {
    return deltaX > 0 ? "right" : "left";
  }

  return deltaY > 0 ? "down" : "up";
}

function CrownIcon({ rank }: { rank: number }) {
  return (
    <svg aria-hidden="true" className={`crown-icon rank-${rank}`} viewBox="0 0 48 32">
      <path d="M5 25 8 7l10 9 6-11 6 11 10-9 3 18Z" fill="currentColor" />
      <path d="M8 27h32" fill="none" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}

function DpadArrowIcon({ direction }: { direction: Direction }) {
  const rotation =
    direction === "up"
      ? "rotate(0 12 12)"
      : direction === "right"
        ? "rotate(90 12 12)"
        : direction === "down"
          ? "rotate(180 12 12)"
          : "rotate(270 12 12)";

  return (
    <svg aria-hidden="true" className="dpad-arrow-icon" viewBox="0 0 24 24">
      <g transform={rotation}>
        <path d="M12 4v14" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.75" />
        <path
          d="M7.5 9.5 12 4l4.5 5.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.75"
        />
      </g>
    </svg>
  );
}

export function NokiaSnakeGame() {
  const [game, setGame] = useState<GameState>(() => createInitialGame());
  const [status, setStatus] = useState<GameStatus>("idle");
  const [panelView, setPanelView] = useState<PanelView>("menu");
  const [isNaming, setIsNaming] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [playerName, setPlayerName] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardState, setLeaderboardState] = useState<LeaderboardState>("loading");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastFinishedScore, setLastFinishedScore] = useState(0);
  const [showFullLeaderboard, setShowFullLeaderboard] = useState(false);
  const [showRunMenu, setShowRunMenu] = useState(false);
  const [showSwipeGuide, setShowSwipeGuide] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [nameError, setNameError] = useState("");
  const screenRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const gameRef = useRef<GameState>(createInitialGame());
  const statusRef = useRef<GameStatus>("idle");
  const pendingDirectionRef = useRef<Direction | null>(null);
  const currentRoundRef = useRef(0);
  const lastSavedRoundRef = useRef(0);
  const swipeStartRef = useRef<SwipePoint | null>(null);
  const swipePointerIdRef = useRef<number | null>(null);

  const speed = Math.max(95, 190 - game.score * 6);

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    if (isNaming) {
      window.requestAnimationFrame(() => {
        nameInputRef.current?.focus();
        nameInputRef.current?.select();
      });
    }
  }, [isNaming]);

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
    let storedPlayerId = window.localStorage.getItem(PLAYER_ID_KEY) ?? "";
    const supportsTouch =
      window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
    const swipeGuideDismissed =
      window.localStorage.getItem(SWIPE_GUIDE_DISMISSED_KEY) === "1";

    if (storedHighScore) {
      setHighScore(Number.parseInt(storedHighScore, 10) || 0);
    }

    if (!storedPlayerId) {
      storedPlayerId = createPlayerId();
      window.localStorage.setItem(PLAYER_ID_KEY, storedPlayerId);
    }

    setPlayerId(storedPlayerId);
    setIsTouchDevice(supportsTouch);
    setShowSwipeGuide(supportsTouch && !swipeGuideDismissed);

    if (storedName && !getPlayerNameValidationError(storedName)) {
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

  async function submitScore(score: number, name: string, nextPlayerId: string) {
    try {
      setSaveState("saving");
      const response = await fetch("/api/scores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ playerId: nextPlayerId, name, score })
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
    if (status !== "gameover" || game.score <= 0 || !playerName || !playerId) {
      return;
    }

    if (lastSavedRoundRef.current === currentRoundRef.current) {
      return;
    }

    lastSavedRoundRef.current = currentRoundRef.current;
    setLastFinishedScore(game.score);
    void submitScore(game.score, playerName, playerId);
  }, [game.score, playerId, playerName, status]);

  function focusScreen() {
    window.requestAnimationFrame(() => {
      screenRef.current?.focus();
    });
  }

  function openLeaderboard() {
    setShowRunMenu(false);
    setShowSwipeGuide(false);
    setPanelView("leaderboard");
    setShowFullLeaderboard(false);
    void loadLeaderboard();
    focusScreen();
  }

  function closeLeaderboard() {
    setPanelView("menu");
    setShowRunMenu(false);
    focusScreen();
  }

  function dismissSwipeGuide() {
    setShowSwipeGuide(false);
    window.localStorage.setItem(SWIPE_GUIDE_DISMISSED_KEY, "1");
    focusScreen();
  }

  function openNamePrompt() {
    setShowRunMenu(false);
    setShowSwipeGuide(false);
    setNameError("");
    setIsNaming(true);
    setPanelView("menu");
    focusScreen();
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
      openNamePrompt();
      return;
    }

    currentRoundRef.current += 1;
    setSaveState("idle");
    setShowRunMenu(false);
    setShowSwipeGuide(false);
    setPanelView("menu");
    setIsNaming(false);
    resetGame("playing", openingDirection);
  }

  function commitNameAndStart() {
    const nextName = normalizePlayerName(nameInput);
    const nextNameError = getPlayerNameValidationError(nextName);

    if (nextNameError) {
      setNameError(nextNameError);
      return;
    }

    let nextPlayerId = playerId;

    if (!nextPlayerId) {
      nextPlayerId = createPlayerId();
      setPlayerId(nextPlayerId);
      window.localStorage.setItem(PLAYER_ID_KEY, nextPlayerId);
    }

    setNameError("");
    setPlayerName(nextName);
    setNameInput(nextName);
    window.localStorage.setItem(PLAYER_NAME_KEY, nextName);
    currentRoundRef.current += 1;
    setSaveState("idle");
    setShowRunMenu(false);
    setShowSwipeGuide(false);
    setPanelView("menu");
    setIsNaming(false);
    resetGame("playing");
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

    if (!playerName || isNaming || showRunMenu || panelView === "leaderboard" || currentStatus === "paused") {
      return;
    }

    if (currentStatus === "idle" || currentStatus === "gameover") {
      beginGame(nextDirection);
      return;
    }

    queueDirection(nextDirection);
  }

  function handleSwipeStart(pointerId: number, point: SwipePoint) {
    swipePointerIdRef.current = pointerId;
    swipeStartRef.current = point;
  }

  function handleSwipeEnd(pointerId: number, point: SwipePoint) {
    if (swipePointerIdRef.current !== pointerId || !swipeStartRef.current) {
      return;
    }

    const swipeDirection = getSwipeDirection(swipeStartRef.current, point);
    swipePointerIdRef.current = null;
    swipeStartRef.current = null;

    if (swipeDirection) {
      handleDirectionInput(swipeDirection);
    }
  }

  function cancelSwipe(pointerId?: number) {
    if (pointerId !== undefined && swipePointerIdRef.current !== pointerId) {
      return;
    }

    swipePointerIdRef.current = null;
    swipeStartRef.current = null;
  }

  function readDirectionFromKey(event: Pick<KeyboardEvent, "code" | "key">) {
    return KEY_TO_DIRECTION[event.code] ?? KEY_TO_DIRECTION[event.key] ?? null;
  }

  function isTypingTarget(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    const tagName = target.tagName;
    return (
      tagName === "INPUT" ||
      tagName === "TEXTAREA" ||
      tagName === "SELECT" ||
      target.isContentEditable
    );
  }

  function handleKeyboardEvent(
    event: Pick<KeyboardEvent, "code" | "key" | "preventDefault" | "target">
  ) {
    if (isTypingTarget(event.target)) {
      return;
    }

    const currentStatus = statusRef.current;

    if (event.code === "Space" || event.key === " ") {
      event.preventDefault();

      if (panelView === "leaderboard") {
        closeLeaderboard();
        return;
      }

      if (!playerName) {
        openNamePrompt();
        return;
      }

      if (currentStatus === "idle" || currentStatus === "gameover") {
        beginGame();
        return;
      }

      if (currentStatus === "playing") {
        setShowRunMenu(false);
        setGameStatus("paused");
        return;
      }

      if (currentStatus === "paused") {
        setShowRunMenu(false);
        setGameStatus("playing");
        focusScreen();
      }

      return;
    }

    if (event.code === "Escape" || event.key === "Escape") {
      if (panelView === "leaderboard") {
        event.preventDefault();
        closeLeaderboard();
      }
      return;
    }

    if (event.code === "Enter" || event.key === "Enter") {
      if (isNaming && normalizePlayerName(nameInput)) {
        event.preventDefault();
        commitNameAndStart();
        return;
      }

      if (panelView === "leaderboard") {
        event.preventDefault();
        closeLeaderboard();
        return;
      }

      if (playerName && (currentStatus === "idle" || currentStatus === "gameover")) {
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
  }, [isNaming, nameInput, panelView, playerName, showRunMenu]);

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
        setShowRunMenu(false);
        setGameStatus("gameover");
        setPanelView("menu");
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
  const startDisabled = getPlayerNameValidationError(normalizedName) !== null;
  const overlayTitle =
    status === "gameover"
      ? "Game over"
      : status === "paused"
        ? "Paused"
        : status === "idle"
          ? "Potato Snake"
          : "";
  const overlayBody =
    status === "gameover"
      ? `Score ${lastFinishedScore}. ${saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved to leaderboard." : saveState === "error" ? "Save failed." : "Try again."}`
      : status === "paused"
        ? "Press resume or space to continue."
        : playerName
          ? "Press Start Game to play or open the leaderboard."
          : "Choose Start Game to enter your name.";
  const displayedLeaderboard = showFullLeaderboard
    ? leaderboard
    : leaderboard.slice(0, LEADERBOARD_PREVIEW_COUNT);
  const showStatusOverlay =
    status !== "playing" && !isNaming && panelView !== "leaderboard" && !showRunMenu && !showSwipeGuide;
  const inRunMode = status === "playing" || status === "paused";

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
            onPointerCancel={(event) => {
              if (event.pointerType === "touch") {
                cancelSwipe(event.pointerId);
              }
            }}
            onPointerDown={(event) => {
              if (event.pointerType === "touch") {
                handleSwipeStart(event.pointerId, { x: event.clientX, y: event.clientY });
              }
            }}
            onPointerUp={(event) => {
              if (event.pointerType === "touch") {
                handleSwipeEnd(event.pointerId, { x: event.clientX, y: event.clientY });
              }
            }}
            ref={screenRef}
            role="application"
            style={
              {
                "--grid-columns": GRID_WIDTH,
                "--grid-rows": GRID_HEIGHT,
                touchAction: panelView === "leaderboard" ? "pan-y" : "none"
              } as CSSProperties
            }
            tabIndex={0}
          >
            {cells}

            {showStatusOverlay ? (
              <div className="screen-overlay">
                <p>{overlayTitle}</p>
                <span>{overlayBody}</span>
              </div>
            ) : null}

            {showSwipeGuide && isTouchDevice ? (
              <div className="display-overlay" onPointerDown={(event) => event.stopPropagation()}>
                <div className="display-card swipe-guide-card">
                  <p className="name-card-kicker">Mobile tip</p>
                  <h3>Swipe to move</h3>
                  <p className="menu-copy swipe-guide-copy">
                    Swipe on the game screen to steer the snake. Right, left, up, and down all work.
                  </p>
                  <div className="control-actions swipe-guide-actions">
                    <button className="action-button" onClick={dismissSwipeGuide} type="button">
                      Got it
                    </button>
                  </div>
                </div>
              </div>
            ) : null}


            {showRunMenu ? (
              <div className="display-overlay" onPointerDown={(event) => event.stopPropagation()}>
                <div className="display-card run-menu-card">
                  <div className="display-card-top run-menu-head">
                    <div className="run-menu-title">
                      <p className="name-card-kicker">Run menu</p>
                      <h3>Options</h3>
                    </div>
                    <button
                      className="action-button secondary mini"
                      onClick={() => {
                        setShowRunMenu(false);
                        focusScreen();
                      }}
                      type="button"
                    >
                      Close
                    </button>
                  </div>

                  <div className="control-actions two-wide run-menu-actions">
                    <button
                      className="action-button secondary"
                      onClick={() => {
                        setShowRunMenu(false);
                        openLeaderboard();
                      }}
                      type="button"
                    >
                      Leaderboard
                    </button>
                    <button
                      className="action-button secondary"
                      onClick={() => {
                        window.location.assign("/");
                      }}
                      type="button"
                    >
                      Back to Home
                    </button>
                    <button
                      className="action-button secondary"
                      onClick={() => {
                        if (statusRef.current === "playing") {
                          setGameStatus("paused");
                        } else if (statusRef.current === "paused") {
                          setGameStatus("playing");
                          focusScreen();
                        }
                        setShowRunMenu(false);
                      }}
                      type="button"
                    >
                      {status === "paused" ? "Resume" : "Pause"}
                    </button>
                    <button
                      className="action-button secondary"
                      onClick={() => {
                        setShowRunMenu(false);
                        focusScreen();
                      }}
                      type="button"
                    >
                      Back
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {panelView === "leaderboard" ? (
              <div className="display-overlay" onPointerDown={(event) => event.stopPropagation()}>
                <div className="display-card leaderboard-display">
                  <div className="display-card-top">
                    <div>
                      <p className="name-card-kicker">Hall of fame</p>
                      <h3>{showFullLeaderboard ? "Full List" : "Top 10"}</h3>
                    </div>
                    <button className="action-button secondary mini" onClick={closeLeaderboard} type="button">
                      Back
                    </button>
                  </div>

                  <div className="leaderboard-shell in-display">
                    {leaderboardState === "loading" ? <p className="menu-empty in-display">Loading leaderboard...</p> : null}
                    {leaderboardState === "error" ? <p className="menu-empty in-display">Leaderboard is unavailable right now.</p> : null}
                    {leaderboardState === "ready" && leaderboard.length === 0 ? (
                      <p className="menu-empty in-display">No scores yet. Be the first topper.</p>
                    ) : null}

                    {leaderboardState === "ready" && leaderboard.length > 0 ? (
                      <>
                        <ol
                          className={`leaderboard-list in-display ${showFullLeaderboard ? "is-full" : "is-preview"}`}
                        >
                          {displayedLeaderboard.map((entry, index) => {
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

                        {leaderboard.length > LEADERBOARD_PREVIEW_COUNT ? (
                          <div className="leaderboard-footer">
                            <button
                              className="action-button secondary"
                              onClick={() => setShowFullLeaderboard((current) => !current)}
                              type="button"
                            >
                              {showFullLeaderboard ? "Back to Top 10" : "View Full List"}
                            </button>
                          </div>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            {isNaming ? (
              <div className="name-overlay" onPointerDown={(event) => event.stopPropagation()}>
                <form
                  className="name-card"
                  onSubmit={(event) => {
                    event.preventDefault();
                    commitNameAndStart();
                  }}
                >
                  <p className="name-card-kicker">Player entry</p>
                  <h3>Enter name</h3>
                  <input
                    className="name-input"
                    maxLength={24}
                    onChange={(event) => {
                      setNameInput(event.target.value);
                      if (nameError) {
                        setNameError("");
                      }
                    }}
                    onKeyDown={(event) => event.stopPropagation()}
                    placeholder="Player"
                    ref={nameInputRef}
                    value={nameInput}
                  />
                  {nameError ? <p className="name-error">{nameError}</p> : null}
                  <div className="name-card-actions">
                    <button className="action-button" disabled={startDisabled} type="submit">
                      Begin Run
                    </button>
                    <button className="action-button secondary" onClick={() => setIsNaming(false)} type="button">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : null}
          </div>

          <div className="screen-bottom">
            <span>{status === "playing" ? "Moving" : panelView === "leaderboard" ? "Records" : "Waiting"}</span>
            <div className="screen-bottom-right">
              <span>Best {highScore.toString().padStart(2, "0")}</span>
              {inRunMode ? (
                <button
                  aria-label="Open menu"
                  className="screen-menu-button"
                  onClick={() => {
                    if (panelView === "leaderboard") {
                      closeLeaderboard();
                      return;
                    }

                    setShowRunMenu((current) => {
                      const next = !current;
                      if (next && statusRef.current === "playing") {
                        setGameStatus("paused");
                      }
                      return next;
                    });
                    focusScreen();
                  }}
                  type="button"
                >
                  <span aria-hidden="true" className="menu-icon">
                    <span />
                    <span />
                    <span />
                  </span>
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="controls-panel">
          {inRunMode ? null : (
            <>
              <div className="control-actions two-wide">
                <button className="action-button" onClick={() => beginGame()} type="button">
                  Start Game
                </button>
                <button className="action-button secondary" onClick={openLeaderboard} type="button">
                  Leaderboard
                </button>
              </div>

              <div className="control-actions two-wide">
                <button className="action-button secondary" onClick={() => beginGame()} type="button">
                  {status === "gameover" ? "Retry" : "Quick Start"}
                </button>
                <button
                  className="action-button secondary"
                  onClick={() => {
                    if (panelView === "leaderboard") {
                      closeLeaderboard();
                      return;
                    }

                    if (statusRef.current === "paused") {
                      setGameStatus("playing");
                      focusScreen();
                    }
                  }}
                  type="button"
                >
                  {panelView === "leaderboard" ? "Close" : "Resume"}
                </button>
              </div>
            </>
          )}

          <div className="dpad" aria-label="Touch controls">
            <button
              aria-label="Move up"
              className="dpad-button up"
              onPointerDown={() => handleDirectionInput("up")}
              type="button"
            >
              <DpadArrowIcon direction="up" />
            </button>
            {inRunMode ? (
              <button
                aria-label={status === "paused" ? "Resume game" : "Pause game"}
                className="dpad-button center"
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => {
                  if (statusRef.current === "playing") {
                    setGameStatus("paused");
                    setShowRunMenu(false);
                    return;
                  }

                  if (statusRef.current === "paused") {
                    setGameStatus("playing");
                    setShowRunMenu(false);
                    focusScreen();
                  }
                }}
                type="button"
              >
                {status === "paused" ? ">" : "||"}
              </button>
            ) : null}
            <button
              aria-label="Move left"
              className="dpad-button left"
              onPointerDown={() => handleDirectionInput("left")}
              type="button"
            >
              <DpadArrowIcon direction="left" />
            </button>
            <button
              aria-label="Move right"
              className="dpad-button right"
              onPointerDown={() => handleDirectionInput("right")}
              type="button"
            >
              <DpadArrowIcon direction="right" />
            </button>
            <button
              aria-label="Move down"
              className="dpad-button down"
              onPointerDown={() => handleDirectionInput("down")}
              type="button"
            >
              <DpadArrowIcon direction="down" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
