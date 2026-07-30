-- Dame Coffee OS Phase 4E
-- Lowers the qualifying referral purchase from $10 to $5.
-- Run after supabase-phase4d-reward-policy-tuning.sql.

do $migration$
declare
  function_definition text;
begin
  select pg_get_functiondef(
    'private.record_dame_square_event(uuid,text,text,integer,integer,text,integer,text)'::regprocedure
  )
  into function_definition;

  function_definition := replace(
    function_definition,
    'p_amount_cents >= 1000',
    'p_amount_cents >= 500'
  );

  function_definition := replace(
    function_definition,
    '), 0) < 1000',
    '), 0) < 500'
  );

  execute function_definition;
end;
$migration$;
