import { Tabs } from 'expo-router/js-tabs';
import type { LucideIcon } from 'lucide-react-native';
import Bookmark from 'lucide-react-native/icons/bookmark';
import Compass from 'lucide-react-native/icons/compass';
import Heart from 'lucide-react-native/icons/heart';
import House from 'lucide-react-native/icons/house';
import User from 'lucide-react-native/icons/user';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, denseTextScale, fonts } from '@/theme';

function tab(title: string, Icon: LucideIcon) {
  return {
    title,
    tabBarIcon: ({ focused }: { focused: boolean }) => (
      <Icon size={24} color={focused ? colors.cyan : colors.textMuted} strokeWidth={1.9} />
    ),
    tabBarLabel: ({ focused }: { focused: boolean }) => (
      <Text
        maxFontSizeMultiplier={denseTextScale}
        numberOfLines={1}
        style={{
          color: focused ? colors.cyan : colors.textMuted,
          fontSize: 10,
          fontFamily: focused ? fonts.sansSemiBold : fonts.sans,
        }}>
        {title}
      </Text>
    ),
  };
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.tabDivider,
          borderTopWidth: 1,
          height: 62 + insets.bottom,
          paddingTop: 7,
        },
        sceneStyle: { backgroundColor: colors.bg },
      }}>
      <Tabs.Screen name="index" options={tab('Home', House)} />
      <Tabs.Screen name="discover" options={tab('Discover', Compass)} />
      <Tabs.Screen name="romance" options={tab('Romance', Heart)} />
      <Tabs.Screen name="library" options={tab('Library', Bookmark)} />
      <Tabs.Screen name="profile" options={tab('Profile', User)} />
    </Tabs>
  );
}
