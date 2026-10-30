import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Film from 'lucide-react-native/icons/film';
import Heart from 'lucide-react-native/icons/heart';
import Play from 'lucide-react-native/icons/play';
import RefreshCw from 'lucide-react-native/icons/refresh-cw';
import RotateCcw from 'lucide-react-native/icons/rotate-ccw';
import Share2 from 'lucide-react-native/icons/share-2';
import TriangleAlert from 'lucide-react-native/icons/triangle-alert';
import Volume2 from 'lucide-react-native/icons/volume-2';
import VolumeX from 'lucide-react-native/icons/volume-x';
import X from 'lucide-react-native/icons/x';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, BackHandler, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EPISODES, getEpisode, getSeries, narrationAt, nextEpisode, previousEpisode } from '@/catalog/catalog';
import type { Episode } from '@/catalog/types';
import { CircleButton, PrimaryButton } from '@/components/Buttons';
import { LockGate } from '@/components/LockGate';
import { Narration } from '@/components/Narration';
import { Placeholder } from '@/components/Placeholder';
import { SeekBar } from '@/components/SeekBar';
import { StorageNotice } from '@/components/StorageNotice';
import { Toast, useToast } from '@/components/Toast';
import { UnlockSheet } from '@/components/UnlockSheet';
import { formatCoins, formatTime } from '@/format';
import { EpisodeVideo } from '@/player/EpisodeVideo';
import { useEpisodePlayer } from '@/player/useEpisodePlayer';
import { unlockEpisode } from '@/session/entitlements';
import { startPosition } from '@/session/resume';
import { useSession } from '@/session/SessionProvider';
import { colors, denseTextScale, fonts } from '@/theme';

export default function WatchRoute() {
  const router = useRouter();
  const { episodeId, start, fail } = useLocalSearchParams<{ episodeId: string; start?: string; fail?: string }>();
  const episode = getEpisode(episodeId);
  if (!episode) {
    return (
      <Placeholder
        icon={Film}
        title="Episode not found"
        message="This episode isn’t in the prototype catalogue."
        onBack={() => router.dismissTo('/')}
      />
    );
  }
  return <WatchScreen episode={episode} start={start} fail={fail === '1'} />;
}

interface WatchScreenProps {
  episode: Episode;
  start: string | undefined;
  fail: boolean;
}

