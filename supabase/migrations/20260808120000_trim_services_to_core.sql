-- Trims the Telegram bot's Part 1 - Services down to the core creative
-- pipeline the boss wants to focus on: content ideation, scriptwriting,
-- and production. Removes influencer/KOL/event/social-management services
-- that don't fit that focus. Part 2 - Usage Rights is untouched.
--
-- telegram_orders.product_name is a plain text snapshot (no foreign key
-- to products), so this doesn't affect any historical order record.

delete from products where name in (
  'Campaign Strategy & Reporting',
  'Content Photography (per day)',
  'Event Emcee & Coverage (per event)',
  'Influencer Seeding Package (10 creators)',
  'Livestream Hosting (per session)',
  'Macro KOL Instagram Reel (1 post)',
  'Micro KOL TikTok Video (1 video)',
  'Paid Social Boost Management',
  'Talent Fee (per pax)',
  'YouTube Integration (10 min segment)'
);
