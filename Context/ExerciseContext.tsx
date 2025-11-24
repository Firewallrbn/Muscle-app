import { Exercise } from '@/types';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchExercisesFromAPI } from '@/utils/exerciseApi';

interface ExerciseContextValue {
    bodyParts: string[];
    exercises: Exercise[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

const ExerciseContext = createContext<ExerciseContextValue | undefined>(undefined);

export const ExerciseProvider = ({ children }: { children: React.ReactNode }) => {
    const [bodyParts, setBodyParts] = useState<string[]>([]);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const apiExercises = await fetchExercisesFromAPI();
            setExercises(apiExercises);
            const uniqueBodyParts = Array.from(new Set(apiExercises.map((e) => e.bodyPart)));
            setBodyParts(uniqueBodyParts);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'No pudimos cargar los ejercicios.';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const value = useMemo(
        () => ({ bodyParts, exercises, loading, error, refresh }),
        [bodyParts, exercises, loading, error, refresh]
    );

    return <ExerciseContext.Provider value={value}>{children}</ExerciseContext.Provider>;
};

export const useExerciseContext = () => {
    const context = useContext(ExerciseContext);
    if (!context) {
        throw new Error('useExerciseContext must be used within an ExerciseProvider.');
    }
    return context;
};
