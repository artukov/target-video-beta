import { useEffect } from 'react';
import { AccessibilityInfo, StyleSheet, Text } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { colors, displayTextScale, fonts } from '@/theme';

export function Narration({ text }: { text: string }) {
  useEffect(() => {
    AccessibilityInfo.announceForAccessibilityWithOptions(text, { queue: true });
  }, [text]);

  return (
    <Animated.View entering={FadeIn.duration(250)} exiting={FadeOut.duration(200)} pointerEvents="none" style={styles.wrap}>
      <Text
        style={styles.text}
        maxFontSizeMultiplier={displayTextScale}
        lineBreakStrategyIOS="push-out"
        textBreakStrategy="balanced">
        {text}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    // Centred and clear of the like/share rail, which sits 16 pt in from the edge.
    marginHorizontal: 56,
    marginBottom: 24,
    alignItems: 'center',
  },
  text: {
    textAlign: 'center',
    fontFamily: fonts.serifItalic,
    fontSize: 19,
    lineHeight: 25,
    color: colors.text,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 1 },
  },
});
