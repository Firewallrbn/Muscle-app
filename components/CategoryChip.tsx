import { Theme, useTheme } from '@/Context/ThemeContext';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

interface CategoryChipProps {
    label: string;
    selected?: boolean;
    onPress: () => void;
}

const CategoryChip: React.FC<CategoryChipProps> = ({ label, selected = false, onPress }) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    
    // El botón "all" usa accent (rojo) cuando está seleccionado, los demás usan secondary (azul)
    const isAllButton = label.toLowerCase() === 'all';
    const selectedColor = isAllButton ? theme.colors.accent : theme.colors.secondary;
    
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={onPress}
            style={({ pressed }) => [
                styles.chip,
                selected && { backgroundColor: selectedColor, borderColor: selectedColor },
                pressed && styles.chipPressed,
            ]}
        >
            <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{label}</Text>
        </Pressable>
    );
};

const createStyles = (theme: Theme) => {
    const { colors } = theme;
    return StyleSheet.create({
        chip: {
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 20,
            backgroundColor: colors.card,
            marginRight: 12,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: theme.mode === 'light' ? '#000' : 'transparent',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: theme.mode === 'light' ? 0.06 : 0,
            shadowRadius: 6,
            elevation: theme.mode === 'light' ? 2 : 0,
        },
        chipPressed: {
            opacity: 0.85,
        },
        chipLabel: {
            fontSize: 15,
            fontWeight: '500',
            color: colors.text,
            textTransform: 'capitalize',
        },
        chipLabelSelected: {
            color: '#FFFFFF',
            fontWeight: '600',
        },
    });
};

export default CategoryChip;