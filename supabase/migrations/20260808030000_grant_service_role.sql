-- The service_role key bypasses RLS by design, but Postgres still enforces
-- plain table-level GRANTs underneath that. These tables were apparently
-- created without the usual Supabase provisioning step that grants
-- service_role blanket access, so every query was failing with
-- "permission denied for table quotes" (42501). This grants exactly what
-- the app's service_role client needs.

grant usage on schema public to service_role;
grant select, insert, update, delete on customers, quotes, quote_items to service_role;
grant usage, select on quote_number_seq to service_role;
