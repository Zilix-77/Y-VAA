import { StyleSheet, View } from 'react-native';
import { colors } from '../constants/colors';

/**
 * Simple full-screen wrapper so screens share the same background and padding.
 */
export function ScreenContainer({ children, style }) {
  return <View style={[styles.root, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
