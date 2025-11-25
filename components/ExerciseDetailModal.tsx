import { Theme, useTheme } from '@/Context/ThemeContext';
import { ExerciseDetails } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ExerciseDetailModalProps {
    visible: boolean;
    exercise: ExerciseDetails | null;
    loading: boolean;
    onClose: () => void;
}

const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
        case 'beginner':
            return '#4CAF50';
        case 'intermediate':
            return '#FF9800';
        case 'expert':
        case 'advanced':
            return '#F44336';
        default:
            return '#9E9E9E';
    }
};

const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
        case 'beginner':
            return 'Principiante';
        case 'intermediate':
            return 'Intermedio';
        case 'expert':
        case 'advanced':
            return 'Avanzado';
        default:
            return difficulty;
    }
};

const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({
    visible,
    exercise,
    loading,
    onClose,
}) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Handle bar */}
                    <View style={styles.handleBar} />

                    {/* Close button */}
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Ionicons name="close" size={24} color={theme.colors.text} />
                    </TouchableOpacity>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={theme.colors.accent} />
                            <Text style={styles.loadingText}>Cargando detalles...</Text>
                        </View>
                    ) : exercise ? (
                        <ScrollView
                            style={styles.scrollView}
                            showsVerticalScrollIndicator={false}
                            bounces={false}
                        >
                            {/* Exercise Image/GIF */}
                            {(exercise.gifUrl || exercise.imageUrl) && (
                                <Image
                                    source={{ uri: exercise.gifUrl || exercise.imageUrl }}
                                    style={styles.exerciseImage}
                                    resizeMode="cover"
                                />
                            )}

                            {/* Exercise Name */}
                            <Text style={styles.exerciseName}>{exercise.name}</Text>

                            {/* Tags Row */}
                            <View style={styles.tagsContainer}>
                                {/* Difficulty */}
                                {exercise.difficulty && (
                                    <View style={[styles.tag, { backgroundColor: getDifficultyColor(exercise.difficulty) + '20' }]}>
                                        <View style={[styles.tagDot, { backgroundColor: getDifficultyColor(exercise.difficulty) }]} />
                                        <Text style={[styles.tagText, { color: getDifficultyColor(exercise.difficulty) }]}>
                                            {getDifficultyLabel(exercise.difficulty)}
                                        </Text>
                                    </View>
                                )}

                                {/* Category */}
                                {exercise.category && (
                                    <View style={[styles.tag, { backgroundColor: theme.colors.secondary + '20' }]}>
                                        <Ionicons name="fitness" size={14} color={theme.colors.secondary} />
                                        <Text style={[styles.tagText, { color: theme.colors.secondary }]}>
                                            {exercise.category}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Info Cards */}
                            <View style={styles.infoGrid}>
                                <View style={styles.infoCard}>
                                    <Ionicons name="body" size={20} color={theme.colors.accent} />
                                    <Text style={styles.infoLabel}>Parte del cuerpo</Text>
                                    <Text style={styles.infoValue}>{exercise.bodyPart}</Text>
                                </View>

                                <View style={styles.infoCard}>
                                    <Ionicons name="locate" size={20} color={theme.colors.accent} />
                                    <Text style={styles.infoLabel}>Músculo objetivo</Text>
                                    <Text style={styles.infoValue}>{exercise.target}</Text>
                                </View>

                                {exercise.equipment && (
                                    <View style={styles.infoCard}>
                                        <Ionicons name="barbell" size={20} color={theme.colors.accent} />
                                        <Text style={styles.infoLabel}>Equipamiento</Text>
                                        <Text style={styles.infoValue}>{exercise.equipment}</Text>
                                    </View>
                                )}
                            </View>

                            {/* Description */}
                            {exercise.description && (
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Descripción</Text>
                                    <Text style={styles.description}>{exercise.description}</Text>
                                </View>
                            )}

                            {/* Secondary Muscles */}
                            {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Músculos secundarios</Text>
                                    <View style={styles.musclesContainer}>
                                        {exercise.secondaryMuscles.map((muscle, index) => (
                                            <View key={index} style={styles.muscleChip}>
                                                <Text style={styles.muscleChipText}>{muscle}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* Instructions */}
                            {exercise.instructions && exercise.instructions.length > 0 && (
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Instrucciones</Text>
                                    {exercise.instructions.map((instruction, index) => (
                                        <View key={index} style={styles.instructionItem}>
                                            <View style={styles.stepNumber}>
                                                <Text style={styles.stepNumberText}>{index + 1}</Text>
                                            </View>
                                            <Text style={styles.instructionText}>{instruction}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Bottom spacing */}
                            <View style={{ height: 40 }} />
                        </ScrollView>
                    ) : (
                        <View style={styles.errorContainer}>
                            <Ionicons name="alert-circle" size={48} color={theme.colors.textSecondary} />
                            <Text style={styles.errorText}>No se pudieron cargar los detalles</Text>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const createStyles = (theme: Theme) => {
    const { colors } = theme;
    return StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
        },
        container: {
            backgroundColor: colors.background,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: SCREEN_HEIGHT * 0.9,
            paddingTop: 12,
        },
        handleBar: {
            width: 40,
            height: 4,
            backgroundColor: colors.border,
            borderRadius: 2,
            alignSelf: 'center',
            marginBottom: 8,
        },
        closeButton: {
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 10,
            backgroundColor: colors.card,
            borderRadius: 20,
            padding: 8,
        },
        scrollView: {
            paddingHorizontal: 20,
        },
        loadingContainer: {
            height: 300,
            justifyContent: 'center',
            alignItems: 'center',
        },
        loadingText: {
            color: colors.textSecondary,
            marginTop: 12,
            fontSize: 16,
        },
        errorContainer: {
            height: 300,
            justifyContent: 'center',
            alignItems: 'center',
        },
        errorText: {
            color: colors.textSecondary,
            marginTop: 12,
            fontSize: 16,
        },
        exerciseImage: {
            width: '100%',
            height: 220,
            borderRadius: 16,
            marginBottom: 20,
            backgroundColor: colors.card,
        },
        exerciseName: {
            fontSize: 26,
            fontWeight: '700',
            color: colors.text,
            textTransform: 'capitalize',
            marginBottom: 12,
        },
        tagsContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 20,
        },
        tag: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
        },
        tagDot: {
            width: 8,
            height: 8,
            borderRadius: 4,
        },
        tagText: {
            fontSize: 13,
            fontWeight: '600',
            textTransform: 'capitalize',
        },
        infoGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 24,
        },
        infoCard: {
            flex: 1,
            minWidth: '45%',
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.border,
        },
        infoLabel: {
            fontSize: 12,
            color: colors.textSecondary,
            marginTop: 8,
            marginBottom: 4,
        },
        infoValue: {
            fontSize: 15,
            fontWeight: '600',
            color: colors.text,
            textTransform: 'capitalize',
            textAlign: 'center',
        },
        section: {
            marginBottom: 24,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: '700',
            color: colors.text,
            marginBottom: 12,
        },
        description: {
            fontSize: 15,
            color: colors.textSecondary,
            lineHeight: 24,
        },
        musclesContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
        },
        muscleChip: {
            backgroundColor: colors.accent + '15',
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.accent + '30',
        },
        muscleChipText: {
            color: colors.accent,
            fontSize: 14,
            fontWeight: '500',
            textTransform: 'capitalize',
        },
        instructionItem: {
            flexDirection: 'row',
            marginBottom: 16,
            gap: 12,
        },
        stepNumber: {
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: colors.accent,
            justifyContent: 'center',
            alignItems: 'center',
            flexShrink: 0,
        },
        stepNumberText: {
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: '700',
        },
        instructionText: {
            flex: 1,
            fontSize: 15,
            color: colors.text,
            lineHeight: 22,
        },
    });
};

export default ExerciseDetailModal;
