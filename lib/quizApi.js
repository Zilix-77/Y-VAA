import { generateRoomCode } from './roomCode';
import { getSupabase } from './supabase';

const MAX_ROOM_RETRIES = 8;

/**
 * Lists quizzes owned by the signed-in teacher.
 */
export async function listTeacherQuizzes() {
  const client = getSupabase();
  if (!client) {
    return { data: null, error: new Error('Supabase not configured') };
  }
  return client.from('quizzes').select('*').order('created_at', { ascending: false });
}

/**
 * Creates a quiz with questions. Retries if room_code collides (rare).
 */
export async function createQuizWithQuestions({ title, timeLimitSeconds, questions }) {
  const client = getSupabase();
  if (!client) {
    return { data: null, error: new Error('Supabase not configured') };
  }
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();
  if (userError || !user) {
    return { data: null, error: userError ?? new Error('Not signed in') };
  }

  let lastError = null;
  for (let attempt = 0; attempt < MAX_ROOM_RETRIES; attempt += 1) {
    const roomCode = generateRoomCode();
    const { data: quizRow, error: quizError } = await client
      .from('quizzes')
      .insert({
        teacher_id: user.id,
        title: title.trim(),
        time_limit_seconds: timeLimitSeconds,
        room_code: roomCode,
      })
      .select('*')
      .single();

    if (quizError) {
      lastError = quizError;
      if (quizError.code === '23505') {
        continue;
      }
      return { data: null, error: quizError };
    }

    const questionRows = questions.map((question, index) => ({
      quiz_id: quizRow.id,
      question_type: question.question_type,
      question_text: question.question_text.trim(),
      options: question.question_type === 'mcq' ? question.options : null,
      correct_index: question.question_type === 'mcq' ? question.correct_index : null,
      order_index: index,
    }));

    const { error: questionsError } = await client.from('questions').insert(questionRows);
    if (questionsError) {
      await client.from('quizzes').delete().eq('id', quizRow.id);
      return { data: null, error: questionsError };
    }

    return { data: quizRow, error: null };
  }

  return { data: null, error: lastError ?? new Error('Could not allocate a room code') };
}

/**
 * Student joins a quiz by room code (RPC creates the attempt row).
 */
export async function joinQuizByRoomCode(roomCode) {
  const client = getSupabase();
  if (!client) {
    return { data: null, error: new Error('Supabase not configured') };
  }
  return client.rpc('join_quiz_by_room_code', { p_room_code: roomCode });
}

/**
 * Loads questions for an attempt (correct answers hidden by RPC).
 */
export async function fetchQuestionsForAttempt(attemptId) {
  const client = getSupabase();
  if (!client) {
    return { data: null, error: new Error('Supabase not configured') };
  }
  return client.rpc('get_questions_for_student_attempt', { p_attempt_id: attemptId });
}

/**
 * Submits all answers and locks the attempt (server checks time limit).
 */
export async function submitQuizAttempt(attemptId, answersPayload) {
  const client = getSupabase();
  if (!client) {
    return { data: null, error: new Error('Supabase not configured') };
  }
  return client.rpc('submit_quiz_attempt', {
    p_attempt_id: attemptId,
    p_answers: answersPayload,
  });
}
