import CircleCheck from 'lucide-react-native/icons/circle-check';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text } from 'react-native';
import Animated, { FadeInUp, FadeOut } from 'react-native-reanimated';

import { colors, fonts } from '@/theme';

const VISIBLE_MS = 2600;

interface ToastState {
  id: number;
  message: string;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  function show(message: string) {
    setToast((current) => ({ id: (current?.id ?? 0) + 1, message }));
    AccessibilityInfo.announceForAccessibility(message);
  }

  return { toast, show };
}

export function Toast({ toast, top }: { toast: ToastState | null; top: number }) {
  if (!toast) return null;
  return (
    <Animated.View
      key={toast.id}
      entering={FadeInUp.duration(220)}
      exiting={FadeOut.duration(180)}
      pointerEvents="none"
      style={[styles.toast, { top }]}>
      <CircleCheck size={18} color={colors.cyan} strokeWidth={2.2} />
      <Text style={styles.message}>{toast.message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    maxWidth: '88%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(24,23,43,0.96)',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  message: {
    flexShrink: 1,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    color: colors.text,
  },
});
