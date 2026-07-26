import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { apiClient } from '../api/client';

export default function MealsScreen() {
  const [description, setDescription] = useState('');
  const [meals, setMeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const loadMeals = async () => {
    try {
      const res = await apiClient.get('member/meals');
      setMeals(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadMeals();
  }, []);

  const handleLogMeal = async () => {
    if (!description.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await apiClient.post('member/meal', {
        textDescription: description,
        loggedMethod: 'TEXT',
      });
      setResult(res.data);
      setDescription('');
      loadMeals();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Log Nutrition Intake</Text>
        <Text style={styles.tag}>NLP Parser</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>What did you eat?</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="e.g. 250g grilled chicken breast and 1 cup brown rice"
          placeholderTextColor="#475569"
          multiline
          numberOfLines={3}
          style={styles.textarea}
        />

        <TouchableOpacity onPress={handleLogMeal} disabled={loading} style={styles.button}>
          {loading ? (
            <ActivityIndicator color="#09090b" />
          ) : (
            <Text style={styles.buttonText}>ANALYZE & LOG MEAL</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Analysis Result Card */}
      {result && (
        <View style={[styles.card, styles.resultCard]}>
          <Text style={styles.resultTitle}>AI Analysis Results</Text>
          <Text style={styles.resultDesc}>"{result.textDescription}"</Text>
          <View style={styles.grid}>
            <View style={styles.gridBox}>
              <Text style={styles.gridLabel}>CALORIES</Text>
              <Text style={styles.gridVal}>{result.estimatedCalories}</Text>
            </View>
            <View style={styles.gridBox}>
              <Text style={styles.gridLabel}>PROTEIN</Text>
              <Text style={styles.gridVal}>{result.estimatedProtein}g</Text>
            </View>
            <View style={styles.gridBox}>
              <Text style={styles.gridLabel}>CARBS</Text>
              <Text style={styles.gridVal}>{result.estimatedCarbs}g</Text>
            </View>
            <View style={styles.gridBox}>
              <Text style={styles.gridLabel}>FAT</Text>
              <Text style={styles.gridVal}>{result.estimatedFat}g</Text>
            </View>
          </View>
        </View>
      )}

      {/* Log history */}
      <View style={styles.card}>
        <Text style={styles.historyTitle}>Recent Nutrition Logs</Text>
        {meals.length === 0 ? (
          <Text style={styles.emptyText}>No food logs found for today.</Text>
        ) : (
          meals.map((meal) => (
            <View key={meal.id} style={styles.mealRow}>
              <View style={styles.mealInfo}>
                <Text style={styles.mealDesc}>{meal.textDescription}</Text>
                <Text style={styles.mealStats}>
                  P: {meal.estimatedProtein}g | C: {meal.estimatedCarbs}g | F: {meal.estimatedFat}g
                </Text>
              </View>
              <Text style={styles.mealCals}>{meal.estimatedCalories} kcal</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  tag: {
    fontSize: 8,
    color: '#cbd5e1',
    fontWeight: 'bold',
    backgroundColor: '#1e293b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  label: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  textarea: {
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    color: '#f8fafc',
    fontSize: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: '#09090b',
    fontWeight: 'bold',
    fontSize: 11,
    letterSpacing: 1,
  },
  resultCard: {
    borderColor: 'rgba(16, 185, 129, 0.2)',
    backgroundColor: 'rgba(16, 185, 129, 0.02)',
    gap: 8,
  },
  resultTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#10b981',
    textTransform: 'uppercase',
  },
  resultDesc: {
    fontSize: 11,
    color: '#cbd5e1',
    fontStyle: 'italic',
  },
  grid: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(16, 185, 129, 0.1)',
    paddingTop: 12,
    marginTop: 4,
  },
  gridBox: {
    flex: 1,
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  gridLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#64748b',
  },
  gridVal: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginTop: 2,
  },
  historyTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#cbd5e1',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingBottom: 8,
    marginBottom: 10,
  },
  mealRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  mealInfo: {
    flex: 1,
    marginRight: 12,
  },
  mealDesc: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: 'bold',
  },
  mealStats: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2,
  },
  mealCals: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#10b981',
  },
  emptyText: {
    fontSize: 10,
    color: '#475569',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
});
