import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

type VideoProps = {
  source?: unknown;
  style?: StyleProp<ViewStyle>;
  muted?: boolean;
  repeat?: boolean;
  resizeMode?: string;
  rate?: number;
  ignoreSilentSwitch?: string;
  controls?: boolean;
  controlsStyles?: object;
};

const Video = React.forwardRef<View, VideoProps>(({ style }, ref) => (
  <View ref={ref} style={style} />
));

Video.displayName = 'Video';

export default Video;
