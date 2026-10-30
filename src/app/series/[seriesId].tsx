import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import Info from 'lucide-react-native/icons/info';
import ListVideo from 'lucide-react-native/icons/list-video';
import Lock from 'lucide-react-native/icons/lock';
import Play from 'lucide-react-native/icons/play';
import Share2 from 'lucide-react-native/icons/share-2';
import Star from 'lucide-react-native/icons/star';
import { ScrollView, Share, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EPISODES, episodesOf, getEpisode, getSeries } from '@/catalog/catalog';
import type { Series } from '@/catalog/types';
import { CircleButton, PrimaryButton } from '@/components/Buttons';
import { EpisodeRow } from '@/components/EpisodeRow';
import { Placeholder } from '@/components/Placeholder';
import { SaveButton } from '@/components/SaveButton';
import { Toast, useToast } from '@/components/Toast';
import { resumeTarget } from '@/session/resume';
import { useSession } from '@/session/SessionProvider';
import { colors, denseTextScale, displayTextScale, fonts, gutter } from '@/theme';

export default function SeriesRoute() {
  const router = useRouter();
  const { seriesId } = useLocalSearchParams<{ seriesId: string }>();
  const series = getSeries(seriesId);
  if (!series) {
    return (
      <Placeholder
        icon={Info}
        title="Series not found"
        message="This series isn’t in the prototype catalogue."
        onBack={() => router.dismissTo('/')}
      />
    );
  }
  return <SeriesScreen series={series} />;
}

function SeriesScreen({ series }: { series: Series }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { session, canPlay } = useSession();
  const { toast, show } = useToast();

  const episodes = episodesOf(series.id);
  const target = resumeTarget(session, EPISODES, series.id);
  const targetEpisode = getEpisode(target?.episodeId);
  const heroHeight = Math.round(width * 1.18);

  function watch(episodeId: string) {
    router.push({ pathname: '/watch/[episodeId]', params: { episodeId } });
  }

  function share() {
    Share.share({ message: `Watching “${series.title}” on DramaFlash — ${series.tagline}` }).catch(() => {});
  }

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <View style={{ height: heroHeight }}>
          <Image source={series.poster} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient
            colors={['rgba(0,0,0,0.35)', 'transparent', 'rgba(0,0,0,0.7)', colors.bg]}
            locations={[0, 0.22, 0.75, 1]}
            style={StyleSheet.absoluteFill}
          />
        </View>

        <View style={styles.body}>
          <View style={styles.tags}>
            {series.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text maxFontSizeMultiplier={denseTextScale} style={styles.tagLabel}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.title} maxFontSizeMultiplier={displayTextScale} accessibilityRole="header">
            {series.title}
          </Text>
          <View style={styles.meta}>
            <Star size={17} color={colors.text} strokeWidth={1.8} />
            <Text style={styles.metaStrong}>{series.rating}</Text>
            <Text style={styles.metaDim}>({series.ratingCount})</Text>
            <View style={styles.metaDot} />
            <Text style={styles.metaStrong}>{series.year}</Text>
            <View style={styles.metaDot} />
            <ListVideo size={18} color={colors.text} strokeWidth={1.8} />
            <Text style={styles.metaStrong}>{series.episodeCount} Eps</Text>
          </View>

          <View style={styles.ctaRow}>
            {series.playable && target && targetEpisode ? (
              <PrimaryButton
                label={target.continuing ? `Continue Ep ${targetEpisode.number}` : `Play Ep ${targetEpisode.number}`}
                icon={canPlay(targetEpisode) ? Play : Lock}
                onPress={() => watch(targetEpisode.id)}
                accessibilityHint={canPlay(targetEpisode) ? undefined : 'Locked. Opens the unlock sheet.'}
                style={styles.cta}
              />
            ) : (
              <View style={styles.notice}>
                <Info size={18} color={colors.cyan} strokeWidth={2} />
                <Text style={styles.noticeText}>Only Verbotene Liebe is playable in this prototype.</Text>
              </View>
            )}
            <SaveButton seriesId={series.id} notify={show} />
          </View>

          <Text style={styles.synopsis}>{series.synopsis}</Text>

          {episodes.length > 0 && (
            <View style={styles.episodes}>
              <View style={styles.episodesHeader}>
                <Text style={styles.episodesTitle} accessibilityRole="header">
                  Episodes
                </Text>
                <View style={styles.countBadge}>
                  <Text maxFontSizeMultiplier={denseTextScale} style={styles.countLabel}>
                    {series.episodeCount}
                  </Text>
                </View>
              </View>
              {episodes.map((episode) => (
                <EpisodeRow
                  key={episode.id}
                  episode={episode}
                  entitled={canPlay(episode)}
                  progress={session.progress[episode.id]}
                  onPress={() => watch(episode.id)}
                />
              ))}
              {series.episodeCount > episodes.length && (
                <Text style={styles.more}>
                  Episodes {episodes.length + 1}–{series.episodeCount} aren’t part of this prototype.
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.topBar, { top: insets.top + 6 }]}>
        <CircleButton icon={ChevronLeft} label="Back" onPress={() => router.back()} size={44} />
        <CircleButton icon={Share2} label="Share" onPress={share} size={44} />
      </View>
      <Toast toast={toast} top={insets.top + 60} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  body: {
    marginTop: -120,
    paddingHorizontal: 20,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(26,25,47,0.85)',
  },
  tagLabel: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.text,
  },
  title: {
    marginTop: 14,
    fontFamily: fonts.serifExtraBold,
    fontSize: 34,
    lineHeight: 42,
    color: colors.text,
  },
  meta: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  metaStrong: {
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    color: colors.text,
  },
  metaDim: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.textMuted,
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 10,
    backgroundColor: colors.border,
  },
  ctaRow: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cta: {
    flex: 1,
  },
  notice: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  noticeText: {
    flex: 1,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 21,
    color: colors.text,
  },
  synopsis: {
    marginTop: 20,
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textMuted,
  },
  episodes: {
    marginTop: 32,
  },
  episodesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  episodesTitle: {
    fontFamily: fonts.serifBold,
    fontSize: 24,
    color: colors.text,
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 14,
    backgroundColor: colors.surfaceRaised,
  },
  countLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.textMuted,
  },
  more: {
    marginTop: 12,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textDim,
  },
  topBar: {
    position: 'absolute',
    left: gutter,
    right: gutter,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
