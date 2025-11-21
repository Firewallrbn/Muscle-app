import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useRouter } from 'expo-router';

const TRAINING_TYPES: { key: string; label: string; color: string }[] = [
  { key: 'pierna', label: 'Pierna', color: '#FF6B6B' },
  { key: 'tren_superior', label: 'Tren Superior', color: '#4D96FF' },
  { key: 'core', label: 'Core', color: '#FFD93D' },
  { key: 'pecho', label: 'Pecho', color: '#9B5DE5' },
  { key: 'espalda', label: 'Espalda', color: '#2EC4B6' },
  { key: 'full', label: 'Full', color: '#FF8A65' },
];

const STORAGE_KEY = '@muscle_training_data';

const dateToString = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const getTodayDateString = () => {
  const d = new Date();
  return dateToString(d);
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

const parseDateString = (dateString: string) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  parsed.setHours(0, 0, 0, 0);
  return parsed;
};

const calculateCurrentStreak = (map: Record<string, string>) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dates = new Set(Object.keys(map));
  let streak = 0;
  const cursor = new Date(today);

  while (dates.has(dateToString(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

const calculateBestStreak = (map: Record<string, string>) => {
  const dates = Object.keys(map).sort();
  if (dates.length === 0) return 0;

  let best = 1;
  let current = 1;

  for (let i = 1; i < dates.length; i++) {
    const prev = parseDateString(dates[i - 1]);
    const currentDate = parseDateString(dates[i]);
    const diffDays = (currentDate.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      current += 1;
    } else {
      current = 1;
    }

    if (current > best) best = current;
  }

  return best;
};

const countDaysThisMonth = (map: Record<string, string>) => {
  const today = new Date();
  const month = today.getMonth();
  const year = today.getFullYear();

  return Object.keys(map).filter((date) => {
    const parsed = parseDateString(date);
    return parsed.getMonth() === month && parsed.getFullYear() === year;
  }).length;
};

const getStartOfWeek = (date: Date) => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = (day + 6) % 7; // Lunes como inicio de semana
  start.setDate(start.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  return start;
};

const buildWeeklySummary = (map: Record<string, string>) => {
  const summary = TRAINING_TYPES.reduce((acc, type) => {
    acc[type.key] = 0;
    return acc;
  }, {} as Record<string, number>);

  const start = getStartOfWeek(new Date());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  Object.entries(map).forEach(([date, typeKey]) => {
    const parsed = parseDateString(date);
    if (parsed >= start && parsed <= end) {
      summary[typeKey] = (summary[typeKey] || 0) + 1;
    }
  });

  return summary;
};

export default function MuscleScreen() {
  const [dateTypeMap, setDateTypeMap] = useState<Record<string, string>>({});
  const [selectedType, setSelectedType] = useState<string | null>('pierna');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

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

  const currentStreak = calculateCurrentStreak(dateTypeMap);
  const bestStreak = calculateBestStreak(dateTypeMap);
  const daysThisMonth = countDaysThisMonth(dateTypeMap);
  const weeklySummary = buildWeeklySummary(dateTypeMap);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Muscle</Text>
      <Text style={styles.subtitle}>
        Selecciona un tipo y toca un día para anotarlo. Toca otra vez para borrar.
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Racha actual</Text>
          <Text style={styles.statValue}>{currentStreak} días</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Mejor racha</Text>
          <Text style={styles.statValue}>{bestStreak} días</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Este mes</Text>
          <Text style={styles.statValue}>{daysThisMonth} días</Text>
        </View>
      </View>

      <View style={styles.legendContainer}>
        <ScrollView horizontal contentContainerStyle={styles.legendScroll} showsHorizontalScrollIndicator={false}>
          {TRAINING_TYPES.map((t) => {
            const selected = selectedType === t.key;
            return (
              <TouchableOpacity
                activeOpacity={0.7}
                key={t.key}
                style={[
                  styles.typeButton,
                  selected && styles.typeButtonSelected,
                  {
                    borderColor: t.color,
                    backgroundColor: selected ? t.color + '20' : '#fff',
                  },
                ]}
                onPress={() => setSelectedType(t.key)}
              >
                <View style={[styles.colorDot, { backgroundColor: t.color }]} />
                <Text style={[styles.typeLabel, selected && styles.typeLabelSelected]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Calendario de entrenamientos</Text>
        <Calendar
          markingType={'custom'}
          markedDates={buildMarkedDates(dateTypeMap)}
          onDayPress={onDayPress}
          theme={{
            todayTextColor: '#222',
          }}
          style={styles.calendar}
        />
        <Text style={styles.helperText}>Los días coloreados son entrenamientos registrados.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Resumen semanal</Text>
        {TRAINING_TYPES.map((type) => (
          <View key={type.key} style={styles.weeklyRow}>
            <View style={styles.listInfo}>
              <View style={[styles.colorDot, { backgroundColor: type.color }]} />
              <Text style={styles.listType}>{type.label}</Text>
            </View>
            <Text style={styles.weeklyCount}>{weeklySummary[type.key]} vez(es)</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.listTitle}>Entrenamientos próximos 7 días</Text>
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
                  <TouchableOpacity style={styles.actionButton} onPress={() => changeTypeForDate(date)}>
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
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/') }>
        <Text style={styles.primaryButtonText}>Registrar entrenamiento ahora</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: '#f7f7f7',
  },
  scrollContent: {
    paddingTop: 24,
    paddingBottom: 32,
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
  calendar: {
    width: '100%',
    borderRadius: 8,
    padding: 8,
  },
  helperText: {
    marginTop: 8,
    color: '#666',
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#eee',
  },
  statLabel: {
    color: '#666',
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
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
  weeklyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  weeklyCount: {
    fontWeight: '700',
    color: '#222',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#FC3058',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});