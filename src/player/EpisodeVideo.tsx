import { VideoView } from 'expo-video';
import { StyleSheet } from 'react-native';

import type { useEpisodePlayer } from './useEpisodePlayer';

export function EpisodeVideo({ playback }: { playback: ReturnType<typeof useEpisodePlayer> }) {
  return (
    <VideoView
      player={playback.player}
      nativeControls={false}
      contentFit="cover"
      allowsPictureInPicture={false}
      // Otherwise iOS scans paused frames for Live Text and adds its own VoiceOver elements.
      allowsVideoFrameAnalysis={false}
      onFirstFrameRender={playback.onFirstFrameRender}
      style={StyleSheet.absoluteFill}
    />
  );
}
