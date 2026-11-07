-- Each closed day's top five per daily challenge, kept for good (the scores table forgets after 30 days).
-- The game's calendar shows these; places 1 to 3 are a player's gold, silver and bronze trophies.
-- Filled once an hour by src/podium-db.js archiveClosedDays, once a day has stopped taking scores (src/day-close.js).
CREATE TABLE IF NOT EXISTS podium (
  mode     TEXT    NOT NULL,           -- the daily challenge, as in scores
  day      TEXT    NOT NULL,           -- YYYY-MM-DD, as in scores
  place    INTEGER NOT NULL,           -- 1 to 5
  name_key TEXT    NOT NULL,           -- the name folded to lower case: whose trophy it is
  name     TEXT    NOT NULL,           -- as the player typed it that day
  score    INTEGER NOT NULL,
  PRIMARY KEY (mode, day, place)
);

CREATE INDEX IF NOT EXISTS podium_by_player ON podium (name_key, day);
