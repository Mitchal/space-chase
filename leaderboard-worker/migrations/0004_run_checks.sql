-- Scores are trusted when they arrive and checked afterwards: a GitHub Action replays each run with the game's own
-- simulation and sends back a verdict (src/run-check-routes.js, ../tools/run-checks/). Numbered 0004 to follow
-- 0003_name_owners.sql; the two don't depend on each other.
-- check_status: 'unchecked' (shown on the board, waiting for the Action), 'ok' (replayed and it gave that score) or
-- 'failed' (it didn't: hidden everywhere, kept with its replay as evidence until the day is deleted after 30 days).
-- Rows from before this (game 1.4.x sent no replay) count as 'ok'.
ALTER TABLE scores ADD COLUMN check_status TEXT NOT NULL DEFAULT 'ok';
ALTER TABLE scores ADD COLUMN sim_version INTEGER;  -- the game simulation the run was played in (game/core/sim-version.js)
ALTER TABLE scores ADD COLUMN replay TEXT;          -- the run's input (game/core/replay-codec.js); dropped once it checks out
ALTER TABLE scores ADD COLUMN check_note TEXT;      -- why a failed run failed ('score', 'unfinished', 'overrun', …)

CREATE INDEX IF NOT EXISTS scores_unchecked ON scores (updated_at) WHERE check_status = 'unchecked';

-- When the Worker last asked GitHub to start the check (src/check-dispatch.js), so it asks at most once a minute.
CREATE TABLE IF NOT EXISTS check_dispatch (
  id      INTEGER PRIMARY KEY CHECK (id = 1),
  last_at INTEGER NOT NULL             -- ms since 1970
);
INSERT OR IGNORE INTO check_dispatch (id, last_at) VALUES (1, 0);
