-- Y VAA — Phase 3: quizzes, questions, attempts, answers + RLS + RPCs
-- Run in Supabase Dashboard → SQL (after setup.sql / profiles exist).

-- ---------- Tables ----------
create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  time_limit_seconds int not null check (time_limit_seconds > 0 and time_limit_seconds <= 86400),
  room_code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  question_type text not null check (question_type in ('mcq', 'text')),
  question_text text not null,
  options jsonb,
  correct_index int,
  order_index int not null default 0
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  unique (quiz_id, student_id)
);

create table if not exists public.attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  answer_text text,
  selected_index int,
  unique (attempt_id, question_id)
);

create index if not exists idx_questions_quiz_id on public.questions (quiz_id);
create index if not exists idx_quiz_attempts_student on public.quiz_attempts (student_id);
create index if not exists idx_quiz_attempts_quiz on public.quiz_attempts (quiz_id);
create index if not exists idx_attempt_answers_attempt on public.attempt_answers (attempt_id);

-- ---------- RPC: student joins by room code (creates attempt) ----------
create or replace function public.join_quiz_by_room_code(p_room_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quiz public.quizzes;
  v_uid uuid;
  v_role text;
  v_attempt_id uuid;
  v_started timestamptz;
  v_submitted timestamptz;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select role into v_role from public.profiles where id = v_uid;
  if v_role is null or v_role <> 'student' then
    raise exception 'Only students can join a room';
  end if;

  select * into v_quiz
  from public.quizzes
  where upper(trim(room_code)) = upper(trim(p_room_code))
  limit 1;

  if v_quiz.id is null then
    raise exception 'Invalid room code';
  end if;

  select id, started_at, submitted_at into v_attempt_id, v_started, v_submitted
  from public.quiz_attempts
  where quiz_id = v_quiz.id and student_id = v_uid;

  if v_attempt_id is not null and v_submitted is not null then
    raise exception 'You already submitted this quiz';
  end if;

  if v_attempt_id is null then
    insert into public.quiz_attempts (quiz_id, student_id)
    values (v_quiz.id, v_uid)
    returning id, started_at into v_attempt_id, v_started;
  end if;

  return jsonb_build_object(
    'quiz_id', v_quiz.id,
    'attempt_id', v_attempt_id,
    'title', v_quiz.title,
    'time_limit_seconds', v_quiz.time_limit_seconds,
    'started_at', v_started,
    'server_now', now()
  );
end;
$$;

-- ---------- RPC: questions for a student attempt (hides correct_index) ----------
create or replace function public.get_questions_for_student_attempt(p_attempt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_quiz_id uuid;
  v_submitted timestamptz;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select quiz_id, submitted_at into v_quiz_id, v_submitted
  from public.quiz_attempts
  where id = p_attempt_id and student_id = v_uid;

  if v_quiz_id is null then
    raise exception 'Attempt not found';
  end if;

  if v_submitted is not null then
    raise exception 'Already submitted';
  end if;

  return coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', q.id,
          'question_type', q.question_type,
          'question_text', q.question_text,
          'options', q.options,
          'order_index', q.order_index
        ) order by q.order_index, q.id
      )
      from public.questions q
      where q.quiz_id = v_quiz_id
    ),
    '[]'::jsonb
  );
end;
$$;

-- ---------- RPC: submit answers + lock attempt (checks time limit) ----------
create or replace function public.submit_quiz_attempt(p_attempt_id uuid, p_answers jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt public.quiz_attempts;
  v_quiz public.quizzes;
  v_elapsed numeric;
  v_uid uuid;
  v_item jsonb;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_attempt from public.quiz_attempts where id = p_attempt_id for update;
  if v_attempt.id is null then
    raise exception 'Attempt not found';
  end if;
  if v_attempt.student_id <> v_uid then
    raise exception 'Not your attempt';
  end if;
  if v_attempt.submitted_at is not null then
    raise exception 'Already submitted';
  end if;

  select * into v_quiz from public.quizzes where id = v_attempt.quiz_id;

  v_elapsed := extract(epoch from (now() - v_attempt.started_at));
  if v_elapsed > v_quiz.time_limit_seconds then
    raise exception 'Time limit exceeded';
  end if;

  delete from public.attempt_answers where attempt_id = p_attempt_id;

  for v_item in select * from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb))
  loop
    insert into public.attempt_answers (attempt_id, question_id, answer_text, selected_index)
    values (
      p_attempt_id,
      (v_item->>'question_id')::uuid,
      nullif(trim(coalesce(v_item->>'answer_text', '')), ''),
      case when v_item ? 'selected_index' and v_item->>'selected_index' is not null and v_item->>'selected_index' <> ''
        then (v_item->>'selected_index')::int
        else null
      end
    );
  end loop;

  update public.quiz_attempts set submitted_at = now() where id = p_attempt_id;
