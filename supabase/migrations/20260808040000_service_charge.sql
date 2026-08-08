-- Adds a service_charge_rate column alongside the existing tax_rate, so a
-- quote can carry both a service charge % and an SST % — standard for
-- Malaysian invoicing (service charge applied to the subtotal, then SST
-- applied on top of subtotal + service charge).

alter table quotes add column if not exists service_charge_rate numeric not null default 0;
