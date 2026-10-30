import { Image } from 'expo-image';
import Coins from 'lucide-react-native/icons/coins';
import Lock from 'lucide-react-native/icons/lock';
import Play from 'lucide-react-native/icons/play';
import RotateCcw from 'lucide-react-native/icons/rotate-ccw';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Episode } from '@/catalog/types';
import { colors, fonts } from '@/theme';

interface Props {
  episode: Episode;
  previous: Episode | undefined;
  previousVerb: 'Replay' | 'Watch';
  onUnlock: () => void;
  onPrevious: () => void;
}

export function LockGate({ episode, previous, previousVerb, onUnlock, onPrevious }: Props) {
  const PreviousIcon = previousVerb === 'Replay' ? RotateCcw : Play;

  return (
    <View style={StyleSheet.absoluteFill}>
      <Image source={episode.art.poster} style={StyleSheet.absoluteFill} contentFit="cover" />
      <View style={styles.dim} />
      <View style={styles.center}>
        <Pressable
          onPress={onUnlock}
          accessibilityRole="button"
          accessibilityLabel={`Unlock Episode ${episode.number}`}
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
          <View>
            <Lock size={40} color={colors.text} strokeWidth={1.8} />
            <View style={styles.coin}>
              <Coins size={18} color={colors.coin} strokeWidth={2.4} />
            </View>
          </View>
          <Text style={styles.cardLabel}>Unlock Episode {episode.number}</Text>
        </Pressable>
        {previous && (
          <Pressable
            onPress={onPrevious}
            hitSlop={8}
            accessibilityRole="button"
            style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
            <PreviousIcon size={16} color={colors.textMuted} strokeWidth={2} />
            <Text style={styles.secondaryLabel}>
              {previousVerb} Episode {previous.number}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(3,6,22,0.62)',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    paddingHorizontal: 24,
  },
  card: {
    alignItems: 'center',
    gap: 14,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.navyBorder,
    backgroundColor: colors.navy,
  },
  coin: {
    position: 'absolute',
    right: -10,
    bottom: -4,
  },
  cardLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: colors.text,
  },
  secondary: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  secondaryLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    color: colors.textMuted,
  },
  pressed: {
    opacity: 0.8,
  },
});
