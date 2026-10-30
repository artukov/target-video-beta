import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, denseTextScale, fonts } from '@/theme';

interface Props {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

export function Chip({ label, active = false, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={{ top: 5, bottom: 5 }}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [styles.chip, active && styles.active, pressed && styles.pressed]}>
      <Text maxFontSizeMultiplier={denseTextScale} style={[styles.label, active && styles.activeLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 34,
    paddingHorizontal: 16,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  active: {
    backgroundColor: colors.cyan,
    borderColor: colors.cyan,
  },
  pressed: {
    opacity: 0.8,
  },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.textMuted,
  },
  activeLabel: {
    color: colors.onCyan,
  },
});
