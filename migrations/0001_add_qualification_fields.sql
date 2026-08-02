-- Adds the Care Recipient qualification fields captured on the
-- Request Access form (get-started.html). Run this against the
-- existing caringowls-waitlist D1 database BEFORE deploying the
-- updated waitlist Worker, otherwise INSERTs will fail on the
-- new columns.
--
--   wrangler d1 execute caringowls-waitlist --remote \
--     --file=./migrations/0001_add_qualification_fields.sql
--
-- Columns are nullable so existing rows remain valid.

ALTER TABLE waitlist ADD COLUMN recipient_uses_iphone TEXT;
ALTER TABLE waitlist ADD COLUMN recipient_texts_messages TEXT;
ALTER TABLE waitlist ADD COLUMN recipient_journey_stage TEXT;
ALTER TABLE waitlist ADD COLUMN caregiver_proximity TEXT;
