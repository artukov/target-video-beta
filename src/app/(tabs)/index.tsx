import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import type { LucideIcon } from 'lucide-react-native';
import Bell from 'lucide-react-native/icons/bell';
import Lock from 'lucide-react-native/icons/lock';
import Play from 'lucide-react-native/icons/play';
import Search from 'lucide-react-native/icons/search';
import Star from 'lucide-react-native/icons/star';
import { Fragment, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AVATAR, EPISODES, FEATURED_SERIES_ID, GENRES, getEpisode, getSeries, RAIL_GROUPS } from '@/catalog/catalog';
import type { Genre, Series } from '@/catalog/types';
import { PrimaryButton } from '@/components/Buttons';
import { Chip } from '@/components/Chip';
import { HeartLogo } from '@/components/HeartLogo';
import { PosterCard } from '@/components/PosterCard';
import { SaveButton } from '@/components/SaveButton';
import { GroupHeader, RailHeader } from '@/components/SectionHeaders';
import { Toast, useToast } from '@/components/Toast';
import { resumeTarget } from '@/session/resume';
import { useSession } from '@/session/SessionProvider';
import { colors, denseTextScale, displayTextScale, fonts, gutter } from '@/theme';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { session, canPlay } = useSession();
  const { toast, show } = useToast();
  const [genre, setGenre] = useState<'All' | Genre>('All');

  const featured = getSeries(FEATURED_SERIES_ID)!;
  const target = resumeTarget(session, EPISODES, featured.id);
  const targetEpisode = getEpisode(target?.episodeId);
  const targetLocked = targetEpisode !== undefined && !canPlay(targetEpisode);

  const groups = RAIL_GROUPS.map((group) => ({
    ...group,
    rails: group.rails
      .map((rail) => ({
        ...rail,
        series: rail.seriesIds
          .map((id) => getSeries(id))
          .filter((series): series is Series => series !== undefined)
          .filter((series) => genre === 'All' || series.genres.includes(genre)),
      }))
      .filter((rail) => rail.series.length > 0),
  })).filter((group) => group.rails.length > 0);

  function openSeries(seriesId: string) {
    router.push(`/series/${seriesId}`);
  }

  function watch() {
    if (target) router.push({ pathname: '/watch/[episodeId]', params: { episodeId: target.episodeId } });
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <HeartLogo />
        <View style={styles.headerActions}>
          <HeaderIcon icon={Search} label="Search" onPress={() => router.navigate('/discover')} />
          <HeaderIcon icon={Bell} label="Notifications" dot onPress={() => show('Notifications aren’t part of this prototype')} />
          <Pressable
            onPress={() => router.navigate('/profile')}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="Profile and demo controls">
            <Image source={AVATAR} style={styles.avatar} contentFit="cover" />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Pressable onPress={() => openSeries(featured.id)} accessible={false}>
          <View style={[styles.hero, { minHeight: Math.round((width * 4) / 3) }]}>
            <Image source={featured.poster} style={StyleSheet.absoluteFill} contentFit="cover" />
            <LinearGradient
              colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.1)']}
              locations={[0, 0.5, 1]}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)', colors.bg]}
              locations={[0, 0.5, 1]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroTint} />
            <View style={styles.heroContent}>
              <View
                style={styles.tagRow}
                accessible
                accessibilityLabel={`Spotlight: ${featured.tags.join(', ')}`}>
                <View style={styles.spotlight}>
                  <Text maxFontSizeMultiplier={denseTextScale} style={styles.spotlightLabel}>
                    Spotlight
                  </Text>
                </View>
                {featured.tags.map((tag, index) => (
                  <Fragment key={tag}>
                    {index > 0 && <View style={styles.tagDot} />}
                    <Text maxFontSizeMultiplier={denseTextScale} style={styles.tag}>
                      {tag}
                    </Text>
                  </Fragment>
                ))}
              </View>
              <Text
                style={styles.heroTitle}
                maxFontSizeMultiplier={displayTextScale}
                onPress={() => openSeries(featured.id)}
                accessibilityRole="link"
                accessibilityHint="Opens the series">
                {featured.title}
              </Text>
              <Text style={styles.tagline}>{featured.tagline}</Text>
              <View
                style={styles.stats}
                accessible
                accessibilityLabel={`Rated ${featured.rating}, ${featured.episodeCount} episodes`}>
                <Star size={16} color={colors.textSecondary} strokeWidth={1.8} />
                <Text style={styles.rating}>{featured.rating}</Text>
                <View style={styles.statSquare} />
                <Text style={styles.statText}>{featured.episodeCount} Episoden</Text>
              </View>
              <View style={styles.ctaRow}>
                <PrimaryButton
                  label={target?.continuing && targetEpisode ? `Weiterschauen · Ep ${targetEpisode.number}` : 'Jetzt ansehen'}
                  icon={targetLocked ? Lock : Play}
                  onPress={watch}
                  accessibilityHint={targetLocked ? 'Locked. Opens the unlock sheet.' : undefined}
                  style={styles.cta}
                />
                <SaveButton seriesId={featured.id} notify={show} />
              </View>
            </View>
          </View>
        </Pressable>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          style={styles.chipStrip}>
          {GENRES.map((option) => (
            <Chip key={option} label={option} active={genre === option} onPress={() => setGenre(option)} />
          ))}
        </ScrollView>

        {groups.map((group, groupIndex) => (
          <View key={group.title} style={groupIndex === 0 ? styles.firstGroup : styles.group}>
            <GroupHeader title={group.title} accent={group.accent} />
            {group.rails.map((rail, railIndex) => (
              <View key={rail.title} style={railIndex === 0 ? styles.firstRail : styles.rail}>
                <RailHeader title={rail.title} onSeeAll={() => show('Full collections aren’t in this prototype')} />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.posters}
                  style={styles.posterStrip}>
                  {rail.series.map((series) => (
                    <PosterCard key={series.id} series={series} onPress={() => openSeries(series.id)} />
                  ))}
                </ScrollView>
              </View>
            ))}
          </View>
        ))}

        {groups.length === 0 && <Text style={styles.empty}>No {genre} series yet.</Text>}
      </ScrollView>

      <Toast toast={toast} top={insets.top + 56} />
    </View>
  );
}

