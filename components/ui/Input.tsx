import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  Text,
  TextInputProps,
  ViewStyle,
  TextStyle,
  Pressable,
  Animated,
} from 'react-native';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';
import { Eye, EyeOff } from 'lucide-react-native';

interface InputProps extends Omit<TextInputProps, 'secureTextEntry'> {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: TextStyle;
  rightIcon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  type?: 'text' | 'password' | 'number' | 'email';
}

export default function Input({
  label,
  error,
  containerStyle,
  labelStyle,
  inputStyle,
  rightIcon,
  leftIcon,
  type = 'text',
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const [isTextSecure, setIsTextSecure] = useState(type === 'password');
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (onFocus) {
      onFocus(e);
    }
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (onBlur) {
      onBlur(e);
    }
  };

  // Determine input keyboard type based on type prop
  const getKeyboardType = () => {
    switch (type) {
      case 'number':
        return 'numeric';
      case 'email':
        return 'email-address';
      default:
        return 'default';
    }
  };

  // Password visibility toggle
  const renderPasswordIcon = () => {
    if (type !== 'password') return null;

    return (
      <Pressable
        onPress={() => setIsTextSecure(!isTextSecure)}
        style={styles.iconContainer}
      >
        {isTextSecure ? (
          <Eye size={20} color="#9ca3af" />
        ) : (
          <EyeOff size={20} color="#9ca3af" />
        )}
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}

      <View
        style={[
          styles.inputContainer,
          error
            ? styles.inputError
            : isFocused
            ? styles.inputFocused
            : styles.inputDefault,
        ]}
      >
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}

        <TextInput
          style={[
            styles.input,
            leftIcon ? styles.inputWithLeftIcon : null,
            rightIcon || type === 'password' ? styles.inputWithRightIcon : null,
            inputStyle,
          ]}
          placeholderTextColor="#9ca3af"
          keyboardType={getKeyboardType()}
          secureTextEntry={isTextSecure}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />

        {renderPasswordIcon() ||
          (rightIcon && (
            <View style={styles.rightIconContainer}>{rightIcon}</View>
          ))}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Layout.spacing.md,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Layout.spacing.sm,
    color: '#374151',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#f9fafb',
    minHeight: 56,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputDefault: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inputFocused: {
    borderWidth: 2,
    borderColor: '#ed9c01',
    backgroundColor: '#ffffff',
    shadowColor: '#ed9c01',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  inputError: {
    borderWidth: 2,
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#111827',
    fontWeight: '400',
  },
  inputWithLeftIcon: {
    paddingLeft: 12,
  },
  inputWithRightIcon: {
    paddingRight: 12,
  },
  leftIconContainer: {
    paddingRight: 12,
  },
  rightIconContainer: {
    paddingLeft: 12,
  },
  iconContainer: {
    paddingLeft: 12,
    paddingVertical: 8,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
});
