import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, CheckCircle2, Library } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Colors from '../constants/Colors';
import Layout from '../constants/Layout';
import Button from '../components/ui/Button';

export default function ExportScreen() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleGoToLibrary = () => {
    router.replace('/(tabs)/library');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <ChevronLeft size={24} color={Colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Finalizing</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.content}>
        <View style={styles.statusContainer}>
          <CheckCircle2 size={64} color={Colors.success} />
          <Text style={styles.statusTitle}>Audiobook Ready!</Text>
          <Text style={styles.statusDescription}>
            Your audiobook has been created and is now available in your library.
          </Text>
          <Button
            title="Finish & Go to Library"
            onPress={handleGoToLibrary}
            fullWidth
            style={styles.mainButton}
            icon={<Library size={18} color={Colors.white} />}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.softBackground,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  content: {
    flex: 1,
    padding: Layout.spacing.lg,
    justifyContent: 'center',
  },
  mainButton: {
    marginTop: Layout.spacing.lg,
    backgroundColor: Colors.primary,
  },
  statusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.spacing.lg,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.gray[900],
    textAlign: 'center',
    marginTop: Layout.spacing.lg,
    marginBottom: Layout.spacing.sm,
  },
  statusDescription: {
    fontSize: 16,
    color: Colors.gray[600],
    textAlign: 'center',
    marginHorizontal: Layout.spacing.md,
  },
});