end;
$$;

grant execute on function public.join_quiz_by_room_code(text) to authenticated;
grant execute on function public.get_questions_for_student_attempt(uuid) to authenticated;
grant execute on function public.submit_quiz_attempt(uuid, jsonb) to authenticated;

-- ---------- RLS ----------
alter table public.quizzes enable row level security;
alter table public.questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.attempt_answers enable row level security;

-- quizzes
drop policy if exists "quizzes_select_teacher_or_student_attempt" on public.quizzes;
create policy "quizzes_select_teacher_or_student_attempt"
on public.quizzes for select to authenticated
using (
  teacher_id = auth.uid()
  or exists (
    select 1 from public.quiz_attempts a
    where a.quiz_id = quizzes.id and a.student_id = auth.uid()
  )
);

drop policy if exists "quizzes_insert_teacher" on public.quizzes;
create policy "quizzes_insert_teacher"
on public.quizzes for insert to authenticated
with check (
  teacher_id = auth.uid()
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher')
);

drop policy if exists "quizzes_update_teacher" on public.quizzes;
create policy "quizzes_update_teacher"
on public.quizzes for update to authenticated
using (teacher_id = auth.uid())
with check (teacher_id = auth.uid());

drop policy if exists "quizzes_delete_teacher" on public.quizzes;
create policy "quizzes_delete_teacher"
on public.quizzes for delete to authenticated
using (teacher_id = auth.uid());

-- questions (students use RPC for reads — direct select only for teachers)
drop policy if exists "questions_select_teacher" on public.questions;
create policy "questions_select_teacher"
on public.questions for select to authenticated
using (
  exists (select 1 from public.quizzes q where q.id = questions.quiz_id and q.teacher_id = auth.uid())
);

drop policy if exists "questions_insert_teacher" on public.questions;
create policy "questions_insert_teacher"
on public.questions for insert to authenticated
with check (
  exists (select 1 from public.quizzes q where q.id = questions.quiz_id and q.teacher_id = auth.uid())
);

drop policy if exists "questions_update_teacher" on public.questions;
create policy "questions_update_teacher"
on public.questions for update to authenticated
using (
  exists (select 1 from public.quizzes q where q.id = questions.quiz_id and q.teacher_id = auth.uid())
)
with check (
  exists (select 1 from public.quizzes q where q.id = questions.quiz_id and q.teacher_id = auth.uid())
);

drop policy if exists "questions_delete_teacher" on public.questions;
create policy "questions_delete_teacher"
on public.questions for delete to authenticated
using (
  exists (select 1 from public.quizzes q where q.id = questions.quiz_id and q.teacher_id = auth.uid())
);

-- quiz_attempts (inserts via join_quiz_by_room_code only — no insert policy)
drop policy if exists "quiz_attempts_select_own_or_teacher" on public.quiz_attempts;
create policy "quiz_attempts_select_own_or_teacher"
on public.quiz_attempts for select to authenticated
using (
  student_id = auth.uid()
  or exists (select 1 from public.quizzes q where q.id = quiz_attempts.quiz_id and q.teacher_id = auth.uid())
);

-- attempt_answers: only via submit RPC (no insert policy for authenticated)
drop policy if exists "attempt_answers_select_own_or_teacher" on public.attempt_answers;
create policy "attempt_answers_select_own_or_teacher"
on public.attempt_answers for select to authenticated
using (
  exists (
    select 1 from public.quiz_attempts a
    where a.id = attempt_answers.attempt_id
      and (a.student_id = auth.uid()
        or exists (select 1 from public.quizzes q where q.id = a.quiz_id and q.teacher_id = auth.uid()))
  )
);
