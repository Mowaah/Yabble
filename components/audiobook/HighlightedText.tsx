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

interface Word {
  text: string;
  start: number;
  end: number;
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

  const lines = useMemo<Line[]>(() => {
    if (!text) return [];

    try {
      // First, try to parse the text as JSON, which is the new format.
      const parsedContent = JSON.parse(text);

      if (parsedContent.alignment) {
        // --- Logic for NEW data with precise timings ---
        const { characters, character_start_times_seconds, character_end_times_seconds } = parsedContent.alignment;
        const originalText = parsedContent.originalText || '';
        const words = originalText.split(/(\s+)/);

        let charIndex = 0;
        const wordTimings: Word[] = [];

        words.forEach((wordStr: string) => {
          if (wordStr.trim().length === 0) {
            charIndex += wordStr.length;
            return;
          }

          const startCharIndex = charIndex;
          const endCharIndex = charIndex + wordStr.length - 1;

          const start = character_start_times_seconds[startCharIndex] * 1000;
          const end = character_end_times_seconds[endCharIndex] * 1000;

          wordTimings.push({ text: wordStr, start, end });
          charIndex += wordStr.length;
        });

        const originalLines = originalText.split('\n');
        let wordIdx = 0;
        return originalLines
          .map((lineText: string, index: number) => {
            const wordsInLineText = lineText.trim().split(/\s+/).filter(Boolean);
            const wordsForThisLine = wordTimings.slice(wordIdx, wordIdx + wordsInLineText.length);
            wordIdx += wordsInLineText.length;
            return { key: `line-${index}`, words: wordsForThisLine };
          })
          .filter((line: Line) => line.words.length > 0);
      }

      // If it's JSON but doesn't have alignment, use originalText for estimation.
      const textToEstimate = parsedContent.originalText || text;
      return estimateTimings(textToEstimate, duration);
    } catch (e) {
      // --- Logic for OLD data (plain text) ---
      // If parsing fails, it's a plain string. Use estimation.
      return estimateTimings(text, duration);
    }
  }, [text, duration]);

  // This effect finds the current active line and smoothly scrolls to it.
  useEffect(() => {
    if (!lines || lines.length === 0 || currentPosition === 0) return;

    let activeLine = -1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (
        line.words.length > 0 &&
        currentPosition >= line.words[0].start &&
        currentPosition <= line.words[line.words.length - 1].end
      ) {
        activeLine = i;
        break;
      }
    }

    if (activeLine !== -1) {
      listRef.current?.scrollToIndex({
        index: activeLine,
        animated: true,
        viewPosition: 0.3,
      });
    }
  }, [lines, currentPosition]);

  const renderLine = ({ item }: { item: Line }) => (
    <Text style={[styles.textWrapper, { fontSize, lineHeight }]}>
      {item.words.map((word, index) => {
        const isActive = currentPosition >= word.start && currentPosition < word.end;
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
        estimatedItemSize={lineHeight * 2}
        contentContainerStyle={styles.content}
        extraData={currentPosition}
      />
    </View>
  );
};

// This helper function contains the improved estimation logic
function estimateTimings(text: string, duration: number): Line[] {
  const words = text.split(/\s+/).filter(Boolean);
  const totalWords = words.length;
  if (totalWords === 0 || duration === 0) {
    return [{ key: 'line-0', words: [{ text, start: 0, end: duration }] }];
  }

  const avgTimePerWord = duration / totalWords;
  let currentTime = 0;
  const wordTimings: Word[] = [];

  words.forEach((word) => {
    let wordDuration = avgTimePerWord;
    // Add pauses for punctuation
    if (word.endsWith(',')) wordDuration += 200; // Short pause
    if (word.endsWith('.') || word.endsWith('!') || word.endsWith('?')) {
      wordDuration += 400; // Longer pause
    }

    wordTimings.push({
      text: word,
      start: currentTime,
      end: currentTime + wordDuration,
    });
    currentTime += wordDuration;
  });

  // Group into lines for rendering
  const originalLines = text.split('\n');
  let wordIdx = 0;
  return originalLines
    .map((lineText, index) => {
      const wordsInLineText = lineText.trim().split(/\s+/).filter(Boolean);
      const wordsForThisLine = wordTimings.slice(wordIdx, wordIdx + wordsInLineText.length);
      wordIdx += wordsInLineText.length;
      return { key: `line-${index}`, words: wordsForThisLine };
    })
    .filter((line) => line.words.length > 0);
}

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
