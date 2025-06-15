import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';
import { SafeAreaView } from 'react-native-safe-area-context';

const SkeletonPiece = ({ style }: { style: any }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return <Animated.View style={[styles.skeleton, { opacity }, style]} />;
};

export default function PlayerSkeleton() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Skeleton Header */}
      <View style={styles.header}>
        <SkeletonPiece style={styles.headerButton} />
        <SkeletonPiece style={{ width: '50%', height: 20, borderRadius: 4 }} />
        <SkeletonPiece style={styles.headerButton} />
      </View>

      {/* Skeleton Text Content */}
      <View style={styles.content}>
        <SkeletonPiece style={{ width: '90%', height: 16, borderRadius: 4, marginBottom: 12 }} />
        <SkeletonPiece style={{ width: '100%', height: 16, borderRadius: 4, marginBottom: 12 }} />
        <SkeletonPiece style={{ width: '80%', height: 16, borderRadius: 4, marginBottom: 12 }} />
        <SkeletonPiece style={{ width: '95%', height: 16, borderRadius: 4, marginBottom: 12 }} />
        <SkeletonPiece style={{ width: '70%', height: 16, borderRadius: 4, marginBottom: 12 }} />
      </View>

      {/* Skeleton Player */}
      <View style={styles.playerContainer}>
        <SkeletonPiece style={styles.slider} />
        <View style={styles.timeContainer}>
          <SkeletonPiece style={{ width: 40, height: 12, borderRadius: 4 }} />
          <SkeletonPiece style={{ width: 40, height: 12, borderRadius: 4 }} />
        </View>
        <View style={styles.controlsContainer}>
          <SkeletonPiece style={styles.controlButton} />
          <SkeletonPiece style={styles.skipButton} />
          <SkeletonPiece style={styles.playButton} />
          <SkeletonPiece style={styles.skipButton} />
          <SkeletonPiece style={styles.controlButton} />
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
  skeleton: {
    backgroundColor: Colors.gray[200],
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
  headerButton: {
    width: 24,
    height: 24,
    borderRadius: 4,
  },
  content: {
    flex: 1,
    padding: Layout.spacing.lg,
  },
  playerContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.sm,
    paddingBottom: Layout.spacing.lg,
    borderTopWidth: 1,
    borderColor: Colors.gray[200],
  },
  slider: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    marginVertical: 16,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.xs,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: Layout.spacing.md,
  },
  controlButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  skipButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
});
