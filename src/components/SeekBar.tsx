import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { formatTime } from '@/format';
import { colors } from '@/theme';

const KNOB = 12;

interface Props {
  position: number;
  duration: number;
  onSeek: (seconds: number) => void;
}

export function SeekBar({ position, duration, onSeek }: Props) {
  const [width, setWidth] = useState(0);
  const fraction = duration > 0 ? Math.min(1, Math.max(0, position / duration)) : 0;

  return (
    <Pressable
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      onPress={(event) => {
        if (width > 0) onSeek((event.nativeEvent.locationX / width) * duration);
      }}
      accessibilityRole="adjustable"
      accessibilityLabel="Playback position"
      accessibilityValue={{ text: `${formatTime(position)} of ${formatTime(duration)}` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(event) => onSeek(position + (event.nativeEvent.actionName === 'increment' ? 5 : -5))}
      style={styles.hitArea}>
      <View style={styles.track} pointerEvents="none">
        <View style={[styles.fill, { width: fraction * width }]} />
      </View>
      <View style={[styles.knob, { left: fraction * width - KNOB / 2 }]} pointerEvents="none" />
    </Pressable>
  );
}


const styles = StyleSheet.create({
  hitArea: {
    height: 44,
    justifyContent: 'center',
  },
  track: {
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.28)',
    overflow: 'hidden',
  },
  fill: {
    height: 3,
    backgroundColor: colors.cyan,
  },
  knob: {
    position: 'absolute',
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    backgroundColor: colors.cyan,
  },
});
