import React from 'react';
import { Image, View } from 'react-native';

type VideoProps = {
  source?: unknown;
  style?: object;
  muted?: boolean;
  repeat?: boolean;
  resizeMode?: string;
  rate?: number;
  ignoreSilentSwitch?: string;
  controls?: boolean;
  controlsStyles?: object;
  [key: string]: unknown;
};

const Video = React.forwardRef<View, VideoProps>(({ style, source }, ref) => (
  <View ref={ref} style={style}>
    <Image
      source={source as any}
      resizeMode="cover"
      style={{ width: '100%', height: '100%' }}
    />
  </View>
));

Video.displayName = 'Video';

export default Video;
