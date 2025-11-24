import Camera from '@/components/Camera';
import CategoryChip from '@/components/CategoryChip';
import ExerciseCard from '@/components/ExerciseCard';
import { useExerciseContext } from '@/Context/ExerciseContext';
import { AuthContext } from '@/Context/AuthContext';
import { Exercise } from '@/types';
import React, { useCallback, useMemo, useState, useContext, useEffect } from 'react';
import {
    ActivityIndicator,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { fetchLikedExercises, normalizeExerciseId, toggleLike } from '@/utils/exerciseApi';

const ITEMS_PER_BATCH = 20;

const ExercisesScreen: React.FC = () => {
    const { bodyParts, exercises, loading, error } = useExerciseContext();
    const { user } = useContext(AuthContext);
    const [selectedBodyPart, setSelectedBodyPart] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState<number>(ITEMS_PER_BATCH);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [likedIds, setLikedIds] = useState<string[]>([]);
    const [showFavorites, setShowFavorites] = useState(false);
    const [processingLike, setProcessingLike] = useState(false);

    const categories = useMemo(() => ['all', ...bodyParts], [bodyParts]);

    const loadLikes = useCallback(async () => {
        if (!user?.id) return;
        try {
            const liked = await fetchLikedExercises(user.id);
            setLikedIds(liked);
        } catch (err) {
            console.error('Error loading likes', err);
        }
    }, [user?.id]);

    useEffect(() => {
        loadLikes();
    }, [loadLikes]);

    const filteredExercises = useMemo(() => {
        let list = exercises;

        if (selectedBodyPart && selectedBodyPart !== 'all') {
            list = list.filter((exercise) => exercise.bodyPart.toLowerCase() === selectedBodyPart.toLowerCase());
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            list = list.filter((exercise) => exercise.name.toLowerCase().includes(query));
        }

        if (showFavorites) {
            list = list.filter((exercise) => likedIds.includes(normalizeExerciseId(exercise.id)));
        }

        return list;
    }, [exercises, selectedBodyPart, searchQuery, showFavorites, likedIds]);

    useEffect(() => {
        setVisibleCount(ITEMS_PER_BATCH);
    }, [selectedBodyPart, exercises, showFavorites, searchQuery]);

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

    const handleToggleFavorite = useCallback(
        async (exerciseId: string) => {
            if (!user?.id || processingLike) return;
            setProcessingLike(true);
            try {
                const normalizedId = normalizeExerciseId(exerciseId);
                const status = await toggleLike(user.id, exerciseId);
                setLikedIds((prev) =>
                    status === 'liked'
                        ? [...prev, normalizedId]
                        : prev.filter((id) => id !== normalizedId)
                );
            } catch (err) {
                console.error('Toggle like error', err);
            } finally {
                setProcessingLike(false);
            }
        },
        [user?.id, processingLike],
    );

    const renderExercise = useCallback(
        ({ item }: { item: Exercise }) => {
            return (
                <ExerciseCard
                    exercise={item}
                    liked={likedIds.includes(normalizeExerciseId(item.id))}
                    onToggleLike={handleToggleFavorite}
                />
            );
        },
        [handleToggleFavorite, likedIds],
    );

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
                <View style={styles.filterRow}>
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
                    <TouchableOpacity
                        style={[styles.favButton, showFavorites && styles.favButtonActive]}
                        onPress={() => {
                            setShowFavorites((prev) => !prev);
                            if (!showFavorites) {
                                loadLikes();
                            }
                        }}
                    >
                        <Text style={styles.favButtonText}>{showFavorites ? 'Showing favorites' : 'Show favorites'}</Text>
                    </TouchableOpacity>
                </View>
                {error && exercises.length > 0 && (
                    <View style={styles.errorBanner}>
                        <Text style={styles.errorBannerText}>{error}</Text>
                    </View>
                )}
            </View>
        ),
        [categories, error, exercises.length, loading, renderCategoryChip, searchQuery, showFavorites, loadLikes],
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
            <Camera></Camera>
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
        marginTop: 12,
        flex: 1,
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
    favButton: {
        backgroundColor: '#1C1C1E',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
    },
    favButtonActive: {
        backgroundColor: '#FC3058',
    },
    favButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 12,
    },
});

export default ExercisesScreen;
