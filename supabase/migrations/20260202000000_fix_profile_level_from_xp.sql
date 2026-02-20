-- Fix and enforce profile level based on XP points
-- Rule: every 200 XP = +1 level (0-199 => 1, 200-399 => 2, etc.)

create or replace function public.set_level_from_xp_points()
returns trigger
language plpgsql
as $$
begin
  new.level := floor(coalesce(new.xp_points, 0) / 200) + 1;
  return new;
end;
$$;

drop trigger if exists trg_set_level_from_xp_points on public.profiles;

create trigger trg_set_level_from_xp_points
before insert or update of xp_points on public.profiles
for each row
execute function public.set_level_from_xp_points();

-- Backfill existing rows
update public.profiles
set level = floor(coalesce(xp_points, 0) / 200) + 1
where level is distinct from (floor(coalesce(xp_points, 0) / 200) + 1);

