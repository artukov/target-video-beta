import Coins from 'lucide-react-native/icons/coins';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/theme';

interface Props {
  children: string | number;
  size?: number;
}

export function CoinAmount({ children, size = 16 }: Props) {
  return (
    <View style={styles.row}>
      <Coins size={size} color={colors.coin} strokeWidth={2.2} />
      <Text style={[styles.amount, { fontSize: size }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  amount: {
    fontFamily: fonts.sansBold,
    color: colors.text,
  },
});
