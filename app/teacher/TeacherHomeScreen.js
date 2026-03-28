import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';
import { strings } from '../../constants/strings';
import { listTeacherQuizzes } from '../../lib/quizApi';

/**
 * Teacher landing: lists quizzes and opens the create flow.
 */
export function TeacherHomeScreen({ navigation, profile, session, onSignOut }) {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const email = session?.user?.email ?? '';

  /**
   * Loads quizzes from Supabase for this teacher.
   */
  const loadQuizzes = useCallback(async () => {
    const { data, error } = await listTeacherQuizzes();
    if (!error && data) {
      setQuizzes(data);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadQuizzes();
    }, [loadQuizzes]),
  );

  return (
    <View style={styles.root}>
      <Text style={styles.title}>{strings.appName}</Text>
      <Text style={styles.sub}>{strings.teacherHomeSubtitle}</Text>
      <View style={styles.row}>
        <Text style={styles.meta}>{profile?.display_name || email}</Text>
        <Pressable onPress={onSignOut} style={({ pressed }) => [pressed && styles.pressed]}>
          <Text style={styles.link}>{strings.signOut}</Text>
        </Pressable>
      </View>
      <Pressable
        onPress={() => navigation.navigate('CreateQuiz')}
        style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
      >
        <Text style={styles.primaryBtnText}>{strings.createQuizCta}</Text>
      </Pressable>
      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.accent} />
      ) : (
        <FlatList
          data={quizzes}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadQuizzes(); }} />}
          ListEmptyComponent={<Text style={styles.empty}>{strings.noQuizzesYet}</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardMeta}>
                {strings.roomCodeLabel}: {item.room_code}
              </Text>
              <Text style={styles.cardMeta}>
                {strings.timeLimitLabel}: {Math.round(item.time_limit_seconds / 60)} min
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sub: {
    marginTop: 6,
    fontSize: 15,
    color: colors.textMuted,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  meta: {
    fontSize: 14,
    color: colors.textMuted,
    flex: 1,
  },
  link: {
    color: colors.accent,
    fontWeight: '700',
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  loader: {
    marginTop: 24,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: 24,
    fontSize: 15,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardMeta: {
    marginTop: 4,
    fontSize: 14,
    color: colors.textMuted,
  },
  pressed: {
    opacity: 0.75,
  },
});
