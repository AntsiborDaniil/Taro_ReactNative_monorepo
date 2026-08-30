import React, { useEffect, useRef } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

type VideoSource =
  | number
  | string
  | { uri?: string }
  | { uri?: string }[]
  | null
  | undefined;

type VideoProps = {
  source?: VideoSource;
  style?: StyleProp<ViewStyle>;
  muted?: boolean;
  repeat?: boolean;
  resizeMode?: string;
  rate?: number;
  ignoreSilentSwitch?: string;
  controls?: boolean;
  controlsStyles?: object;
  [key: string]: unknown;
};

function resolveUri(source: VideoSource): string | null {
  if (source == null) {
    return null;
  }
  if (typeof source === 'string') {
    return source;
  }
  if (Array.isArray(source)) {
    return resolveUri(source[0]);
  }
  if (typeof source === 'object' && typeof source.uri === 'string') {
    return source.uri;
  }
  // Numeric Metro asset ids need Image/AssetRegistry — broken on web.
  // Callers should pass { uri } (see AIAnimation web paths).
  return null;
}

/**
 * Web replacement for react-native-video: real HTML5 <video> (mp4 loop).
 * Pass `source={{ uri: '/videos/loader.mp4' }}` — do not pass require() numbers.
 */
const Video = React.forwardRef<View, VideoProps>(
  (
    {
      style,
      source,
      muted = true,
      repeat = true,
      resizeMode = 'cover',
      controls = false,
    },
    ref
  ) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const uri = resolveUri(source);

    useEffect(() => {
      const el = videoRef.current;
      if (!el || !uri) {
        return;
      }
      el.muted = muted !== false;
      el.loop = !!repeat;
      el.playsInline = true;
      const play = el.play();
      if (play && typeof play.catch === 'function') {
        play.catch(() => undefined);
      }
    }, [uri, muted, repeat]);

    const objectFit =
      resizeMode === 'contain'
        ? 'contain'
        : resizeMode === 'stretch'
          ? 'fill'
          : 'cover';

    return (
      <View ref={ref} style={[styles.wrap, style]}>
        {uri ? (
          // @ts-expect-error RN-web allows DOM video
          <video
            ref={videoRef}
            src={uri}
            muted={muted !== false}
            loop={!!repeat}
            playsInline
            autoPlay
            controls={!!controls}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: '100%',
              objectFit,
              backgroundColor: '#0a0f18',
            }}
          />
        ) : null}
      </View>
    );
  }
);

Video.displayName = 'Video';

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: '#0a0f18',
  },
});

export default Video;
