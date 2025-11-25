import { AuthContext } from '@/Context/AuthContext';
import { useRoutineBuilder } from '@/Context/RoutineBuilderContext';
import { Theme, useTheme } from '@/Context/ThemeContext';
import { TRAINING_TYPES } from '@/utils/trainingTracker';
import { router } from 'expo-router';
import { useContext, useEffect, useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function CreateRoutineScreen() {
  const { user } = useContext(AuthContext);
  const { name, description, trainingType, setName, setDescription, setTrainingType, exercises, reset } =
    useRoutineBuilder();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  useEffect(() => {
    reset();
  }, [reset]);

  const handleAddExercises = () => {
    if (!user?.id) {
      Alert.alert('Sesión expirada', 'Inicia sesión para crear rutinas.');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Nombre requerido', 'Asigna un nombre a tu rutina antes de continuar.');
      return;
    }
    router.push('/(main)/routines/add-exercises');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Nueva rutina</Text>
          <Text style={styles.subtitle}>Asigna un nombre y una descripción breve.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            placeholder="Pierna explosiva"
            placeholderTextColor={theme.colors.textSecondary}
            value={name}
            onChangeText={setName}
          />

          <Text style={[styles.label, styles.labelSpacing]}>Tipo de rutina</Text>
          <View style={styles.typeList}>
            {TRAINING_TYPES.map((type) => {
              const selected = trainingType === type.key;
              return (
                <TouchableOpacity
                  key={type.key}
                  style={[styles.typePill, selected && { borderColor: type.color, backgroundColor: `${type.color}20` }]}
                  onPress={() => setTrainingType(type.key)}
                >
                  <View style={[styles.typeDot, { backgroundColor: type.color }]} />
                  <Text style={[styles.typeText, selected && styles.typeTextSelected]}>{type.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.label, styles.labelSpacing]}>Descripción (opcional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Notas o enfoque de la sesión"
            placeholderTextColor={theme.colors.textSecondary}
            value={description}
            multiline
            numberOfLines={4}
            onChangeText={setDescription}
          />
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Ejercicios añadidos</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{exercises.length}</Text>
            </View>
          </View>
          {exercises.length > 0 && (
            <TouchableOpacity onPress={() => router.push('/(main)/routines/parameters')}>
              <Text style={styles.link}>Editar sets y reps →</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleAddExercises}>
            <Text style={styles.primaryText}>Agregar ejercicios</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
            <Text style={styles.secondaryText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 50,
      paddingBottom: 40,
    },
    header: {
      marginBottom: 20,
    },
    title: {
      color: theme.colors.text,
      fontSize: 24,
      fontWeight: '700',
    },
    subtitle: {
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 16,
    },
    label: {
      color: theme.colors.textSecondary,
      fontSize: 13,
      fontWeight: '600',
      marginBottom: 8,
    },
    labelSpacing: {
      marginTop: 20,
    },
    typeList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    typePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 14,
      backgroundColor: theme.colors.input,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    typeDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    typeText: {
      color: theme.colors.textSecondary,
      fontSize: 14,
    },
    typeTextSelected: {
      color: theme.colors.text,
      fontWeight: '700',
    },
    input: {
      backgroundColor: theme.colors.input,
      color: theme.colors.text,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    textArea: {
      height: 90,
      textAlignVertical: 'top',
      paddingTop: 12,
    },
    summaryCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 24,
    },
    summaryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    summaryTitle: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '700',
    },
    countBadge: {
      backgroundColor: theme.colors.accent,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    countText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 14,
    },
    link: {
      color: theme.colors.accent,
      marginTop: 12,
      fontWeight: '600',
    },
    buttonContainer: {
      gap: 12,
    },
    primaryButton: {
      backgroundColor: theme.colors.accent,
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: 'center',
    },
    primaryText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
    },
    secondaryButton: {
      backgroundColor: theme.colors.card,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    secondaryText: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
  });
