import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { apiClient } from '../api/client';

export default function HomeScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [meals, setMeals] = useState<any[]>([]);
  const [advice, setAdvice] = useState<any>(null);

  const targets = { calories: 2500, protein: 150, carbs: 250, fat: 75 };

  const loadData = async () => {
    try {
      const wRes = await apiClient.get('member/workout/history');
      setWorkouts(wRes.data);

      const mRes = await apiClient.get('member/meals');
      setMeals(mRes.data);

      const aRes = await apiClient.get('member/coach/advice');
      setAdvice(aRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#10b981" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  // Calculate today's macros totals
  const today = new Date().toDateString();
  const totals = meals
    .filter((m) => new Date(m.timestamp).toDateString() === today)
    .reduce(
      (acc, meal) => {
        acc.calories += meal.estimatedCalories ?? 0;
        acc.protein += meal.estimatedProtein ?? 0;
        acc.carbs += meal.estimatedCarbs ?? 0;
        acc.fat += meal.estimatedFat ?? 0;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

  const calPercent = Math.min((totals.calories / targets.calories) * 100, 100);
  const lastWorkout = workouts[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Banner */}
      <View style={styles.banner}>
        <View>
          <Text style={styles.bannerSub}>Form Check HUD</Text>
          <Text style={styles.bannerTitle}>Check exercise posture</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Workout')} style={styles.bannerButton}>
          <Text style={styles.bannerButtonText}>START</Text>
        </TouchableOpacity>
      </View>

      {/* Macros Tracker card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Daily Macros Tracker</Text>
          <Text style={styles.cardTag}>{totals.calories} / {targets.calories} kcal</Text>
        </View>

        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${calPercent}%` }]} />
        </View>

        <View style={styles.macrosRow}>
          <View style={styles.macroBox}>
            <Text style={styles.macroLabel}>Protein</Text>
            <Text style={styles.macroVal}>{totals.protein}g</Text>
            <Text style={styles.macroGoal}>Goal: {targets.protein}g</Text>
          </View>
          <View style={styles.macroBox}>
            <Text style={styles.macroLabel}>Carbs</Text>
            <Text style={styles.macroVal}>{totals.carbs}g</Text>
            <Text style={styles.macroGoal}>Goal: {targets.carbs}g</Text>
          </View>
          <View style={styles.macroBox}>
            <Text style={styles.macroLabel}>Fat</Text>
            <Text style={styles.macroVal}>{totals.fat}g</Text>
            <Text style={styles.macroGoal}>Goal: {targets.fat}g</Text>
          </View>
        </View>
      </View>

      {/* AI Advice Card */}
      {advice && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>🤖 AI Coach Advice</Text>
          </View>
          <Text style={styles.adviceText}>{advice.advice}</Text>
          <Text style={styles.tipText}>💡 Tip: {advice.postureAudit.tips}</Text>
        </View>
      )}

      {/* Recent Workout */}
      <View style={styles.card}>
        <Text style={[styles.cardTitle, { marginBottom: 12 }]}>Last Activity Log</Text>
        {lastWorkout ? (
          <View>
            <View style={styles.activityHeader}>
              <Text style={styles.activityTitle}>Strength Session</Text>
              <Text style={styles.activityDate}>{new Date(lastWorkout.date).toLocaleDateString()}</Text>
            </View>
            {lastWorkout.sets?.map((set: any, idx: number) => (
              <View key={set.id || idx} style={styles.setRow}>
                <Text style={styles.setText}>{set.exerciseName} - Set {set.setNumber}</Text>
                <Text style={styles.setDetails}>{set.weight}kg x {set.reps} reps</Text>
                {set.postureScore && (
                  <Text style={styles.setScore}>{set.postureScore}% Pose</Text>
                )}
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No workout logged today. Let's lift!</Text>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#09090b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 12,
    letterSpacing: 1,
  },
  banner: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerSub: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#10b981',
    textTransform: 'uppercase',
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginTop: 2,
  },
  bannerButton: {
    backgroundColor: '#10b981',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bannerButtonText: {
    color: '#09090b',
    fontWeight: 'bold',
    fontSize: 10,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  cardTag: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#10b981',
    backgroundColor: '#09090b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#09090b',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 8,
  },
  macroBox: {
    flex: 1,
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  macroVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#cbd5e1',
    marginTop: 4,
  },
  macroGoal: {
    fontSize: 8,
    color: '#475569',
    marginTop: 2,
  },
  adviceText: {
    fontSize: 11,
    color: '#cbd5e1',
    lineHeight: 16,
    backgroundColor: '#09090b',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  tipText: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 8,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  activityTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#cbd5e1',
  },
  activityDate: {
    fontSize: 10,
    color: '#64748b',
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 8,
    borderRadius: 8,
    marginBottom: 6,
  },
  setText: {
    fontSize: 10,
    color: '#cbd5e1',
  },
  setDetails: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: 'bold',
  },
  setScore: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#22d3ee',
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  emptyText: {
    fontSize: 10,
    color: '#475569',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
});
