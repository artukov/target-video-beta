import { Image } from 'expo-image';
import ArrowRight from 'lucide-react-native/icons/arrow-right';
import CircleCheck from 'lucide-react-native/icons/circle-check';
import Lock from 'lucide-react-native/icons/lock';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Episode } from '@/catalog/types';
import { formatCoins } from '@/format';
import type { UnlockResult } from '@/session/entitlements';
import { colors, denseTextScale, displayTextScale, fonts } from '@/theme';

import { PrimaryButton } from './Buttons';
import { CoinAmount } from './CoinAmount';

interface Props {
  episode: Episode;
  quote: UnlockResult;
  balance: number;
  onUnlock: () => void;
  onLater: () => void;
  onGoTo: (episodeId: string) => void;
}

export function UnlockSheet({ episode, quote, balance, onUnlock, onLater, onGoTo }: Props) {
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  const [pending, setPending] = useState(false);
  if (episode.access.kind !== 'coins') return null;
  const price = episode.access.price;
  const inOrder = quote.kind !== 'requires_previous';
  const hasVideo = episode.video !== undefined;
  // From the largest standard text size up, the price no longer fits beside the option
  // title and would squeeze it into a column of broken words, so it moves under it.
  const stackPrice = fontScale > 1.3;

  function confirm() {
    if (pending) return;
    setPending(true);
    onUnlock();
  }

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(160)}
      style={styles.overlay}
      accessibilityViewIsModal
      onAccessibilityEscape={onLater}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onLater}
        accessible={false}
        importantForAccessibility="no"
      />
      <Animated.View
        entering={FadeInDown.duration(260)}
        style={[styles.cardWrap, { marginTop: insets.top + 16, marginBottom: insets.bottom + 16 }]}>
        <View style={styles.card}>
          <ScrollView contentContainerStyle={styles.content} bounces={false}>
            <View style={styles.thumb}>
              <Image source={episode.art.poster} style={StyleSheet.absoluteFill} contentFit="cover" />
              <View style={styles.thumbDim} />
              <View style={styles.lockCircle}>
                <Lock size={20} color={colors.text} strokeWidth={2.2} />
              </View>
              <Text maxFontSizeMultiplier={denseTextScale} style={styles.locked}>
                LOCKED
              </Text>
            </View>

            <Text style={styles.eyebrow}>EPISODE {episode.number}</Text>
            <Text style={styles.title} maxFontSizeMultiplier={displayTextScale} accessibilityRole="header">
              {inOrder ? 'Continue the romance' : 'Episodes unlock in order'}
            </Text>
            <Text style={styles.body}>
              {quote.kind === 'requires_previous'
                ? 'Unlock the episode before this one first, so the story stays in order.'
                : hasVideo
                  ? `Unlock “${episode.title}” and find out what happens next.`
                  : `The demo ends before “${episode.title}”.`}
            </Text>

            {inOrder && (
              <>
                <View
                  style={styles.option}
                  accessible
                  accessibilityLabel={`Unlock Episode, one-time access, ${formatCoins(price)}`}>
                  <CircleCheck size={22} color={colors.cyan} strokeWidth={2} />
                  <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>Unlock Episode</Text>
                    <Text style={styles.optionSub}>One-time access</Text>
                    {stackPrice && <Text style={styles.optionPrice}>{price} Coins</Text>}
                  </View>
                  {!stackPrice && <Text style={styles.optionPrice}>{price} Coins</Text>}
                </View>

                <View
                  style={styles.balance}
                  accessible
                  accessibilityLabel={
                    quote.kind === 'unlocked'
                      ? `Your balance: ${formatCoins(balance)}, ${formatCoins(quote.balance)} after unlocking`
                      : `Your balance: ${formatCoins(balance)}`
                  }>
                  <Text style={styles.balanceLabel}>Your Balance</Text>
                  <View style={styles.balanceValue}>
                    <CoinAmount size={15}>{balance}</CoinAmount>
                    {quote.kind === 'unlocked' && (
                      <>
                        <ArrowRight size={15} color={colors.textDim} strokeWidth={2} />
                        <Text style={styles.balanceAfter}>{quote.balance}</Text>
                      </>
                    )}
                  </View>
                </View>
              </>
            )}

            {quote.kind === 'insufficient_funds' && (
              <Text style={styles.shortfall}>
                {hasVideo
                  ? 'Top-ups aren’t part of this prototype.'
                  : `Episode ${episode.number} has no video in this prototype, so more coins wouldn’t unlock it.`}
              </Text>
            )}
            {quote.kind === 'unavailable' && (
              <Text style={styles.shortfall}>
                Episode {episode.number} has no video in this prototype, so it can’t be unlocked.
              </Text>
            )}

            {quote.kind === 'requires_previous' ? (
              <PrimaryButton
                label="Go to the previous episode"
                onPress={() => onGoTo(quote.episodeId)}
                style={styles.cta}
              />
            ) : quote.kind === 'unavailable' ? (
              <PrimaryButton label="Not in this prototype" icon={Lock} onPress={confirm} disabled style={styles.cta} />
            ) : quote.kind === 'insufficient_funds' ? (
              <PrimaryButton
                label={`Need ${formatCoins(quote.shortfall, 'more')}`}
                icon={Lock}
                onPress={confirm}
                disabled
                style={styles.cta}
              />
            ) : (
              <PrimaryButton
                label={`Unlock for ${formatCoins(price)}`}
                icon={Lock}
                onPress={confirm}
                disabled={pending}
                style={styles.cta}
              />
            )}

            <Pressable onPress={onLater} accessibilityRole="button" style={styles.later} hitSlop={4}>
              <Text style={styles.laterLabel}>Maybe Later</Text>
            </Pressable>
            <Text style={styles.footnote}>Demo coins · no real payment</Text>
          </ScrollView>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  cardWrap: {
    marginHorizontal: 20,
    flexShrink: 1,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
  },
  card: {
    flexShrink: 1,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    overflow: 'hidden',
  },
  content: {
    alignItems: 'stretch',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 18,
  },
  thumb: {
    alignSelf: 'center',
    width: 110,
    height: 142,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  thumbDim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  lockCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locked: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.8,
    color: colors.text,
  },
  eyebrow: {
    marginTop: 17,
    textAlign: 'center',
    fontFamily: fonts.serifMedium,
    fontSize: 14,
    letterSpacing: 0.6,
    color: colors.cyan,
  },
  title: {
    marginTop: 8,
    textAlign: 'center',
    fontFamily: fonts.serifBold,
    fontSize: 24,
    lineHeight: 30,
    color: colors.text,
  },
  body: {
    marginTop: 4,
    textAlign: 'center',
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 23,
    color: colors.textMuted,
  },
  option: {
    marginTop: 33,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.cyan,
    backgroundColor: 'rgba(36,52,84,0.75)',
    shadowColor: colors.cyan,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.text,
  },
  optionSub: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.textMuted,
  },
  optionPrice: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.cyan,
  },
  balance: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: 12,
    rowGap: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  balanceLabel: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textMuted,
  },
  balanceValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceAfter: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
    color: colors.cyan,
  },
  shortfall: {
    marginTop: 12,
    textAlign: 'center',
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    color: colors.coin,
  },
  cta: {
    marginTop: 20,
    minHeight: 52,
    borderRadius: 14,
  },
  later: {
    marginTop: 11,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  laterLabel: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textMuted,
  },
  footnote: {
    textAlign: 'center',
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.textDim,
  },
});
