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
} from 'react-native';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';
import { Eye, EyeOff } from 'lucide-react-native';

interface InputProps extends TextInputProps {
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
  ...rest
}: InputProps) {
  const [secureTextEntry, setSecureTextEntry] = useState(type === 'password');
  
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
        onPress={() => setSecureTextEntry(!secureTextEntry)}
        style={styles.iconContainer}
      >
        {secureTextEntry ? (
          <Eye size={20} color={Colors.gray[500]} />
        ) : (
          <EyeOff size={20} color={Colors.gray[500]} />
        )}
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, labelStyle]}>
          {label}
        </Text>
      )}
      
      <View style={[
        styles.inputContainer,
        error ? styles.inputError : null,
      ]}>
        {leftIcon && (
          <View style={styles.iconContainer}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          style={[
            styles.input,
            leftIcon ? styles.inputWithLeftIcon : null,
            (rightIcon || type === 'password') ? styles.inputWithRightIcon : null,
            inputStyle,
          ]}
          placeholderTextColor={Colors.gray[400]}
          keyboardType={getKeyboardType()}
          secureTextEntry={secureTextEntry}
          {...rest}
        />
        
        {renderPasswordIcon() || rightIcon && (
          <View style={styles.iconContainer}>
            {rightIcon}
          </View>
        )}
      </View>
      
      {error && (
        <Text style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Layout.spacing.md,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: Layout.spacing.xs,
    color: Colors.black,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.white,
  },
  input: {
    flex: 1,
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.md,
    fontSize: 16,
    color: Colors.black,
  },
  inputWithLeftIcon: {
    paddingLeft: 8,
  },
  inputWithRightIcon: {
    paddingRight: 8,
  },
  inputError: {
    borderColor: Colors.error,
  },
  iconContainer: {
    paddingHorizontal: Layout.spacing.sm,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    marginTop: 4,
  },
});