import React, { useContext, useEffect, useMemo } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useRoutineBuilder } from '@/Context/RoutineBuilderContext';
import { AuthContext } from '@/Context/AuthContext';
import { TRAINING_TYPES } from '@/utils/trainingTracker';
import { Theme, useTheme } from '@/Context/ThemeContext';

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
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Nueva rutina</Text>
      <Text style={styles.subtitle}>Asigna un nombre y una descripción breve.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={styles.input}
          placeholder="Pierna explosiva"
          placeholderTextColor={theme.colors.textSecondary}
          value={name}
          onChangeText={setName}
        />

        <Text style={[styles.label, { marginTop: 16 }]}>Tipo de rutina</Text>
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
                <Text style={[styles.typeText, selected && { color: theme.colors.text, fontWeight: '700' }]}>{type.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.label, { marginTop: 16 }]}>Descripción</Text>
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
        <Text style={styles.summaryTitle}>Ejercicios añadidos</Text>
        <Text style={styles.summaryCount}>{exercises.length} seleccionado(s)</Text>
        <TouchableOpacity onPress={() => router.push('/(main)/routines/parameters')} disabled={!exercises.length}>
          <Text style={[styles.link, !exercises.length && styles.disabledText]}>Editar sets y reps</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleAddExercises}>
        <Text style={styles.primaryText}>Agregar ejercicios</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
        <Text style={styles.secondaryText}>Cancelar</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingHorizontal: 20,
      paddingTop: 60,
    },
    title: {
      color: theme.colors.text,
      fontSize: 26,
      fontWeight: '700',
      marginBottom: 6,
    },
    subtitle: {
      color: theme.colors.textSecondary,
      marginBottom: 20,
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    label: {
      color: theme.colors.textSecondary,
      marginBottom: 6,
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
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: theme.colors.card,
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
    },
    input: {
      backgroundColor: theme.colors.input,
      color: theme.colors.text,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    textArea: {
      height: 100,
      textAlignVertical: 'top',
    },
    summaryCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 16,
      marginTop: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    summaryTitle: {
      color: theme.colors.text,
      fontWeight: '700',
      marginBottom: 4,
    },
    summaryCount: {
      color: theme.colors.textSecondary,
    },
    link: {
      color: theme.colors.accent,
      marginTop: 8,
    },
    disabledText: {
      color: theme.colors.textSecondary,
    },
    primaryButton: {
      marginTop: 30,
      backgroundColor: theme.colors.accent,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
    },
    primaryText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
    },
    secondaryButton: {
      marginTop: 12,
      paddingVertical: 12,
      alignItems: 'center',
    },
    secondaryText: {
      color: theme.colors.textSecondary,
    },
  });
