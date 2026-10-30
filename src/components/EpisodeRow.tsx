import { Image } from 'expo-image';
import CircleCheck from 'lucide-react-native/icons/circle-check';
import Clock from 'lucide-react-native/icons/clock';
import Lock from 'lucide-react-native/icons/lock';
import Play from 'lucide-react-native/icons/play';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Episode } from '@/catalog/types';
import { formatTime } from '@/format';
import type { EpisodeProgress } from '@/session/snapshot';
import { colors, fonts } from '@/theme';

import { CoinAmount } from './CoinAmount';

interface Props {
  episode: Episode;
  entitled: boolean;
  progress: EpisodeProgress | undefined;
  onPress: () => void;
}

export function EpisodeRow({ episode, entitled, progress, onPress }: Props) {
  const fraction = progress ? Math.min(1, progress.positionSec / episode.durationSec) : 0;
  const status = progress?.completed
    ? 'watched'
    : !entitled && episode.access.kind === 'coins'
      ? `locked, ${episode.access.price} coins`
      : fraction > 0
        ? 'in progress'
        : 'available';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Episode ${episode.number}, ${episode.title}, ${formatTime(episode.durationSec)}, ${status}`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.thumb}>
        <Image source={episode.art.thumb} style={StyleSheet.absoluteFill} contentFit="cover" />
        {!entitled && <View style={styles.dim} />}
        <View style={[styles.badge, !entitled && styles.lockedBadge]}>
          {entitled ? (
            <Play size={16} color={colors.onCyan} strokeWidth={2.4} />
          ) : (
            <Lock size={15} color={colors.text} strokeWidth={2.2} />
          )}
        </View>
        {fraction > 0 && !progress?.completed && (
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${fraction * 100}%` }]} />
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {episode.number}. {episode.title}
        </Text>
        <View style={styles.meta}>
          <Clock size={15} color={colors.textMuted} strokeWidth={2} />
          <Text style={styles.metaText}>{formatTime(episode.durationSec)}</Text>
        </View>
      </View>
      {!entitled && episode.access.kind === 'coins' ? (
        <CoinAmount size={15}>{episode.access.price}</CoinAmount>
      ) : progress?.completed ? (
        <CircleCheck size={20} color={colors.cyan} strokeWidth={2} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
  },
  pressed: {
    opacity: 0.8,
  },
  thumb: {
    width: 112,
    height: 63,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  badge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(100,237,247,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedBadge: {
    backgroundColor: 'rgba(12,29,74,0.9)',
  },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  fill: {
    height: 3,
    backgroundColor: colors.cyan,
  },
  info: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 17,
    lineHeight: 22,
    color: colors.text,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.textMuted,
  },
});
