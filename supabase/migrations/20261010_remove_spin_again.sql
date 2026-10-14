-- Retire this outcome without removing past spin history.
update public.wheel_outcomes
set active = false
where type = 'loss'
  and prize_id is null
  and lower(trim(label)) = 'spin again';
