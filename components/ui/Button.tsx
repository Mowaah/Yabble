import React from 'react';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View
} from 'react-native';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const getButtonStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: Layout.borderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    };
    
    // Size styles
    let sizeStyle: ViewStyle = {};
    switch (size) {
      case 'sm':
        sizeStyle = { paddingVertical: 8, paddingHorizontal: 12 };
        break;
      case 'md':
        sizeStyle = { paddingVertical: 12, paddingHorizontal: 16 };
        break;
      case 'lg':
        sizeStyle = { paddingVertical: 16, paddingHorizontal: 24 };
        break;
    }
    
    // Variant styles
    let variantStyle: ViewStyle = {};
    switch (variant) {
      case 'primary':
        variantStyle = { backgroundColor: Colors.black };
        break;
      case 'secondary':
        variantStyle = { backgroundColor: Colors.lightPeach };
        break;
      case 'outline':
        variantStyle = { 
          backgroundColor: 'transparent', 
          borderWidth: 1, 
          borderColor: Colors.black 
        };
        break;
      case 'ghost':
        variantStyle = { backgroundColor: 'transparent' };
        break;
    }
    
    // Width style
    const widthStyle = fullWidth ? { width: '100%' } : {};
    
    // Disabled style
    const disabledStyle: ViewStyle = disabled ? { opacity: 0.5 } : {};
    
    return {
      ...baseStyle,
      ...sizeStyle,
      ...variantStyle,
      ...widthStyle,
      ...disabledStyle,
      ...style,
    };
  };
  
  const getTextStyles = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontWeight: '600',
    };
    
    // Size text styles
    let sizeTextStyle: TextStyle = {};
    switch (size) {
      case 'sm':
        sizeTextStyle = { fontSize: 14 };
        break;
      case 'md':
        sizeTextStyle = { fontSize: 16 };
        break;
      case 'lg':
        sizeTextStyle = { fontSize: 18 };
        break;
    }
    
    // Variant text styles
    let variantTextStyle: TextStyle = {};
    switch (variant) {
      case 'primary':
        variantTextStyle = { color: Colors.white };
        break;
      case 'secondary':
        variantTextStyle = { color: Colors.black };
        break;
      case 'outline':
      case 'ghost':
        variantTextStyle = { color: Colors.black };
        break;
    }
    
    return {
      ...baseTextStyle,
      ...sizeTextStyle,
      ...variantTextStyle,
      ...textStyle,
    };
  };

  return (
    <TouchableOpacity
      style={getButtonStyles()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' ? Colors.white : Colors.black} 
        />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={getTextStyles()}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
});