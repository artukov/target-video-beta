import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, denseTextScale, fonts, gutter } from '@/theme';

import { GradientFill } from './GradientFill';

export function GroupHeader({ title, accent }: { title: string; accent: 'gradient' | 'plain' }) {
  const content = (
    <View style={styles.groupRow}>
      <View style={styles.square} />
      <Text style={styles.groupTitle}>{title}</Text>
    </View>
  );

  return (
    <View style={styles.group} accessible accessibilityRole="header" accessibilityLabel={title}>
      {accent === 'gradient' ? <GradientFill>{content}</GradientFill> : content}
    </View>
  );
}

export function RailHeader({ title, onSeeAll }: { title: string; onSeeAll: () => void }) {
  return (
    <View style={styles.rail}>
      <Text style={styles.railTitle} accessibilityRole="header">
        {title}
      </Text>
      <Pressable
        onPress={onSeeAll}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={`See all ${title}`}>
        <Text maxFontSizeMultiplier={denseTextScale} style={styles.seeAll}>
          See all
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    flexDirection: 'row',
    paddingHorizontal: gutter,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  square: {
    width: 24,
    height: 24,
    backgroundColor: colors.text,
  },
  groupTitle: {
    fontFamily: fonts.serifBold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.55,
    color: colors.text,
  },
  rail: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: gutter,
  },
  railTitle: {
    flexShrink: 1,
    fontFamily: fonts.serifBold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.43,
    color: colors.text,
  },
  seeAll: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 16,
    color: colors.cyan,
  },
});
