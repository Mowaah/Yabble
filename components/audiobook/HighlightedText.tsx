import React, { useMemo, useRef, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';

interface HighlightedTextProps {
  text: string;
  currentPosition: number;
  duration: number;
  fontSize?: number;
  lineHeight?: number;
}

// Data structures for our list
interface Word {
  text: string;
  startTime: number;
  endTime: number;
}
interface Line {
  key: string;
  words: Word[];
}

const HighlightedText: React.FC<HighlightedTextProps> = ({
  text,
  currentPosition,
  duration,
  fontSize = 18,
  lineHeight = 30,
}) => {
  const listRef = useRef<FlashList<Line>>(null);
  const activeLineIndex = useRef<number>(0);

  // Memoize the expensive computation of turning a string into structured lines and words.
  // This now only runs if the text or duration changes.
  const lines = useMemo<Line[]>(() => {
    if (!text || !duration) return [];

    let wordCount = 0;
    const allWords = text.split(/\s+/).filter(Boolean);
    const totalWords = allWords.length;

    // Create lines of text, which is better for performance.
    return text.split('\n').map((lineText, lineIndex) => {
      const wordsInLine = lineText.split(/\s+/).filter(Boolean);
      return {
        key: `line-${lineIndex}`,
        words: wordsInLine.map((wordText) => {
          // Estimate start and end time for each word
          const startTime = (wordCount / totalWords) * duration;
          const endTime = ((wordCount + 1) / totalWords) * duration;
          wordCount++;
          return { text: wordText, startTime, endTime };
        }),
      };
    });
  }, [text, duration]);

  // This effect finds the current active line and smoothly scrolls to it.
  // It's optimized to not run on every single position change.
  useEffect(() => {
    // Only check every ~500ms to avoid performance issues
    if (Math.round(currentPosition % 500) > 50) return;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.words.length === 0) continue;

      const firstWord = line.words[0];
      const lastWord = line.words[line.words.length - 1];

      if (currentPosition >= firstWord.startTime && currentPosition <= lastWord.endTime) {
        if (i !== activeLineIndex.current) {
          activeLineIndex.current = i;
          listRef.current?.scrollToIndex({
            index: i,
            animated: true,
            viewPosition: 0.3, // Keep the line near the top-center
          });
        }
        break;
      }
    }
  }, [currentPosition, lines]);

  // This component renders a single line, with word-by-word highlighting.
  const renderLine = ({ item }: { item: Line }) => (
    <Text style={[styles.textWrapper, { fontSize, lineHeight }]}>
      {item.words.map((word, index) => {
        const isActive = currentPosition >= word.startTime && currentPosition < word.endTime;
        return (
          <Text key={index} style={[styles.wordSegment, isActive && styles.activeSegment]}>
            {`${word.text} `}
          </Text>
        );
      })}
    </Text>
  );

  return (
    <View style={styles.container}>
      <FlashList
        ref={listRef}
        data={lines}
        renderItem={renderLine}
        keyExtractor={(item) => item.key}
        estimatedItemSize={lineHeight * 2} // Help FlashList optimize rendering
        contentContainerStyle={styles.content}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Layout.spacing.lg,
  },
  textWrapper: {
    color: Colors.gray[700],
    marginBottom: Layout.spacing.sm, // Space between paragraphs
  },
  wordSegment: {
    color: Colors.gray[700],
  },
  activeSegment: {
    color: Colors.primary,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderRadius: 4,
  },
});

export default React.memo(HighlightedText);
