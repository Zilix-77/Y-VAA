import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../app/LoginScreen';
import { SignUpScreen } from '../app/SignUpScreen';

const Stack = createNativeStackNavigator();

/**
 * Stack for unauthenticated users — login and sign up only.
 */
export function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
}
