import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors } from '../../constants/colors';
import { strings } from '../../constants/strings';
import { createQuizWithQuestions } from '../../lib/quizApi';

/**
 * Builds one empty MCQ draft for the form.
 */
function createEmptyMcq() {
  return {
    question_type: 'mcq',
    question_text: '',
    options: ['', ''],
    correct_index: 0,
  };
}

/**
 * Teacher creates a quiz: title, time (minutes), and a list of MCQ or text questions.
 */
export function CreateQuizScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [minutes, setMinutes] = useState('15');
  const [questions, setQuestions] = useState([createEmptyMcq()]);
  const [submitting, setSubmitting] = useState(false);

  /**
   * Adds a new question row (defaults to MCQ).
   */
  const addQuestion = () => {
    setQuestions((previous) => [...previous, createEmptyMcq()]);
  };

  /**
   * Converts the last question to text type (simple toggle for MVP).
   */
  const setQuestionType = (index, questionType) => {
    setQuestions((previous) =>
      previous.map((question, questionIndex) => {
        if (questionIndex !== index) {
          return question;
        }
        if (questionType === 'text') {
          return { question_type: 'text', question_text: '' };
        }
        return createEmptyMcq();
      }),
    );
  };

  /**
   * Updates option text for an MCQ.
   */
  const setOptionText = (questionIndex, optionIndex, value) => {
    setQuestions((previous) =>
      previous.map((question, index) => {
        if (index !== questionIndex || question.question_type !== 'mcq') {
          return question;
        }
        const nextOptions = [...question.options];
        nextOptions[optionIndex] = value;
        return { ...question, options: nextOptions };
      }),
    );
  };

  /**
   * Adds another MCQ option (max 5).
   */
  const addOption = (questionIndex) => {
    setQuestions((previous) =>
      previous.map((question, index) => {
        if (index !== questionIndex || question.question_type !== 'mcq') {
          return question;
        }
        if (question.options.length >= 5) {
          return question;
        }
        return { ...question, options: [...question.options, ''] };
      }),
    );
  };

  /**
   * Validates and saves the quiz + questions to Supabase.
   */
  const handleSave = async () => {
    const parsedMinutes = Number(minutes);
    if (!title.trim()) {
      Alert.alert(strings.errorTitle, strings.quizTitleRequired);
      return;
    }
    if (!Number.isFinite(parsedMinutes) || parsedMinutes <= 0 || parsedMinutes > 240) {
      Alert.alert(strings.errorTitle, strings.quizMinutesInvalid);
      return;
    }
    for (let index = 0; index < questions.length; index += 1) {
      const question = questions[index];
      if (!question.question_text.trim()) {
        Alert.alert(strings.errorTitle, strings.quizQuestionEmpty);
        return;
      }
      if (question.question_type === 'mcq') {
        const filled = question.options.map((option) => option.trim()).filter(Boolean);
        if (filled.length < 2) {
          Alert.alert(strings.errorTitle, strings.quizMcqOptionsInvalid);
          return;
        }
      }
    }

    const payload = questions.map((question) => {
      if (question.question_type === 'mcq') {
        const trimmedOptions = question.options.map((option) => option.trim()).filter(Boolean);
        return {
          question_type: 'mcq',
          question_text: question.question_text.trim(),
          options: trimmedOptions,
          correct_index: Math.min(question.correct_index, trimmedOptions.length - 1),
        };
      }
      return {
        question_type: 'text',
        question_text: question.question_text.trim(),
      };
    });

    setSubmitting(true);
    const { data, error } = await createQuizWithQuestions({
      title: title.trim(),
      timeLimitSeconds: Math.round(parsedMinutes * 60),
      questions: payload,
    });
    setSubmitting(false);
    if (error) {
      Alert.alert(strings.errorTitle, error.message);
      return;
    }
    Alert.alert(strings.quizCreatedTitle, `${strings.roomCodeLabel}: ${data.room_code}`, [
      { text: strings.ok, onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <Text style={styles.screenTitle}>{strings.createQuizTitle}</Text>
      <Text style={styles.label}>{strings.quizTitleLabel}</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder={strings.quizTitlePlaceholder} />
      <Text style={styles.label}>{strings.quizMinutesLabel}</Text>
      <TextInput
        style={styles.input}
        value={minutes}
        onChangeText={setMinutes}
        keyboardType="number-pad"
        placeholder="15"
      />
      {questions.map((question, questionIndex) => (
        <View key={questionIndex} style={styles.block}>
          <Text style={styles.qTitle}>
            {strings.questionLabel} {questionIndex + 1}
          </Text>
          <View style={styles.typeRow}>
            <Pressable
              onPress={() => setQuestionType(questionIndex, 'mcq')}
              style={[styles.typeChip, question.question_type === 'mcq' && styles.typeChipOn]}
            >
              <Text style={question.question_type === 'mcq' ? styles.typeChipTextOn : styles.typeChipText}>MCQ</Text>
            </Pressable>
            <Pressable
              onPress={() => setQuestionType(questionIndex, 'text')}
              style={[styles.typeChip, question.question_type === 'text' && styles.typeChipOn]}
            >
              <Text style={question.question_type === 'text' ? styles.typeChipTextOn : styles.typeChipText}>
                Text
              </Text>
            </Pressable>
          </View>
          <TextInput
            style={styles.input}
            value={question.question_text}
            onChangeText={(value) =>
              setQuestions((previous) =>
                previous.map((item, index) => (index === questionIndex ? { ...item, question_text: value } : item)),
              )
            }
            placeholder={strings.questionTextPlaceholder}
            multiline
          />
          {question.question_type === 'mcq' ? (
            <>
              {question.options.map((option, optionIndex) => (
                <View key={optionIndex} style={styles.optionRow}>
                  <Pressable
                    onPress={() =>
                      setQuestions((previous) =>
                        previous.map((item, index) =>
                          index === questionIndex && item.question_type === 'mcq'
                            ? { ...item, correct_index: optionIndex }
                            : item,
                        ),
                      )
                    }
                    style={[styles.radio, question.correct_index === optionIndex && styles.radioOn]}
                  />
                  <TextInput
                    style={[styles.input, styles.optionInput]}
                    value={option}
                    onChangeText={(value) => setOptionText(questionIndex, optionIndex, value)}
                    placeholder={`${strings.optionLabel} ${optionIndex + 1}`}
                  />
                </View>
              ))}
              <Pressable onPress={() => addOption(questionIndex)}>
                <Text style={styles.addOpt}>{strings.addOptionCta}</Text>
              </Pressable>
            </>
          ) : null}
        </View>
      ))}
      <Pressable onPress={addQuestion} style={styles.secondary}>
        <Text style={styles.secondaryText}>{strings.addQuestionCta}</Text>
      </Pressable>
      <PrimaryButton label={strings.saveQuizCta} onPress={handleSave} loading={submitting} />
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>{strings.back}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
    color: colors.textPrimary,
  },
  block: {
    marginBottom: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
  },
  qTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
    color: colors.textPrimary,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  typeChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeChipOn: {
    borderColor: colors.accent,
    backgroundColor: '#eff6ff',
  },
  typeChipText: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  typeChipTextOn: {
    color: colors.accent,
    fontWeight: '700',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.border,
  },
  radioOn: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  optionInput: {
    flex: 1,
    marginBottom: 0,
  },
  addOpt: {
    color: colors.accent,
    fontWeight: '700',
    marginBottom: 8,
  },
  secondary: {
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryText: {
    color: colors.accent,
    fontWeight: '700',
  },
  back: {
    alignItems: 'center',
    marginTop: 8,
  },
  backText: {
    color: colors.textMuted,
    fontWeight: '600',
  },
});
