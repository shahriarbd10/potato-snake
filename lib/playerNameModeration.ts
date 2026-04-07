const MAX_PLAYER_NAME_LENGTH = 24;

const BLOCKED_TERMS = [
  "fuck",
  "fck",
  "fuk",
  "fcker",
  "fucker",
  "motherfucker",
  "bitch",
  "slut",
  "whore",
  "dick",
  "cock",
  "pussy",
  "asshole",
  "bastard",
  "shit",
  "cunt",
  "nigga",
  "nigger",
  "sex",
  "porno",
  "porn",
  "nude",
  "boob",
  "boobs",
  "tit",
  "tits",
  "chod",
  "choda",
  "chudi",
  "chudir",
  "chudirbhai",
  "chudirvai",
  "chuda",
  "chodon",
  "madarchod",
  "maderchod",
  "bokachoda",
  "bokachod",
  "khanki",
  "khangi",
  "magi",
  "haraami",
  "harami",
  "bhenchod",
  "behenchod",
  "lund",
  "lawra",
  "laura",
  "voda",
  "vodai",
  "chodna",
  "\u099A\u09C1\u09A6",
  "\u099A\u09C1\u09A6\u09BF",
  "\u099A\u09C1\u09A6\u09BE",
  "\u099A\u09CB\u09A6",
  "\u099A\u09CB\u09A6\u09BE",
  "\u099A\u09CB\u09A6\u09A8",
  "\u099A\u09C1\u09A6\u09C7\u09B0",
  "\u099A\u09C1\u09A6\u09BF\u09A8\u09BE",
  "\u09AE\u09BE\u0997\u09BF",
  "\u0996\u09BE\u09A8\u0995\u09BF",
  "\u0996\u09BE\u0982\u0995\u09BF",
  "\u09B9\u09BE\u09B0\u09BE\u09AE\u09BF",
  "\u09AE\u09BE\u09A6\u09BE\u09B0\u099A\u09CB\u09A6",
  "\u09AC\u09CB\u0995\u09BE\u099A\u09CB\u09A6\u09BE",
  "\u09AC\u09CB\u0995\u09BE\u099A\u09CB\u09A6",
  "\u09B2\u09BE\u0989\u09DC\u09BE",
  "\u09AD\u09CB\u09A6\u09BE",
  "\u09AD\u09CB\u09A6\u09BE\u0987",
  "\u09AC\u09BE\u09B2"
] as const;

function collapsePlayerName(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, MAX_PLAYER_NAME_LENGTH);
}

function normalizeForModeration(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[0@]/g, "o")
    .replace(/[1!|]/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t")
    .replace(/[\s._\-]+/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

function containsBlockedLanguage(value: string) {
  const normalized = normalizeForModeration(value);

  if (!normalized) {
    return false;
  }

  return BLOCKED_TERMS.some((term) => normalized.includes(term));
}

export function normalizePlayerName(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return collapsePlayerName(value);
}

export function getPlayerNameValidationError(value: unknown) {
  const normalized = normalizePlayerName(value);

  if (!normalized) {
    return "Enter a player name.";
  }

  if (containsBlockedLanguage(normalized)) {
    return "Please choose a clean player name.";
  }

  return null;
}
