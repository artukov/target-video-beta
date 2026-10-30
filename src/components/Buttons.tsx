import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fonts, glow } from '@/theme';

// Button labels may wrap to a second line instead of truncating; past this they stop growing.
const BUTTON_TEXT_SCALE = 1.5;

interface PrimaryProps {
  label: string;
  icon?: LucideIcon;
  onPress: () => void;
  disabled?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

export function PrimaryButton({ label, icon: Icon, onPress, disabled = false, accessibilityHint, style }: PrimaryProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        styles.primary,
        disabled ? styles.primaryDisabled : glow,
        pressed && styles.pressed,
        style,
      ]}>
      {Icon && <Icon size={20} color={disabled ? colors.textDim : colors.onCyan} strokeWidth={2} />}
      <Text
        style={[styles.primaryLabel, disabled && styles.primaryLabelDisabled]}
        numberOfLines={2}
        maxFontSizeMultiplier={BUTTON_TEXT_SCALE}>
        {label}
      </Text>
    </Pressable>
  );
}

interface CircleProps {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  active?: boolean;
  size?: number;
}

export function CircleButton({ icon: Icon, label, onPress, active = false, size = 48 }: CircleProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      hitSlop={Math.max(0, (44 - size) / 2)}
      style={({ pressed }) => [
        styles.circle,
        { width: size, height: size, borderRadius: size / 2 },
        pressed && styles.pressed,
      ]}>
      <Icon size={size * 0.5} color={active ? colors.cyan : colors.text} strokeWidth={2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primary: {
    minHeight: 48,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: colors.cyan,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryDisabled: {
    backgroundColor: colors.disabled,
  },
  primaryLabel: {
    flexShrink: 1,
    textAlign: 'center',
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: colors.onCyan,
  },
  primaryLabelDisabled: {
    color: colors.textDim,
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(10,10,20,0.45)',
  },
  pressed: {
    opacity: 0.8,
  },
});
