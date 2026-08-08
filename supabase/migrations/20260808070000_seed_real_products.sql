-- Seeds the Telegram bot's price list with the business's actual services,
-- pulled from real historical quote line items (consistent pricing across
-- every past quote for each — no guessing involved).

insert into products (name, unit_price) values
  ('Campaign Strategy & Reporting', 2000),
  ('Content Photography (per day)', 900),
  ('Content Usage Rights (3 months)', 600),
  ('Event Emcee & Coverage (per event)', 1500),
  ('Influencer Seeding Package (10 creators)', 4000),
  ('Livestream Hosting (per session)', 1800),
  ('Macro KOL Instagram Reel (1 post)', 1200),
  ('Micro KOL TikTok Video (1 video)', 450),
  ('Paid Social Boost Management', 1000),
  ('YouTube Integration (10 min segment)', 3500)
on conflict (name) do update set unit_price = excluded.unit_price;
