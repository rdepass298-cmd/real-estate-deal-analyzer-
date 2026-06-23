-- Create profile rows automatically for new auth users and backfill missing rows.

begin;

create or replace function public.handle_new_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, is_paid)
  values (new.id, new.email, false)
  on conflict (id)
  do update set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;

create trigger on_auth_user_created_profile
after insert on auth.users
for each row
execute function public.handle_new_auth_user_profile();

insert into public.profiles (id, email, is_paid)
select u.id, u.email, false
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

commit;
