import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';

interface SliderProps {
  minimumValue?: number;
  maximumValue?: number;
  value: number;
  onValueChange: (value: number) => void;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
  thumbSize?: number;
  trackHeight?: number;
}

export default function Slider({
  minimumValue = 0,
  maximumValue = 1,
  value,
  onValueChange,
  minimumTrackTintColor = Colors.black,
  maximumTrackTintColor = Colors.gray[300],
  thumbTintColor = Colors.black,
  thumbSize = 16,
  trackHeight = 4,
}: SliderProps) {
  // Calculate position based on value
  const calculatePosition = (val: number) => {
    return ((val - minimumValue) / (maximumValue - minimumValue)) * 100;
  };
  
  // Calculate value based on position
  const calculateValue = (position: number, width: number) => {
    const percent = Math.max(0, Math.min(100, (position / width) * 100));
    return minimumValue + (percent / 100) * (maximumValue - minimumValue);
  };
  
  // Set up animated values
  const trackWidth = useSharedValue(0);
  const initialPosition = calculatePosition(value);
  const position = useSharedValue(initialPosition);
  
  // Gesture handler for thumb
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_evt, ctx: any) => {
      ctx.startX = position.value;
    },
    onActive: (evt, ctx) => {
      const newPosition = ctx.startX + (evt.translationX / trackWidth.value) * 100;
      position.value = Math.max(0, Math.min(100, newPosition));
      
      const newValue = minimumValue + (position.value / 100) * (maximumValue - minimumValue);
      runOnJS(onValueChange)(newValue);
    },
    onFinish: () => {
      position.value = withSpring(position.value);
    },
  });
  
  // Update position when value changes
  React.useEffect(() => {
    const newPosition = calculatePosition(value);
    position.value = newPosition;
  }, [value]);
  
  // Animated styles for track and thumb
  const thumbStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: (position.value / 100) * trackWidth.value - thumbSize / 2 }],
    };
  });
  
  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${position.value}%`,
    };
  });
  
  // Handle track layout to get width
  const onTrackLayout = (event: any) => {
    trackWidth.value = event.nativeEvent.layout.width;
  };
  
  return (
    <View style={styles.container}>
      <View 
        style={[styles.track, { height: trackHeight, backgroundColor: maximumTrackTintColor }]}
        onLayout={onTrackLayout}
      >
        <Animated.View 
          style={[
            styles.progress, 
            { height: trackHeight, backgroundColor: minimumTrackTintColor },
            progressStyle,
          ]} 
        />
      </View>
      
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View 
          style={[
            styles.thumb, 
            { 
              width: thumbSize, 
              height: thumbSize, 
              borderRadius: thumbSize / 2,
              backgroundColor: thumbTintColor,
            },
            thumbStyle,
          ]} 
        />
      </PanGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
  },
  track: {
    width: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progress: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '0%',
  },
  thumb: {
    position: 'absolute',
    top: '50%',
    marginTop: -8, // -thumbSize/2
    elevation: 3,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
});