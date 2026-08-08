-- Additive changes on top of the existing hand-built schema (discovered to
-- already contain real seed data — see README) to support the app's
-- "Amendment Requested" quote status and customer-amendment-request flow.
-- Nothing here drops or renames anything.

alter table quotes drop constraint if exists quotes_status_check;
alter table quotes add constraint quotes_status_check
  check (status in ('Draft', 'Sent', 'Accepted', 'Rejected', 'Amendment Requested'));

alter table quotes add column if not exists amendment_reason text;
alter table quotes add column if not exists amendment_requested_at date;
