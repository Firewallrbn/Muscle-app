import { Theme, useTheme } from '@/Context/ThemeContext';
import { Exercise } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const placeholderImage = require('../assets/images/icon.png');

interface ExerciseCardProps {
    exercise: Exercise;
    liked?: boolean;
    onToggleLike?: (exerciseId: string) => void;
    onPress?: (exercise: Exercise) => void;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, liked = false, onToggleLike, onPress }) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const [usePlaceholder, setUsePlaceholder] = useState(!exercise.imageUrl && !exercise.gifUrl);
    
    const CardWrapper = onPress ? TouchableOpacity : View;
    const cardWrapperProps = onPress ? { onPress: () => onPress(exercise), activeOpacity: 0.7 } : {};
    
    return (
        <CardWrapper style={styles.card} {...cardWrapperProps}>
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
                    <View style={styles.chip}>
                        <Text style={styles.chipText}>{exercise.bodyPart}</Text>
                    </View>
                    <View style={styles.chip}>
                        <Text style={styles.chipText}>{exercise.target}</Text>
                    </View>
                    {exercise.equipment && (
                        <View style={[styles.chip, styles.chipEquipment]}>
                            <Ionicons name="barbell-outline" size={12} color={theme.colors.secondary} />
                            <Text style={[styles.chipText, styles.chipTextEquipment]}>{exercise.equipment}</Text>
                        </View>
                    )}
                </View>
                {onPress && (
                    <View style={styles.tapHint}>
                        <Text style={styles.tapHintText}>Toca para ver detalles</Text>
                        <Ionicons name="chevron-forward" size={14} color={theme.colors.textSecondary} />
                    </View>
                )}
            </View>
        </CardWrapper>
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
            marginBottom: 12,
            flex: 1,
            marginRight: 12,
        },
        metaRow: {
            flexDirection: 'row',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
        },
        chip: {
            backgroundColor: colors.accent + '15',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
        },
        chipText: {
            fontSize: 12,
            color: colors.accent,
            textTransform: 'capitalize',
            fontWeight: '600',
        },
        chipEquipment: {
            backgroundColor: colors.secondary + '15',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
        },
        chipTextEquipment: {
            color: colors.secondary,
        },
        tapHint: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
            marginTop: 12,
            gap: 4,
        },
        tapHintText: {
            fontSize: 12,
            color: colors.textSecondary,
        },
    });
};

export default ExerciseCard;
