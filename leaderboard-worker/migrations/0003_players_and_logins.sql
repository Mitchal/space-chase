-- Accounts (2026-11): you log in with your email and a one-time code sent to it, and your scores belong to your account.
-- Email addresses are never stored: only their email key, an HMAC-SHA256 with a secret pepper (src/auth/email-key.js).
--
-- players: everyone on the boards. A player with an email key is an account. A player without one is a name typed before
-- accounts existed (filled in by 0004 from the old tables): those rows stay readable on the calendar under that name,
-- but nobody can log in as them or post as them again.
CREATE TABLE IF NOT EXISTS players (
  id         INTEGER PRIMARY KEY AUTOINCREMENT, -- never reused: ids are public (boards, /trophies) and cached by the game
  email_key  TEXT UNIQUE,               -- accounts: HMAC of the address (hex); NULL for names from before accounts
  name       TEXT,                      -- shown on the boards (not unique); NULL until a new account picks one
  legacy_key TEXT UNIQUE,               -- names from before accounts: the old name_key (lower-cased name); else NULL
  created_at INTEGER NOT NULL           -- ms since 1970
);

-- The code a login is waiting for, one per email (by its key). Only its hash is kept. It also counts how many codes the
-- email was sent this hour, so nobody can flood an inbox (src/auth/login-codes-db.js).
CREATE TABLE IF NOT EXISTS login_codes (
  email_key    TEXT    PRIMARY KEY,     -- as in players
  code_hash    TEXT    NOT NULL,        -- SHA-256 of "email_key:code", hex
  expires_at   INTEGER NOT NULL,        -- ms since 1970; 10 minutes after it was sent
  attempts     INTEGER NOT NULL,        -- tries at this code so far; at 5 a new code is needed
  window_start INTEGER NOT NULL,        -- when this hour's count of sent codes started
  sends        INTEGER NOT NULL         -- codes sent since window_start
);

-- Who is logged in. The game keeps the token; only its hash is kept here. A session lasts 30 days from login.
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT    PRIMARY KEY,       -- SHA-256 of the token, hex
  player_id  INTEGER NOT NULL REFERENCES players (id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL           -- ms since 1970
);

CREATE INDEX IF NOT EXISTS sessions_by_player ON sessions (player_id);