interface HeaderIconProps {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  dot?: boolean;
}

function HeaderIcon({ icon: Icon, label, onPress, dot = false }: HeaderIconProps) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={styles.headerIcon}>
      <Icon size={20} color={colors.text} strokeWidth={2} />
      {dot && <View style={styles.bellDot} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: gutter,
    paddingBottom: 5,
    backgroundColor: colors.bg,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 11,
    right: 12,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.cyan,
    borderWidth: 1.5,
    borderColor: colors.bg,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginLeft: 6,
    backgroundColor: colors.surface,
  },
  content: {
    paddingBottom: 36,
  },
  hero: {
    width: '100%',
    justifyContent: 'flex-end',
    backgroundColor: colors.surface,
  },
  heroTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(100,237,247,0.1)',
  },
  heroContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    rowGap: 6,
    columnGap: 8,
  },
  spotlight: {
    paddingHorizontal: 11,
    paddingVertical: 3,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(203,100,247,0.55)',
    backgroundColor: 'rgba(203,100,247,0.22)',
    marginRight: 2,
  },
  spotlightLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: colors.purple,
  },
  tag: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.textSecondary,
  },
  tagDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.separator,
  },
  heroTitle: {
    marginTop: 15,
    fontFamily: fonts.serifExtraBold,
    fontSize: 36,
    lineHeight: 44,
    letterSpacing: -0.85,
    color: colors.text,
  },
  tagline: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 18,
    color: colors.textSoft,
  },
  stats: {
    marginTop: 19,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.text,
  },
  statText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  statSquare: {
    width: 4,
    height: 4,
    marginHorizontal: 12,
    backgroundColor: colors.separator,
  },
  ctaRow: {
    marginTop: 26,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cta: {
    flex: 1,
    gap: 16,
  },
  chipStrip: {
    marginTop: 12,
    flexGrow: 0,
  },
  chips: {
    paddingHorizontal: gutter,
    paddingVertical: 5,
    gap: 8,
  },
  firstGroup: {
    marginTop: 18,
  },
  group: {
    marginTop: 64,
  },
  firstRail: {
    marginTop: 32,
  },
  rail: {
    marginTop: 55,
  },
  posterStrip: {
    marginTop: 14,
    flexGrow: 0,
  },
  posters: {
    paddingHorizontal: gutter,
    gap: 16,
  },
  empty: {
    marginTop: 48,
    textAlign: 'center',
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.textMuted,
  },
});
