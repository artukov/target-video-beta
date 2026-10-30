import { LinearGradient } from 'expo-linear-gradient';
import Crown from 'lucide-react-native/icons/crown';
import { StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { colors, denseTextScale, fonts, gradient } from '@/theme';

export function ProBadge({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <LinearGradient colors={gradient} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={[styles.badge, style]}>
      <Crown size={11} color={colors.onCyan} strokeWidth={2.2} />
      <Text maxFontSizeMultiplier={denseTextScale} style={styles.label}>
        PRO
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 10,
  },
  label: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    color: colors.onCyan,
  },
});
