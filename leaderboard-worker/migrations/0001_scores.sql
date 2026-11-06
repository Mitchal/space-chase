-- One row per player, daily challenge and day: that player's best score there.
-- name_key is the name folded to lower case, so "Anna" and "anna" are the same player.
CREATE TABLE IF NOT EXISTS scores (
  mode       TEXT    NOT NULL,           -- the daily challenge: 'flight' (points) or 'survive' (milliseconds)
  day        TEXT    NOT NULL,           -- the player's local date, YYYY-MM-DD
  name_key   TEXT    NOT NULL,
  name       TEXT    NOT NULL,           -- as the player typed it
  score      INTEGER NOT NULL,           -- higher is better in every mode
  updated_at INTEGER NOT NULL,           -- ms since 1970 when the best was set; earlier wins a tie
  PRIMARY KEY (mode, day, name_key)
);

CREATE INDEX IF NOT EXISTS scores_by_rank ON scores (mode, day, score DESC, updated_at);
