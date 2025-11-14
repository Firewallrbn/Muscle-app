import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

interface CategoryChipProps {
    label: string;
    selected?: boolean;
    onPress: () => void;
}

const CategoryChip: React.FC<CategoryChipProps> = ({ label, selected = false, onPress }) => {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={onPress}
            style={({ pressed }) => [
                styles.chip,
                selected && styles.chipSelected,
                pressed && styles.chipPressed,
            ]}
        >
            <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{label}</Text>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#F2F2F7',
        marginRight: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    chipSelected: {
        backgroundColor: '#0A84FF',
    },
    chipPressed: {
        opacity: 0.85,
    },
    chipLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: '#1C1C1E',
        textTransform: 'capitalize',
    },
    chipLabelSelected: {
        color: '#FFFFFF',
    },
});

export default CategoryChip;