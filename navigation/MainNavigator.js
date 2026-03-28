import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CreateQuizScreen } from '../app/teacher/CreateQuizScreen';
import { TeacherHomeScreen } from '../app/teacher/TeacherHomeScreen';
import { StudentHomeScreen } from '../app/student/StudentHomeScreen';
import { TakeQuizScreen } from '../app/student/TakeQuizScreen';

const Stack = createNativeStackNavigator();

/**
 * Routes after login: teacher (create/list) vs student (join/take quiz).
 */
export function MainNavigator({ profile, session, onSignOut }) {
  const role = profile?.role;
  const initialRouteName = role === 'teacher' ? 'TeacherHome' : 'StudentHome';

  return (
    <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TeacherHome">
        {(props) => (
          <TeacherHomeScreen {...props} profile={profile} session={session} onSignOut={onSignOut} />
        )}
      </Stack.Screen>
      <Stack.Screen name="CreateQuiz" component={CreateQuizScreen} />
      <Stack.Screen name="StudentHome">
        {(props) => (
          <StudentHomeScreen {...props} profile={profile} session={session} onSignOut={onSignOut} />
        )}
      </Stack.Screen>
      <Stack.Screen name="TakeQuiz" component={TakeQuizScreen} />
    </Stack.Navigator>
  );
}
