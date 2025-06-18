import React from 'react';
import { Modal, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';
import Button from './Button';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttonText: string;
  onClose: () => void;
}

export default function CustomAlert({ visible, title, message, buttonText, onClose }: CustomAlertProps) {
  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.iconContainer}>
            <CheckCircle size={40} color={Colors.success} />
          </View>

          <Text style={styles.modalTitle}>{title}</Text>

          <Text style={styles.modalText}>{message}</Text>

          <Button title={buttonText} onPress={onClose} style={styles.button} textStyle={styles.buttonText} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 15, 35, 0.8)',
  },
  modalView: {
    margin: Layout.spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
    maxWidth: 400,
  },
  iconContainer: {
    marginBottom: Layout.spacing.md,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Layout.spacing.md,
    textAlign: 'center',
  },
  modalText: {
    marginBottom: Layout.spacing.xl,
    textAlign: 'center',
    fontSize: 16,
    color: Colors.gray[600],
    lineHeight: 24,
  },
  button: {
    width: '100%',
    backgroundColor: Colors.primary,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
