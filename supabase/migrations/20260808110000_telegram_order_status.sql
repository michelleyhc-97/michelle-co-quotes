-- Gives each Telegram order a status the boss can move through a real
-- fulfillment pipeline, instead of it just being a passive log.

alter table telegram_orders add column if not exists status text not null default 'Pending Review'
  check (status in (
    'Pending Review',
    'Pending Approval',
    'Pending Payment',
    'Pending Content Creation',
    'Processed',
    'Cancelled'
  ));
