import React, { useMemo, useRef, useCallback } from 'react';
import { Text, View, StyleSheet, ScrollView } from 'react-native';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';

interface HighlightedTextProps {
  text: string;
  currentPosition: number;
  duration: number;
  isPlaying: boolean;
  fontSize?: number;
  lineHeight?: number;
}

interface TextSegment {
  text: string;
  startTime: number;
  endTime: number;
  index: number;
  isWord: boolean;
}

const HighlightedText: React.FC<HighlightedTextProps> = ({
  text,
  currentPosition,
  duration,
  isPlaying,
  fontSize = 18,
  lineHeight = 30,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);

  // Memoize text segments - only recalculate when text or duration changes
  const textSegments = useMemo(() => {
    if (!text || !duration) return [];

    const segments: TextSegment[] = [];
    const regex = /(\S+|\s+)/g;
    let match;
    let totalChars = 0;
    let wordIndex = 0;
    const textLength = text.length;

    while ((match = regex.exec(text)) !== null) {
      const segment = match[0];
      const isWord = /\S/.test(segment);
      const segmentLength = segment.length;

      let startTime = 0;
      let endTime = 0;

      if (isWord) {
        startTime = (totalChars / textLength) * duration;
        endTime = ((totalChars + segmentLength) / textLength) * duration;
      }

      segments.push({
        text: segment,
        startTime,
        endTime,
        index: isWord ? wordIndex++ : -1,
        isWord,
      });

      totalChars += segmentLength;
    }

    return segments;
  }, [text, duration]);

  // More precise position updates for better word tracking
  const throttledPosition = useMemo(() => {
    // Round to nearest 50ms for better word tracking while still optimizing performance
    return Math.floor(currentPosition / 50) * 50;
  }, [currentPosition]);

  // Find active segment with better handling for short words
  const activeSegmentIndex = useMemo(() => {
    if (!isPlaying || textSegments.length === 0) return -1;

    let bestMatch = -1;
    let closestDistance = Infinity;

    // Find the word that's closest to the current position
    for (let i = 0; i < textSegments.length; i++) {
      const segment = textSegments[i];
      if (!segment.isWord) continue;

      // Check if position is within this word's time range
      if (throttledPosition >= segment.startTime && throttledPosition < segment.endTime) {
        return i;
      }

      // If no exact match, find the closest upcoming word
      if (segment.startTime > throttledPosition) {
        const distance = segment.startTime - throttledPosition;
        if (distance < closestDistance) {
          closestDistance = distance;
          bestMatch = i;
        }
      }
    }

    // If we're very close to the next word (within 100ms), highlight it
    return closestDistance < 100 ? bestMatch : -1;
  }, [throttledPosition, textSegments, isPlaying]);

  // Memoize render function for segments
  const renderSegment = useCallback(
    (segment: TextSegment, index: number) => {
      if (!segment.isWord) {
        return (
          <Text key={`ws-${index}`} style={{ fontSize }}>
            {segment.text}
          </Text>
        );
      }

      const isActive = index === activeSegmentIndex;
      const hasPlayed = throttledPosition > segment.endTime;

      return (
        <Text
          key={`word-${index}`}
          style={[
            styles.wordSegment,
            { fontSize },
            isActive && styles.activeSegment,
            hasPlayed && styles.playedSegment,
          ]}
        >
          {segment.text}
        </Text>
      );
    },
    [fontSize, activeSegmentIndex, throttledPosition]
  );

  // Fallback for empty segments
  if (textSegments.length === 0) {
    return (
      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.fallbackText, { fontSize, lineHeight }]}>{text}</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews={true} // Performance optimization
    >
      <View style={styles.textContainer}>
        <Text style={[styles.textWrapper, { fontSize, lineHeight }]}>{textSegments.map(renderSegment)}</Text>
      </View>
    </ScrollView>
  );
};

HighlightedText.displayName = 'HighlightedText';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xl,
  },
  textContainer: {
    flex: 1,
  },
  textWrapper: {
    color: Colors.gray[700],
  },
  wordSegment: {
    color: Colors.gray[700],
  },
  activeSegment: {
    color: '#8B5CF6', // Direct purple color to ensure it's applied
    fontWeight: '900',
    backgroundColor: 'rgba(139, 92, 246, 0.1)', // Light purple background
    paddingHorizontal: 2,
    borderRadius: 3,
  },
  playedSegment: {
    color: Colors.gray[500],
    opacity: 0.8,
  },
  fallbackText: {
    color: Colors.gray[800],
  },
});

export default HighlightedText;
