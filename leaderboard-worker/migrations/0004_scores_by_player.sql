-- Scores and the kept top fives now belong to a player (0003) instead of a typed name, and the boards show the
-- player's current name. Every name typed before accounts becomes a player without an email, so its rows stay where
-- they are, under that name (the latest spelling it was typed with), and nobody can post as it again.
-- Back up first (README, "Moving the live database to accounts"): this rebuilds both tables.

-- Every name from before, once, with its latest spelling.
INSERT INTO players (name, legacy_key, created_at)
SELECT name, name_key, CAST(strftime('%s', 'now') AS INTEGER) * 1000 FROM (
  SELECT name_key, name, ROW_NUMBER() OVER (PARTITION BY name_key ORDER BY day DESC, at DESC) AS newest FROM (
    SELECT name_key, name, day, updated_at AS at FROM scores
    UNION ALL SELECT name_key, name, day, 0 AS at FROM podium))
WHERE newest = 1;

ALTER TABLE scores RENAME TO scores_before_accounts;
ALTER TABLE podium RENAME TO podium_before_accounts;
DROP INDEX IF EXISTS scores_by_rank;
DROP INDEX IF EXISTS podium_by_player;

-- One row per player, daily challenge and day: that player's best score there.
CREATE TABLE scores (
  mode       TEXT    NOT NULL,           -- the daily challenge: 'flight' (points) or 'survive' (milliseconds)
  day        TEXT    NOT NULL,           -- the game's day (midnight in Sweden), YYYY-MM-DD
  player_id  INTEGER NOT NULL REFERENCES players (id) ON DELETE CASCADE,
  score      INTEGER NOT NULL,           -- higher is better in every mode
  updated_at INTEGER NOT NULL,           -- ms since 1970 when the best was set; earlier wins a tie
  PRIMARY KEY (mode, day, player_id)
);
CREATE INDEX scores_by_rank ON scores (mode, day, score DESC, updated_at);
CREATE INDEX scores_by_player ON scores (player_id);

-- Each closed day's top five per daily challenge, kept for good. A deleted account's places stay, without a player
-- (player_id NULL), so nobody else's place or trophy changes.
CREATE TABLE podium (
  mode      TEXT    NOT NULL,
  day       TEXT    NOT NULL,
  place     INTEGER NOT NULL,            -- 1 to 5; 1 to 3 are trophies
  player_id INTEGER REFERENCES players (id) ON DELETE SET NULL,
  score     INTEGER NOT NULL,
  PRIMARY KEY (mode, day, place)
);
CREATE INDEX podium_by_player ON podium (player_id, day);

INSERT INTO scores (mode, day, player_id, score, updated_at)
SELECT s.mode, s.day, p.id, s.score, s.updated_at FROM scores_before_accounts s JOIN players p ON p.legacy_key = s.name_key;

INSERT INTO podium (mode, day, place, player_id, score)
SELECT k.mode, k.day, k.place, p.id, k.score FROM podium_before_accounts k JOIN players p ON p.legacy_key = k.name_key;

DROP TABLE scores_before_accounts;
DROP TABLE podium_before_accounts;
