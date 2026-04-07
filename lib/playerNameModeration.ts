const MAX_PLAYER_NAME_LENGTH = 24;

const BLOCKED_TERMS = [
  "fuck",
  "fck",
  "fuk",
  "fcker",
  "fucked",
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
  "bullshit",
  "cunt",
  "niga",
  "nigga",
  "nigger",
  "sex",
  "sexy",
  "porno",
  "porn",
  "nude",
  "boob",
  "boobs",
  "tit",
  "tits",
  "xnxx",
  "xvideos",
  "chod",
  "choda",
  "chodon",
  "chodna",
  "chuda",
  "chudi",
  "chudir",
  "chudirbhai",
  "chudirvai",
  "madarchod",
  "maderchod",
  "bhenchod",
  "behenchod",
  "bokachod",
  "bokachoda",
  "khanki",
  "khangi",
  "magi",
  "haraami",
  "harami",
  "hala",
  "halar",
  "halarput",
  "lund",
  "lawra",
  "laura",
  "voda",
  "vodai",
  "bal",
  "chinal",
  "beshya",
  "randi",
  "randi",
  "randwa",
  "mc",
  "bc",
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
  "\u09B9\u09BE\u09B2\u09BE",
  "\u09B9\u09BE\u09B2\u09BE\u09B0",
  "\u09B9\u09BE\u09B2\u09BE\u09B0\u09AA\u09C1\u09A4",
  "\u09AE\u09BE\u09A6\u09BE\u09B0\u099A\u09CB\u09A6",
  "\u09AC\u09CB\u0995\u09BE\u099A\u09CB\u09A6\u09BE",
  "\u09AC\u09CB\u0995\u09BE\u099A\u09CB\u09A6",
  "\u09B2\u09BE\u0989\u09DC\u09BE",
  "\u09AD\u09CB\u09A6\u09BE",
  "\u09AD\u09CB\u09A6\u09BE\u0987",
  "\u09AC\u09BE\u09B2",
  "\u09AC\u09C7\u09B6\u09CD\u09AF\u09BE",
  "\u09B0\u09BE\u09A8\u09CD\u09A1\u09BF"
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
    .replace(/2/g, "z")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/6/g, "g")
    .replace(/7/g, "t")
    .replace(/8/g, "b")
    .replace(/[\$]+/g, "s")
    .replace(/[\s._\-]+/g, "")
    .replace(/(.)\1{2,}/g, "$1")
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
