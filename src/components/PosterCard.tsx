import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Series } from '@/catalog/types';
import { colors, denseTextScale, fonts } from '@/theme';

import { ProBadge } from './ProBadge';

const POSTER_WIDTH = 130;
const POSTER_HEIGHT = 195;

interface Props {
  series: Series;
  onPress: () => void;
}

export function PosterCard({ series, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${series.title}, ${series.episodeCount} episodes${series.pro ? ', Pro' : ''}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.frame}>
        <Image source={series.poster} style={StyleSheet.absoluteFill} contentFit="cover" transition={120} />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.78)']} style={styles.shade} />
        {series.pro && <ProBadge style={styles.badge} />}
        <View style={styles.meta}>
          <Text maxFontSizeMultiplier={denseTextScale} style={styles.metaText}>
            {series.episodeCount} Eps
          </Text>
          <Text maxFontSizeMultiplier={denseTextScale} style={styles.metaText}>
            {series.minutesPerEpisode}
          </Text>
        </View>
      </View>
      <Text numberOfLines={2} maxFontSizeMultiplier={denseTextScale} style={styles.title}>
        {series.title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: POSTER_WIDTH,
  },
  pressed: {
    opacity: 0.85,
  },
  frame: {
    width: POSTER_WIDTH,
    height: POSTER_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(80, 74, 140, 0.55)',
    backgroundColor: colors.surface,
  },
  shade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 64,
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  meta: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.textSecondary,
  },
  title: {
    marginTop: 8,
    fontFamily: fonts.serifSemiBold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
  },
});
