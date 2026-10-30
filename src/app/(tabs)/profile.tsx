import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import type { LucideIcon } from 'lucide-react-native';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import Coins from 'lucide-react-native/icons/coins';
import FastForward from 'lucide-react-native/icons/fast-forward';
import RotateCcw from 'lucide-react-native/icons/rotate-ccw';
import TriangleAlert from 'lucide-react-native/icons/triangle-alert';
import type { ReactNode } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AVATAR, getEpisode } from '@/catalog/catalog';
import type { Episode } from '@/catalog/types';
import { CoinAmount } from '@/components/CoinAmount';
import { StorageNotice } from '@/components/StorageNotice';
import { Toast, useToast } from '@/components/Toast';
import { formatTime } from '@/format';
import { SEED_COINS } from '@/session/snapshot';
import { useSession } from '@/session/SessionProvider';
import { colors, fonts, gutter } from '@/theme';

const CLIFFHANGER_LEAD_SEC = 4;

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, canPlay, emptyWallet, resetDemo } = useSession();
  const { toast, show } = useToast();

  const firstEpisode = getEpisode('vl-ep1')!;
  const lockAhead = !canPlay(getEpisode('vl-ep2')!);
  const unlocked = session.unlockedEpisodeIds
    .map((id) => getEpisode(id))
    .filter((episode): episode is Episode => episode !== undefined);
  const lastEpisode = getEpisode(session.lastEpisodeId ?? undefined);
  const lastProgress = lastEpisode && session.progress[lastEpisode.id];

  function playNearCliffhanger() {
    router.push({
      pathname: '/watch/[episodeId]',
      params: { episodeId: firstEpisode.id, start: String(Math.max(0, firstEpisode.durationSec - CLIFFHANGER_LEAD_SEC)) },
    });
  }

  function confirmReset() {
    Alert.alert('Reset the demo?', `Coins go back to ${SEED_COINS}, and unlocks, progress and saved series are cleared.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          resetDemo();
          show('Demo reset');
        },
      },
    ]);
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
        <View style={styles.header}>
          <Image source={AVATAR} style={styles.avatar} contentFit="cover" />
          <View style={styles.headerText}>
            <Text style={styles.title} accessibilityRole="header">
              Demo controls
            </Text>
            <Text style={styles.subtitle}>Shortcuts for the walkthrough. Coins here are play money.</Text>
          </View>
        </View>

        <StorageNotice />

        <View style={styles.card}>
          <Stat label="Coin balance">
            <CoinAmount size={17}>{session.coins}</CoinAmount>
          </Stat>
          <Stat label="Unlocked">
            <Text style={styles.statValue}>
              {unlocked.length > 0 ? unlocked.map((episode) => `Ep ${episode.number}`).join(', ') : 'Nothing yet'}
            </Text>
          </Stat>
          <Stat label="Last watched" last>
            <Text style={styles.statValue}>
              {lastEpisode
                ? `Ep ${lastEpisode.number} · ${lastProgress?.completed ? 'finished' : formatTime(lastProgress?.positionSec ?? 0)}`
                : '—'}
            </Text>
          </Stat>
        </View>

        <View style={styles.card}>
          <Action
            icon={FastForward}
            title="Play Ep 1 near the cliffhanger"
            detail={
              lockAhead
                ? `Starts ${CLIFFHANGER_LEAD_SEC} seconds before the lock`
                : 'Episode 2 is unlocked, so it plays straight on. Reset the demo to see the lock again'
            }
            onPress={playNearCliffhanger}
          />
          <Action
            icon={Coins}
            title="Set balance to 0"
            detail="Shows the not-enough-coins state"
            onPress={() => {
              emptyWallet();
              show('Balance set to 0');
            }}
          />
          <Action
            icon={TriangleAlert}
            title="Simulate a playback error"
            detail="Opens Ep 1 with a broken source; Retry recovers"
            onPress={() => router.push({ pathname: '/watch/[episodeId]', params: { episodeId: firstEpisode.id, fail: '1' } })}
          />
          <Action
            icon={RotateCcw}
            title="Reset demo"
            detail={`${SEED_COINS} coins, nothing unlocked, no progress`}
            onPress={confirmReset}
            last
          />
        </View>

        <Text style={styles.note}>
          Everything is stored on this device only. Music: “Dark Fog” by Kevin MacLeod (incompetech.com), licensed under
          CC BY 4.0 (creativecommons.org/licenses/by/4.0). Footage and artwork credits are in CREDITS.md.
        </Text>
      </ScrollView>
      <Toast toast={toast} top={insets.top + 12} />
    </View>
  );
}

function Stat({ label, children, last = false }: { label: string; children: ReactNode; last?: boolean }) {
  return (
    <View style={[styles.stat, !last && styles.divider]}>
      <Text style={styles.statLabel}>{label}</Text>
      {children}
    </View>
  );
}

interface ActionProps {
  icon: LucideIcon;
  title: string;
  detail: string;
  onPress: () => void;
  last?: boolean;
}

function Action({ icon: Icon, title, detail, onPress, last = false }: ActionProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityHint={detail}
      style={({ pressed }) => [styles.action, !last && styles.divider, pressed && styles.pressed]}>
      <View style={styles.actionIcon}>
        <Icon size={20} color={colors.cyan} strokeWidth={2} />
      </View>
      <View style={styles.actionText}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionDetail}>{detail}</Text>
      </View>
      <ChevronRight size={18} color={colors.textDim} strokeWidth={2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: gutter,
    paddingBottom: 32,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 4,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: fonts.serifBold,
    fontSize: 28,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 14.5,
    lineHeight: 20,
    color: colors.textMuted,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
  },
  stat: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  statLabel: {
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.textMuted,
  },
  statValue: {
    flexShrink: 1,
    textAlign: 'right',
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: colors.text,
  },
  action: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
  },
  pressed: {
    opacity: 0.75,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(100,237,247,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: colors.text,
  },
  actionDetail: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 19,
    color: colors.textMuted,
  },
  note: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textDim,
  },
});
