-- Splits the bot's catalog into two categories so the button-driven
-- ordering flow can ask "Services or Usage Rights?" before listing items.

alter table products add column if not exists category text not null default 'service'
  check (category in ('service', 'rights'));

update products set category = 'rights' where name ilike 'Content Usage Rights%';
