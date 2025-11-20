import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

const TRAINING_TYPES: { key: string; label: string; color: string }[] = [
  { key: 'pierna', label: 'Pierna', color: '#FF6B6B' },
  { key: 'tren_superior', label: 'Tren Superior', color: '#4D96FF' },
  { key: 'core', label: 'Core', color: '#FFD93D' },
  { key: 'pecho', label: 'Pecho', color: '#9B5DE5' },
  { key: 'espalda', label: 'Espalda', color: '#2EC4B6' },
  { key: 'full', label: 'Full', color: '#FF8A65' },
];

const STORAGE_KEY = '@muscle_training_data';

const getTodayDateString = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const WEEKDAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const isWithinNext7Days = (dateString: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateString);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays < 7;
};

const getWeekdayName = (dateString: string) => {
  const d = new Date(dateString);
  return WEEKDAY_NAMES[d.getDay()] || dateString;
};

export default function MuscleScreen() {
  const [dateTypeMap, setDateTypeMap] = useState<Record<string, string>>({});
  const [selectedType, setSelectedType] = useState<string | null>('pierna');
  const [isLoading, setIsLoading] = useState(true);

  // Cargar datos al iniciar
  useEffect(() => {
    loadData();
  }, []);

  // Guardar datos cada vez que cambian
  useEffect(() => {
    if (!isLoading) {
      saveData();
    }
  }, [dateTypeMap]);

  const loadData = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      if (jsonValue !== null) {
        const data = JSON.parse(jsonValue);
        setDateTypeMap(data);
      }
    } catch (e) {
      console.error('Error al cargar datos:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const saveData = async () => {
    try {
      const jsonValue = JSON.stringify(dateTypeMap);
      await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
    } catch (e) {
      console.error('Error al guardar datos:', e);
    }
  };

  const buildMarkedDates = (map: Record<string, string>) => {
    const marked: Record<string, any> = {};
    Object.keys(map).forEach((date) => {
      const typeKey = map[date];
      const type = TRAINING_TYPES.find((t) => t.key === typeKey);
      const bg = type ? type.color : '#999';
      marked[date] = {
        customStyles: {
          container: {
            backgroundColor: bg,
            borderRadius: 6,
          },
          text: {
            color: '#fff',
            fontWeight: '600',
          },
        },
      };
    });
    return marked;
  };

  // Al presionar un día: asigna el tipo seleccionado, o si ya tenía el mismo tipo -> borra (toggle)
  const onDayPress = (day: { dateString: string }) => {
    if (!selectedType) return;
    const date = day.dateString;

    setDateTypeMap((prev) => {
      // si la fecha ya está con el mismo tipo -> borrar (toggle)
      if (prev[date] === selectedType) {
        const copy = { ...prev };
        delete copy[date];
        return copy;
      }
      // asignar/actualizar tipo
      return { ...prev, [date]: selectedType };
    });
  };

  // Ciclar el tipo de entrenamiento para una fecha (usar en la lista)
  const changeTypeForDate = (date: string) => {
    setDateTypeMap((prev) => {
      const current = prev[date];
      const idx = TRAINING_TYPES.findIndex((t) => t.key === current);
      const nextIdx = (idx + 1) % TRAINING_TYPES.length;
      return { ...prev, [date]: TRAINING_TYPES[nextIdx].key };
    });
  };

  // Borrar cualquier fecha (ahora permitido siempre)
  const deleteDate = (date: string) => {
    setDateTypeMap((prev) => {
      const copy = { ...prev };
      delete copy[date];
      return copy;
    });
  };

  const clearAll = async () => {
    setDateTypeMap({});
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Error al borrar datos:', e);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  // preparar lista ordenada de fechas SOLO próximos 7 días (incluye hoy)
  const upcomingDates = Object.keys(dateTypeMap)
    .filter((d) => isWithinNext7Days(d))
    .sort((a, b) => a.localeCompare(b)); // ascendente

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Muscle</Text>
      <Text style={styles.subtitle}>
        Selecciona un tipo y toca un día para anotarlo. Toca otra vez para borrar.
      </Text>

      <View style={styles.legendContainer}>
        <ScrollView horizontal contentContainerStyle={styles.legendScroll} showsHorizontalScrollIndicator={false}>
          {TRAINING_TYPES.map((t) => {
            const selected = selectedType === t.key;
            return (
              <TouchableOpacity
                activeOpacity={0.7} // Esto hace que la animación de opacidad sea más rápida
                key={t.key}
                style={[
                  styles.typeButton, 
                  selected && styles.typeButtonSelected, 
                  { 
                    borderColor: t.color,
                    backgroundColor: selected ? t.color + '20' : '#fff' // Fondo semitransparente cuando está seleccionado
                  }
                ]}
                onPress={() => setSelectedType(t.key)}
              >
                <View style={[styles.colorDot, { backgroundColor: t.color }]} />
                <Text style={[
                  styles.typeLabel,
                  selected && styles.typeLabelSelected // Texto más oscuro cuando está seleccionado
                ]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <Calendar
        markingType={'custom'}
        markedDates={buildMarkedDates(dateTypeMap)}
        onDayPress={onDayPress}
        theme={{
          todayTextColor: '#222',
        }}
        style={styles.calendar}
      />

      {/* Lista en la parte de abajo: próximos 7 días */}
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Entrenamientos próximos 7 días</Text>
        <ScrollView style={styles.listScroll}>
          {upcomingDates.length === 0 ? (
            <Text style={styles.emptyText}>No hay entrenamientos en los próximos 7 días.</Text>
          ) : (
            upcomingDates.map((date) => {
              const typeKey = dateTypeMap[date];
              const type = TRAINING_TYPES.find((t) => t.key === typeKey);
              return (
                <View key={date} style={styles.listItem}>
                  <View style={styles.listInfo}>
                    <View style={[styles.colorDot, { backgroundColor: type?.color || '#999' }]} />
                    <View>
                      <Text style={styles.listDate}>{getWeekdayName(date)}</Text>
                      <Text style={styles.listType}>{type?.label || typeKey}</Text>
                    </View>
                  </View>
                  <View style={styles.listActions}>
                    <TouchableOpacity 
                      style={styles.actionButton} 
                      onPress={() => changeTypeForDate(date)}
                    >
                      <Text style={styles.actionText}>Cambiar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.deleteButton]} 
                      onPress={() => deleteDate(date)}
                    >
                      <Text style={[styles.actionText, { color: '#fff' }]}>Borrar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#f7f7f7',
    paddingTop: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 12,
  },
  legendContainer: {
    width: '100%',
    marginBottom: 12,
  },
  legendScroll: {
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: '#fff',
  },
  typeButtonSelected: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 8,
  },
  typeLabel: {
    fontSize: 13,
    color: '#222',
  },
  typeLabelSelected: {
    fontWeight: '600',
    color: '#000',
  },
  clearButton: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
  },
  clearLabel: {
    color: '#c00',
    fontWeight: '600',
  },
  calendar: {
    width: '100%',
    borderRadius: 8,
    padding: 8,
  },

  /* lista abajo */
  listContainer: {
    width: '100%',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flex: 1,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  listScroll: {
    maxHeight: 220,
  },
  emptyText: {
    color: '#666',
    paddingVertical: 8,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  listInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listDate: {
    fontSize: 14,
    fontWeight: '600',
  },
  listType: {
    fontSize: 12,
    color: '#555',
  },
  listActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#ddd',
    marginLeft: 8,
  },
  actionText: {
    color: '#222',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#c00',
  },
  disabledButton: {
    backgroundColor: '#f3f3f3',
  },
  disabledText: {
    color: '#999',
    fontWeight: '600',
  },
});