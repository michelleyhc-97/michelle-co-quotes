-- quote_number had no default (it was set manually for the seed rows), so
-- every insert from the app needs to supply one itself, or fail. This adds
-- a sequence-backed default, continuing from the existing max (Q-2026-014)
-- so numbering stays sequential without gaps or collisions.

create sequence if not exists quote_number_seq;
select setval('quote_number_seq', 14);

alter table quotes alter column quote_number set default (
  'Q-' || extract(year from now())::int::text || '-' ||
  lpad(nextval('quote_number_seq')::text, 3, '0')
);
