import Camera from '@/components/Camera';
import CategoryChip from '@/components/CategoryChip';
import ExerciseCard from '@/components/ExerciseCard';
import { AuthContext } from '@/Context/AuthContext';
import { useExerciseContext } from '@/Context/ExerciseContext';
import { useTheme } from '@/Context/ThemeContext';
import { Exercise } from '@/types';
import { fetchLikedExercises, normalizeExerciseId, toggleLike } from '@/utils/exerciseApi';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
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

const ITEMS_PER_BATCH = 20;

const ExercisesScreen: React.FC = () => {
    const { bodyParts, exercises, loading, error } = useExerciseContext();
    const { user } = useContext(AuthContext);
    const { theme } = useTheme();
    const { colors } = theme;
    const styles = useMemo(() => createStyles(theme), [theme]);
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

          // Usa el mismo id que vas a guardar en likedIds
          const status = await toggleLike(user.id, normalizedId);

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
                        placeholderTextColor={colors.textSecondary}
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
                        <Text style={[styles.favButtonText, showFavorites && styles.favButtonTextActive]}>
                            {showFavorites ? 'Showing favorites' : 'Show favorites'}
                        </Text>
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
                <ActivityIndicator size="large" color={colors.secondary} />
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


const createStyles = (theme: ReturnType<typeof useTheme>['theme']) => {
    const { colors } = theme;
    return StyleSheet.create({
        safeArea: {
            flex: 1,
            backgroundColor: colors.background,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.background,
            paddingHorizontal: 24,
        },
        errorText: {
            fontSize: 16,
            color: colors.accent,
            textAlign: 'center',
        },
        listContent: {
            paddingHorizontal: 16,
            paddingBottom: 32,
        },
        headerContainer: {
            paddingTop: 12,
            marginBottom: 16,
        },
        searchContainer: {
            backgroundColor: theme.mode === 'light' ? '#FFFFFF' : colors.card,
            borderRadius: 14,
            paddingHorizontal: 16,
            paddingVertical: 12,
            shadowColor: theme.mode === 'light' ? '#000' : 'transparent',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: theme.mode === 'light' ? 0.06 : 0,
            shadowRadius: 8,
            elevation: theme.mode === 'light' ? 2 : 0,
            borderWidth: 1,
            borderColor: colors.border,
        },
        searchInput: {
            fontSize: 16,
            color: colors.text,
            backgroundColor: 'transparent',
        },
        categoriesContainer: {
            marginTop: 12,
            flex: 1,
        },
        categoriesContent: {
            paddingRight: 16,
        },
        errorBanner: {
            marginTop: 16,
            backgroundColor: theme.mode === 'light' ? '#FDECEA' : colors.card,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.border,
        },
        errorBannerText: {
            fontSize: 14,
            color: colors.accent,
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
            fontWeight: '700',
            color: colors.text,
            marginBottom: 6,
        },
        emptySubtitle: {
            fontSize: 14,
            color: colors.textSecondary,
            textAlign: 'center',
        },
        favButton: {
            backgroundColor: colors.card,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
        },
        favButtonActive: {
            backgroundColor: colors.accent,
            borderColor: colors.accent,
        },
        favButtonText: {
            color: colors.text,
            fontWeight: '700',
        },
        favButtonTextActive: {
            color: '#fff',
        },
        filterRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            marginTop: 12,
        },
    });
};

export default ExercisesScreen;
