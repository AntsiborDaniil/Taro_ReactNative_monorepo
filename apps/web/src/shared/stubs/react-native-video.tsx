import React from 'react';
import { View } from 'react-native';

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

const Video = React.forwardRef<View, VideoProps>(({ style }, ref) => (
  <View ref={ref} style={style} />
));

Video.displayName = 'Video';

export default Video;
