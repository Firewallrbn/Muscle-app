import CategoryChip from '@/components/CategoryChip';
import ExerciseCard from '@/components/ExerciseCard';
import { useExerciseContext } from '@/Context/ExerciseContext';
import { Exercise } from '@/types';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

const ITEMS_PER_BATCH = 20;

const ExercisesScreen: React.FC = () => {
    const { bodyParts, exercises, loading, error } = useExerciseContext();
    const [selectedBodyPart, setSelectedBodyPart] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState<number>(ITEMS_PER_BATCH);
    const [searchQuery, setSearchQuery] = useState<string>('');

    const categories = useMemo(() => ['all', ...bodyParts], [bodyParts]);

    const filteredExercises = useMemo(() => {
        if (!selectedBodyPart || selectedBodyPart === 'all') {
            return exercises;
        }

        return exercises.filter(
            (exercise) => exercise.bodyPart.toLowerCase() === selectedBodyPart.toLowerCase(),
        );
    }, [exercises, selectedBodyPart]);

    useEffect(() => {
        setVisibleCount(ITEMS_PER_BATCH);
    }, [selectedBodyPart, exercises]);

    const displayedExercises = useMemo(
        () => filteredExercises.slice(0, visibleCount),
        [filteredExercises, visibleCount],
    );

    const handleSelectCategory = useCallback(
        (category: string) => {
            if (category === 'all') {
                setSelectedBodyPart(null);
                return;
            }
            setSelectedBodyPart(category);
        },
        [],
    );

    const handleLoadMore = useCallback(() => {
        if (loading) {
            return;
        }

        if (visibleCount >= filteredExercises.length) {
            return;
        }

        setVisibleCount((prev) => Math.min(prev + ITEMS_PER_BATCH, filteredExercises.length));
    }, [filteredExercises.length, loading, visibleCount]);

    const renderExercise = useCallback(({ item }: { item: Exercise }) => {
        return <ExerciseCard exercise={item} />;
    }, []);

    const keyExtractor = useCallback((item: Exercise) => item.id, []);

    const renderCategoryChip = useCallback(
        ({ item }: { item: string }) => (
            <CategoryChip
                label={item}
                selected={(!selectedBodyPart && item === 'all') || selectedBodyPart === item}
                onPress={() => handleSelectCategory(item)}
            />
        ),
        [handleSelectCategory, selectedBodyPart],

    );
    const listHeaderComponent = useMemo(
        () => (
            <View style={styles.headerContainer}>
                <View style={styles.searchContainer}>
                    <TextInput
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Search exercises"
                        placeholderTextColor="#8E8E93"
                        style={styles.searchInput}
                        editable={!loading}
                    />
                </View>
                <View style={styles.categoriesContainer}>
                    <FlatList
                        data={categories}
                        keyExtractor={(item) => item}
                        renderItem={renderCategoryChip}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoriesContent}
                    />
                </View>
                {error && exercises.length > 0 && (
                    <View style={styles.errorBanner}>
                        <Text style={styles.errorBannerText}>{error}</Text>
                    </View>
                )}
            </View>
        ),
        [categories, error, exercises.length, loading, renderCategoryChip, searchQuery],
    );

    if (loading && exercises.length === 0) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0A84FF" />
            </SafeAreaView>
        );
    }

    if (error && exercises.length === 0) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <Text style={styles.errorText}>{error}</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <FlatList
                data={displayedExercises}
                keyExtractor={keyExtractor}
                renderItem={renderExercise}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={listHeaderComponent}
                ListFooterComponent={<View style={styles.footerSpacing} />}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.4}
                ListEmptyComponent={!loading ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyTitle}>No exercises found</Text>
                        <Text style={styles.emptySubtitle}>
                            Try selecting a different category.
                        </Text>
                    </View>
                ) : null}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
};



const styles = StyleSheet.create({
  safeArea: {
        flex: 1,
        backgroundColor: '#F8F9FB',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FB',
        paddingHorizontal: 24,
    },
    errorText: {
        fontSize: 16,
        color: '#FF3B30',
        textAlign: 'center',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 32,
    },
    headerContainer: {
        paddingTop: 12,
        marginBottom: 16,
    },
    searchContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    searchInput: {
        fontSize: 16,
                color: '#1C1C1E',
    },
    categoriesContainer: {
        marginTop: 20,
    },
    categoriesContent: {
        paddingRight: 20,
    },
    errorBanner: {
        marginTop: 16,
        backgroundColor: '#FDECEA',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 16,
    },
    errorBannerText: {
        fontSize: 14,
        color: '#D93025',
        textAlign: 'center',
    },
        footerSpacing: {
        height: 32,
    },
    emptyState: {
        marginTop: 80,
        alignItems: 'center',
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1C1C1E',
        marginBottom: 6,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#8E8E93',
        textAlign: 'center',
    },
});

export default ExercisesScreen;