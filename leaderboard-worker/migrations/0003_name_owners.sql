-- Which device owns each name on the board. The first device to post a score with a name claims it; after that, only
-- that device can post with it or rename away from it (src/name-owners.js). Names already on the board before this
-- table existed are unclaimed until someone posts with them.
-- To free a name by hand (someone lost their phone): DELETE FROM name_owners WHERE name_key = 'anna' (README).
CREATE TABLE IF NOT EXISTS name_owners (
  name_key   TEXT    PRIMARY KEY,        -- the name folded to lower case, as in scores and podium
  owner      TEXT    NOT NULL,           -- SHA-256 (hex) of the device's secret key; the key itself is never stored
  claimed_at INTEGER NOT NULL            -- ms since 1970
);
