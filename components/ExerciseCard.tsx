import { Theme, useTheme } from '@/Context/ThemeContext';
import { Exercise } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

const placeholderImage = require('../assets/images/icon.png');

interface ExerciseCardProps {
    exercise: Exercise;
    liked?: boolean;
    onToggleLike?: (exerciseId: string) => void;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, liked = false, onToggleLike }) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const [usePlaceholder, setUsePlaceholder] = useState(!exercise.imageUrl && !exercise.gifUrl);
    
    return (
        <View style={styles.card}>
            <Image
                source={
                    usePlaceholder
                        ? placeholderImage
                        : {
                              uri: exercise.imageUrl ?? exercise.gifUrl,
                          }
                }
                style={styles.thumbnail}
                resizeMode="cover"
                onError={() => setUsePlaceholder(true)}
            />
            <View style={styles.content}>
                <View style={styles.headerRow}>
                    <Text style={styles.title}>{exercise.name}</Text>
                    {onToggleLike ? (
                        <Pressable hitSlop={8} onPress={() => onToggleLike(exercise.id)}>
                            <Ionicons
                                name={liked ? 'heart' : 'heart-outline'}
                                size={22}
                                color={liked ? '#FC3058' : theme.colors.textSecondary}
                            />
                        </Pressable>
                    ) : null}
                </View>
                <View style={styles.metaRow}>
                    <Text style={styles.metaText}>{exercise.bodyPart}</Text>
                    <Text style={styles.dot}>•</Text>
                    <Text style={[styles.metaText, styles.metaTextLast]}>{exercise.target}</Text>
                </View>
            </View>
        </View>
    );
};

const createStyles = (theme: Theme) => {
    const { colors } = theme;
    return StyleSheet.create({
        card: {
            backgroundColor: colors.card,
            borderRadius: 24,
            marginBottom: 16,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: theme.mode === 'light' ? '#000' : 'transparent',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: theme.mode === 'light' ? 0.06 : 0,
            shadowRadius: 12,
            elevation: theme.mode === 'light' ? 3 : 0,
        },
        thumbnail: {
            width: '100%',
            height: 180,
        },
        content: {
            paddingHorizontal: 18,
            paddingVertical: 16,
        },
        headerRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        title: {
            fontSize: 18,
            fontWeight: '600',
            color: colors.text,
            textTransform: 'capitalize',
            marginBottom: 8,
            flex: 1,
            marginRight: 12,
        },
        metaRow: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        metaText: {
            fontSize: 14,
            color: colors.textSecondary,
            textTransform: 'capitalize',
            marginRight: 6,
        },
        metaTextLast: {
            marginRight: 0,
        },
        dot: {
            fontSize: 14,
            color: colors.border,
            marginRight: 6,
        },
    });
};

export default ExerciseCard;