function WatchScreen({ episode, start, fail }: WatchScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const { session, canPlay, unlock, recordProgress } = useSession();
  const { toast, show } = useToast();

  const entitled = canPlay(episode);
  const playable = entitled && episode.video !== undefined;
  const [sheetFor, setSheetFor] = useState<string | null>(entitled ? null : episode.id);
  const [likedId, setLikedId] = useState<string | null>(null);
  const sheetOpen = !entitled && sheetFor === episode.id;
  const liked = likedId === episode.id;

  const requestedStart = start === undefined ? NaN : Number(start);
  const startSec = Number.isFinite(requestedStart) && requestedStart > 0 ? requestedStart : startPosition(session, episode);

  const playback = useEpisodePlayer({
    episodeId: episode.id,
    source: playable ? episode.video : undefined,
    startSec,
    durationHint: episode.durationSec,
    active: focused && !sheetOpen,
    simulateFailure: fail,
    onProgress: recordProgress,
    onEnded: continueAfter,
  });

  useEffect(() => {
    if (!sheetOpen) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setSheetFor(null);
      return true;
    });
    return () => subscription.remove();
  }, [sheetOpen]);

  const series = getSeries(episode.seriesId);
  const previous = previousEpisode(episode);
  const following = nextEpisode(episode);
  const narration =
    playable && !playback.showPoster && playback.phase !== 'error'
      ? narrationAt(episode, playback.position)
      : undefined;

  function switchTo(target: Episode) {
    router.setParams({ episodeId: target.id, start: undefined, fail: undefined });
    setSheetFor(canPlay(target) ? null : target.id);
  }

  function continueAfter(endedId: string) {
    const ended = getEpisode(endedId);
    const next = ended && nextEpisode(ended);
    if (next) switchTo(next);
  }

  function close() {
    playback.stop();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  function confirmUnlock() {
    const result = unlock(episode.id);
    if (result.kind === 'unlocked') {
      setSheetFor(null);
      show(`Episode ${episode.number} unlocked · ${formatCoins(result.balance)} left`);
    } else if (result.kind === 'already_entitled') {
      setSheetFor(null);
    }
  }

  function share() {
    Share.share({
      message: `I’m watching “${series?.title ?? 'DramaFlash'}”, Episode ${episode.number}: ${episode.title} on DramaFlash.`,
    }).catch(() => {});
  }

  return (
    <View style={styles.screen}>
      <StatusBar hidden />
      <EpisodeVideo playback={playback} />

      {playable ? (
        <>
          {playback.showPoster && (
            <Image source={episode.art.poster} style={StyleSheet.absoluteFill} contentFit="cover" transition={0} />
          )}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={playback.togglePlay}
            accessibilityRole="button"
            accessibilityLabel={playback.paused ? 'Play' : 'Pause'}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.75)']}
            pointerEvents="none"
            style={styles.bottomShade}
          />
          {playback.paused && playback.phase === 'ready' && (
            <View pointerEvents="none" style={styles.center}>
              <View style={styles.bigPlay}>
                <Play size={34} color={colors.text} strokeWidth={2} />
              </View>
            </View>
          )}
          {playback.showSpinner && (
            <View pointerEvents="none" style={styles.center}>
              <ActivityIndicator size="large" color={colors.cyan} />
            </View>
          )}
          {playback.phase === 'error' && (
            <View style={styles.center}>
              <View style={styles.panel}>
                <TriangleAlert size={30} color={colors.coin} strokeWidth={2} />
                <Text style={styles.panelTitle}>This episode didn’t load</Text>
                <Text style={styles.panelBody}>Check your connection and try again.</Text>
                <PrimaryButton label="Retry" icon={RefreshCw} onPress={playback.retry} style={styles.panelButton} />
              </View>
            </View>
          )}
          {playback.phase === 'ended' && !following && (
            <View style={styles.center}>
              <View style={styles.panel}>
                <Text style={styles.panelTitle}>You’re all caught up</Text>
                <PrimaryButton label="Replay" icon={RotateCcw} onPress={playback.replay} style={styles.panelButton} />
              </View>
            </View>
          )}

          <View style={[styles.actions, { bottom: insets.bottom + 132 }]}>
            <ActionButton
              label="12K"
              accessibilityLabel={liked ? 'Unlike' : 'Like'}
              onPress={() => setLikedId(liked ? null : episode.id)}>
              <Heart
                size={24}
                color={liked ? colors.purple : colors.text}
                fill={liked ? colors.purple : 'transparent'}
                strokeWidth={2}
              />
            </ActionButton>
            <ActionButton label="Share" accessibilityLabel="Share" onPress={share}>
              <Share2 size={22} color={colors.text} strokeWidth={2} />
            </ActionButton>
          </View>
        </>
      ) : entitled ? (
        <View style={[styles.center, styles.solid]}>
          <View style={styles.panel}>
            <Film size={30} color={colors.cyan} strokeWidth={2} />
            <Text style={styles.panelTitle}>Episode {episode.number} isn’t in this prototype</Text>
            <Text style={styles.panelBody}>Only the first two episodes have video.</Text>
          </View>
        </View>
      ) : (
        <LockGate
          episode={episode}
          previous={previous && canPlay(previous) ? previous : undefined}
          previousVerb={previous && session.progress[previous.id]?.completed ? 'Replay' : 'Watch'}
          onUnlock={() => setSheetFor(episode.id)}
          onPrevious={() => previous && switchTo(previous)}
        />
      )}

      {(playable || !entitled) && (
        <View
          style={[
            styles.info,
            { paddingBottom: insets.bottom + (playable ? 8 : 32) },
            !playable && styles.lockedInfo,
          ]}>
          {narration && <Narration key={narration.text} text={narration.text} />}
          <Text style={styles.seriesTitle} numberOfLines={1}>
            {series?.title}
          </Text>
          <View style={styles.episodeLine}>
            <View style={styles.epChip}>
              <Text maxFontSizeMultiplier={denseTextScale} style={styles.epChipLabel}>
                Ep {episode.number}
              </Text>
            </View>
            <Text style={styles.episodeMeta} numberOfLines={1}>
              {episode.title}
            </Text>
          </View>
          {playable && (
            <>
              <SeekBar position={playback.position} duration={playback.duration} onSeek={playback.seekTo} />
              <View style={styles.times}>
                <Text maxFontSizeMultiplier={denseTextScale} style={styles.time}>
                  {formatTime(playback.position)}
                </Text>
                <Text maxFontSizeMultiplier={denseTextScale} style={styles.time}>
                  {formatTime(playback.duration)}
                </Text>
              </View>
            </>
          )}
        </View>
      )}

      {!sheetOpen && (
        <View style={[styles.topBar, { top: insets.top + 8 }]}>
          <CircleButton icon={X} label="Close player" onPress={close} size={44} />
          <StorageNotice style={styles.storageNotice} />
          {playable && (
            <CircleButton
              icon={playback.muted ? VolumeX : Volume2}
              label={playback.muted ? 'Unmute' : 'Mute'}
              onPress={playback.toggleMuted}
              size={44}
            />
          )}
        </View>
      )}

      {sheetOpen && (
        <UnlockSheet
          key={episode.id}
          episode={episode}
          quote={unlockEpisode(session, episode.id, EPISODES).result}
          balance={session.coins}
          onUnlock={confirmUnlock}
          onLater={() => setSheetFor(null)}
          onGoTo={(id) => {
            const target = getEpisode(id);
            if (target) switchTo(target);
          }}
        />
      )}

      <Toast toast={toast} top={insets.top + 64} />
    </View>
  );
}

interface ActionButtonProps {
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
  children: ReactNode;
}

function ActionButton({ label, accessibilityLabel, onPress, children }: ActionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
      <View style={styles.actionCircle}>{children}</View>
      <Text maxFontSizeMultiplier={denseTextScale} style={styles.actionLabel}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  solid: {
    backgroundColor: colors.bg,
  },
  bottomShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 280,
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  bigPlay: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingLeft: 4,
  },
  panel: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 10,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(24,23,43,0.94)',
  },
  panelTitle: {
    textAlign: 'center',
    fontFamily: fonts.serifBold,
    fontSize: 22,
    color: colors.text,
  },
  panelBody: {
    textAlign: 'center',
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textMuted,
  },
  panelButton: {
    marginTop: 8,
    alignSelf: 'stretch',
  },
  actions: {
    position: 'absolute',
    right: 16,
    gap: 18,
  },
  actionButton: {
    alignItems: 'center',
    gap: 5,
  },
  actionCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30,30,40,0.55)',
  },
  actionLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.text,
  },
  pressed: {
    opacity: 0.75,
  },
  info: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
  },
  lockedInfo: {
    opacity: 0.65,
  },
  seriesTitle: {
    marginRight: 72,
    fontFamily: fonts.serifBold,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text,
  },
  episodeLine: {
    marginTop: 8,
    marginRight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  epChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#3A434F',
  },
  epChipLabel: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.text,
  },
  episodeMeta: {
    flexShrink: 1,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.textSoft,
  },
  times: {
    marginTop: -8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  time: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  storageNotice: {
    flex: 1,
  },
});
