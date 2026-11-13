-- Daily reminders on the web: a browser's push address and the time of day its player asked to be reminded
-- (src/reminder-routes.js). Every five minutes the Worker sends a push to each one that's due (src/reminder-sender.js);
-- the game's service worker shows it as a notification (game/pods/daily-reminder/service-worker.js).
-- Nothing here says who the player is: just the address the browser's push service gave out, which stops working
-- when they turn notifications off (and is deleted then, on the next send).
CREATE TABLE IF NOT EXISTS reminders (
  endpoint   TEXT PRIMARY KEY,   -- the push service address (https://fcm.googleapis.com/..., web.push.apple.com, ...)
  hour       INTEGER NOT NULL,   -- local time of day to remind, in time_zone
  minute     INTEGER NOT NULL,
  time_zone  TEXT NOT NULL,      -- IANA name from the browser ('Europe/Stockholm'), so the time follows summer time
  next_at    INTEGER NOT NULL,   -- ms since 1970: when the next one is due
  fails      INTEGER NOT NULL DEFAULT 0, -- sends in a row the push service refused; deleted after a few
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS reminders_due ON reminders (next_at);
