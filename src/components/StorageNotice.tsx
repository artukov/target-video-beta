import TriangleAlert from 'lucide-react-native/icons/triangle-alert';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useSession } from '@/session/SessionProvider';
import { colors, fonts } from '@/theme';

const MESSAGES = {
  'read-failed': 'Couldn’t read the saved demo, so nothing is saved this time.',
  'write-failed': 'Couldn’t save on this device. Changes last until the app closes.',
};

export function StorageNotice({ style }: { style?: StyleProp<ViewStyle> }) {
  const { storage } = useSession();
  if (storage === 'ok') return null;

  return (
    <View style={[styles.notice, style]} accessibilityRole="alert">
      <TriangleAlert size={16} color={colors.coin} strokeWidth={2.2} />
      <Text style={styles.text}>{MESSAGES[storage]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(24,23,43,0.94)',
  },
  text: {
    flexShrink: 1,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text,
  },
});
