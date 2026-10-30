import Heart from 'lucide-react-native/icons/heart';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

export function HeartLogo() {
  return (
    <View accessibilityRole="image" accessibilityLabel="DramaFlash" style={styles.tile}>
      <Heart size={21} color={colors.bg} strokeWidth={2.8} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: colors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
