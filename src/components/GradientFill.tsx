import MaskedViewBase from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentType, ReactElement } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { gradient } from '@/theme';

// masked-view 0.3's class typings predate React 19's JSX types; the component itself is fine.
const MaskedView = MaskedViewBase as unknown as ComponentType<ViewProps & { maskElement: ReactElement }>;

// Paints one left-to-right brand gradient through the shapes of its children.
export function GradientFill({ children }: { children: ReactElement }) {
  return (
    <MaskedView maskElement={children}>
      <LinearGradient colors={gradient} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}>
        <View style={styles.sizer}>{children}</View>
      </LinearGradient>
    </MaskedView>
  );
}

const styles = StyleSheet.create({
  sizer: {
    opacity: 0,
  },
});
