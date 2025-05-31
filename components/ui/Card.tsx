import React from 'react';
import { 
  StyleSheet, 
  View, 
  ViewStyle,
  Pressable,
  Platform,
} from 'react-native';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  elevation?: 'none' | 'low' | 'medium' | 'high';
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export default function Card({
  children,
  style,
  onPress,
  elevation = 'low',
  padding = 'medium',
}: CardProps) {
  const getElevationStyle = (): ViewStyle => {
    if (Platform.OS === 'web') {
      switch (elevation) {
        case 'none':
          return {};
        case 'low':
          return {
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          } as ViewStyle;
        case 'medium':
          return {
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          } as ViewStyle;
        case 'high':
          return {
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
          } as ViewStyle;
      }
    } else {
      switch (elevation) {
        case 'none':
          return {};
        case 'low':
          return {
            shadowColor: Colors.black,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          };
        case 'medium':
          return {
            shadowColor: Colors.black,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 3,
            elevation: 4,
          };
        case 'high':
          return {
            shadowColor: Colors.black,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 5,
            elevation: 8,
          };
      }
    }
  };

  const getPaddingStyle = (): ViewStyle => {
    switch (padding) {
      case 'none':
        return { padding: 0 };
      case 'small':
        return { padding: Layout.spacing.sm };
      case 'medium':
        return { padding: Layout.spacing.md };
      case 'large':
        return { padding: Layout.spacing.lg };
    }
  };

  const cardStyle = StyleSheet.flatten([
    styles.card,
    getElevationStyle(),
    getPaddingStyle(),
    style,
  ]);

  if (onPress) {
    return (
      <Pressable 
        style={({ pressed }) => [
          cardStyle,
          pressed && styles.pressed,
        ]}
        onPress={onPress}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.md,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.9,
  },
});