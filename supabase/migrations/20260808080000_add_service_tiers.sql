-- Adds the boss's real service menu (tiered by scope/duration where the
-- business prices it that way) alongside the existing 10 services pulled
-- from historical quotes. "Content Usage Rights (3 months)" at RM600
-- already existed from past quotes and is left as-is pending confirmation
-- — see the accompanying chat message about the RM1,200 "Digital Rights
-- (3 months)" figure, which looks like it may be meant to replace it
-- rather than sit alongside it.

insert into products (name, unit_price) values
  ('Creative Strategy & Content Ideation (5 contents and below)', 6000),
  ('Scriptwriting & Visual Storytelling (5 min and below)', 3000),
  ('Scriptwriting & Visual Storytelling (above 5 min)', 5000),
  ('Creative Production - Photography', 1500),
  ('Creative Production - Videography', 4000),
  ('Talent Fee (per pax)', 500)
on conflict (name) do update set unit_price = excluded.unit_price;
