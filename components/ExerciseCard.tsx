import { Exercise } from '@/types';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

const placeholderImage = require('../assets/images/icon.png');

interface ExerciseCardProps {
    exercise: Exercise;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise }) => {
    const [usePlaceholder, setUsePlaceholder] = useState(!exercise.imageUrl);
    return (
        <View style={styles.card}>
            <Image
                source={
                    usePlaceholder
                        ? placeholderImage
                        : {
                            uri: exercise.imageUrl,
                        }
                }
                style={styles.thumbnail}
                resizeMode="cover"
                onError={() => setUsePlaceholder(true)}
            />
            <View style={styles.content}>
                <Text style={styles.title}>{exercise.name}</Text>
                <View style={styles.metaRow}>
                    <Text style={styles.metaText}>{exercise.bodyPart}</Text>
                    <Text style={styles.dot}>•</Text>
                    <Text style={[styles.metaText, styles.metaTextLast]}>{exercise.target}</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        marginBottom: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 3,
    },
    thumbnail: {
        width: '100%',
        height: 180,
    },
    content: {
        paddingHorizontal: 18,
        paddingVertical: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1C1C1E',
        textTransform: 'capitalize',
        marginBottom: 8,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        fontSize: 14,
        color: '#6B7280',
        textTransform: 'capitalize',
        marginRight: 6,
    },
    metaTextLast: {
        marginRight: 0,
    },
    dot: {
        fontSize: 14,
        color: '#D1D5DB',
        marginRight: 6,
    },
});

export default ExerciseCard;