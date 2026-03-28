import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors } from '../../constants/colors';
import { strings } from '../../constants/strings';
import { fetchQuestionsForAttempt, submitQuizAttempt } from '../../lib/quizApi';

/**
 * Computes seconds left using server timestamps from join to reduce clock skew issues.
 */
function computeSecondsLeft({ timeLimitSeconds, startedAtIso, serverNowIso }) {
  const startedMs = Date.parse(startedAtIso);
  const serverNowMs = Date.parse(serverNowIso);
  const offsetMs = serverNowMs - Date.now();
  const elapsedSeconds = (Date.now() + offsetMs - startedMs) / 1000;
  const left = Math.floor(timeLimitSeconds - elapsedSeconds);
  return Math.max(0, left);
}

/**
 * Normalizes RPC JSON into a question array.
 */
function normalizeQuestionsPayload(data) {
  if (Array.isArray(data)) {
    return data;
  }
  if (data && typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Student answers questions with a countdown; submit sends payload to the RPC.
 */
export function TakeQuizScreen({ route, navigation }) {
  const { attemptId, title, timeLimitSeconds, startedAtIso, serverNowIso } = route.params;
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(() =>
    computeSecondsLeft({ timeLimitSeconds, startedAtIso, serverNowIso }),
  );
  const [submitting, setSubmitting] = useState(false);
  const answersRef = useRef(answers);
  const autoSubmitFiredRef = useRef(false);
  const submitLockRef = useRef(false);

  answersRef.current = answers;

  const tick = useCallback(() => {
    setSecondsLeft(
      computeSecondsLeft({
        timeLimitSeconds,
        startedAtIso,
        serverNowIso,
      }),
    );
  }, [timeLimitSeconds, startedAtIso, serverNowIso]);

  /**
   * Loads question list via RPC (no correct answers).
   */
  const loadQuestions = useCallback(async () => {
    const { data, error } = await fetchQuestionsForAttempt(attemptId);
    setLoading(false);
    if (error) {
      Alert.alert(strings.errorTitle, error.message);
      navigation.goBack();
      return;
    }
    setQuestions(normalizeQuestionsPayload(data));
  }, [attemptId, navigation]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  useEffect(() => {
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [tick]);

  /**
   * Sends answers to Supabase and returns to the student home stack.
   */
  const runSubmit = useCallback(
    async (fromTimer) => {
      if (submitLockRef.current) {
        return;
      }
      submitLockRef.current = true;
      const latestAnswers = answersRef.current;
      const payload = questions.map((question) => {
        const value = latestAnswers[question.id];
        if (question.question_type === 'mcq') {
          return {
            question_id: question.id,
            selected_index: typeof value === 'number' ? value : null,
          };
        }
        return {
          question_id: question.id,
          answer_text: typeof value === 'string' ? value : '',
        };
      });

      setSubmitting(true);
      const { error } = await submitQuizAttempt(attemptId, payload);
      setSubmitting(false);
      submitLockRef.current = false;
      if (error) {
        Alert.alert(strings.errorTitle, error.message);
        return;
      }
      if (fromTimer) {
        Alert.alert(strings.timeUpTitle, strings.timeUpBody);
      } else {
        Alert.alert(strings.submittedTitle, strings.submittedBody);
      }
      navigation.popToTop();
    },
    [attemptId, navigation, questions],
  );

  useEffect(() => {
    if (loading || questions.length === 0) {
      return;
    }
    if (secondsLeft > 0) {
      autoSubmitFiredRef.current = false;
      return;
    }
    if (autoSubmitFiredRef.current) {
      return;
    }
    autoSubmitFiredRef.current = true;
    runSubmit(true);
  }, [secondsLeft, loading, questions.length, runSubmit]);

  const timerLabel = useMemo(() => {
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [secondsLeft]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>{strings.loadingQuestions}</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={[styles.timer, secondsLeft <= 30 && styles.timerWarn]}>{timerLabel}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {questions.map((question, index) => (
          <View key={question.id} style={styles.card}>
            <Text style={styles.qIndex}>
              {strings.questionLabel} {index + 1}
            </Text>
            <Text style={styles.qText}>{question.question_text}</Text>
            {question.question_type === 'mcq' ? (
              (question.options || []).map((option, optionIndex) => {
                const selected = answers[question.id] === optionIndex;
                return (
                  <Pressable
                    key={optionIndex}
                    onPress={() => setAnswers((previous) => ({ ...previous, [question.id]: optionIndex }))}
                    style={[styles.option, selected && styles.optionOn]}
                  >
                    <Text style={styles.optionText}>{option}</Text>
                  </Pressable>
                );
              })
            ) : (
              <TextInput
                style={styles.textAnswer}
                value={answers[question.id] || ''}
                onChangeText={(value) => setAnswers((previous) => ({ ...previous, [question.id]: value }))}
                placeholder={strings.textAnswerPlaceholder}
                multiline
              />
            )}
          </View>
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton
          label={strings.submitQuizCta}
          onPress={() => runSubmit(false)}
          loading={submitting}
          disabled={secondsLeft === 0}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textMuted,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 12,
  },
  timer: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.accent,
  },
  timerWarn: {
    color: colors.error,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  qIndex: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 6,
  },
  qText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  option: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  optionOn: {
    borderColor: colors.accent,
    backgroundColor: '#eff6ff',
  },
  optionText: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  textAnswer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 15,
    color: colors.textPrimary,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
