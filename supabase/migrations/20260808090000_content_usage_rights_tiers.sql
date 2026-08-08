-- Adds the remaining Content Usage Rights duration tiers. "(3 months)"
-- already existed (updated to RM1,200 per the boss's latest pricing);
-- this adds the other three.

insert into products (name, unit_price) values
  ('Content Usage Rights (6 months)', 2200),
  ('Content Usage Rights (1 year)', 3400),
  ('Content Usage Rights (Lifetime)', 6000)
on conflict (name) do update set unit_price = excluded.unit_price;
