CREATE TABLE IF NOT EXISTS waitlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  caregiver_first_name TEXT NOT NULL,
  caregiver_last_name TEXT NOT NULL,
  caregiver_email TEXT NOT NULL,
  recipient_first_name TEXT NOT NULL,
  recipient_last_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  relationship TEXT NOT NULL,
  consent_checked INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
