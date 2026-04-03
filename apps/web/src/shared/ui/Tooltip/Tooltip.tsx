import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import TooltipBase, { TooltipProps } from 'react-native-walkthrough-tooltip';
import { COLORS } from '../../themes';

type Props = {
  styleQuestion?: StyleSheet;
};

const Tooltip = ({ children, ...rest }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  return (
    <TooltipBase
      {...rest}
      contentStyle={styles.content}
      isVisible={isVisible}
      arrowSize={{ width: 0, height: 0 }}
      onClose={() => setIsVisible(false)}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          setIsVisible(true);
        }}
      >
        {children}
      </TouchableOpacity>
    </TooltipBase>
  );
};

const styles = StyleSheet.create({
  content: {
    backgroundColor: COLORS.Background,
    borderRadius: 16,
    padding: 12,
  },
});

export default Tooltip;
