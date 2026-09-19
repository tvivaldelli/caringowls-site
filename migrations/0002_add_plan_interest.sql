-- Adds the plan-interest field captured on the Request Access form
-- (get-started.html). Run this against the existing caringowls-waitlist
-- D1 database BEFORE deploying the updated waitlist Worker, otherwise
-- the new INSERT runs against a table without the column and every
-- submission fails.
--
--   wrangler d1 execute caringowls-waitlist --remote \
--     --file=./migrations/0002_add_plan_interest.sql
--
-- Column is nullable so existing rows remain valid, and the currently
-- deployed Worker ignores it — safe to run well ahead of the push.
--
-- Values written by the Worker: 'quick-start', 'full-protection',
-- 'not-sure'. Submissions that omit the field default to 'not-sure'.

ALTER TABLE waitlist ADD COLUMN plan_interest TEXT;
