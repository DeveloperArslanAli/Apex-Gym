import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import * as Speech from 'expo-speech';
import { apiClient } from '../api/client';

export default function WorkoutScreen() {
  const [exercise, setExercise] = useState('Squat');
  const [weight, setWeight] = useState('80');
  const [reps, setReps] = useState('10');
  const [rir, setRir] = useState('2');

  const [active, setActive] = useState(false);
  const [angle, setAngle] = useState(180);
  const [cue, setCue] = useState('Calibrating camera position...');
  const [repCount, setRepCount] = useState(0);
  const [score, setScore] = useState(100);

  const speakAlert = (text: string) => {
    Speech.stop();
    Speech.speak(text, { rate: 1.1 });
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (active) {
      speakAlert('Form Check active. Squat when ready');
      let frame = 0;
      let localReps = 0;
      let lastDir = 1;

      interval = setInterval(() => {
        frame += 0.2;
        const progress = (Math.sin(frame) + 1) / 2;
        const currentAngle = Math.round(180 - progress * 100);
        setAngle(currentAngle);

        const currentDir = Math.cos(frame) > 0 ? 1 : -1;
        if (currentDir === -1 && lastDir === 1) {
          // Bottom squat
          if (currentAngle > 95) {
            setCue('Go deeper');
            speakAlert('Go deeper');
            setScore((prev) => Math.max(prev - 5, 60));
          } else {
            setCue('Good depth');
            speakAlert('Good depth');
          }
        } else if (currentDir === 1 && lastDir === -1) {
          localReps += 1;
          setRepCount(localReps);
          speakAlert(`Rep ${localReps}`);
        }
        lastDir = currentDir;
      }, 300);
    }
    return () => clearInterval(interval);
  }, [active]);

  const handleStopSet = async () => {
    setActive(false);
    Speech.stop();

    try {
      await apiClient.post('member/workout', {
        date: new Date(),
        durationMinutes: 2,
        notes: `Mobile session. Bracing alignment: ${score}%`,
        sets: [
          {
            exerciseName: exercise,
            setNumber: 1,
            weight: parseFloat(weight),
            reps: repCount > 0 ? repCount : parseInt(reps),
            rir: parseInt(rir),
            postureScore: score,
            feedbackSummary: `Mobile check-in. Reps: ${repCount}. Spine Score: ${score}%`,
          },
        ],
      });
      Alert.alert('Success', 'Workout set logged to database!');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to save workout set.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Camera HUD Analysis</Text>
        <Text style={styles.tag}>MoveNet v1</Text>
      </View>

      {active ? (
        <View style={styles.hudCard}>
          {/* Simulated view finder overlay details */}
          <View style={styles.viewfinder}>
            <Text style={styles.viewfinderText}>[ CAMERA PREVIEW ACTIVE ]</Text>
            {/* Draw mock skeletal landmarks representations */}
            <View style={styles.jointsOverlay}>
              <View style={[styles.dot, { top: 60, left: 130 }]} />
              <View style={[styles.dot, { top: 110, left: 120 }]} />
              <View style={[styles.dot, { top: 160, left: 160 }]} />
              <View style={[styles.dot, { top: 210, left: 140 }]} />
            </View>
          </View>

          <View style={styles.statsPanel}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Knee Joint Angle:</Text>
              <Text style={styles.statValue}>{angle}°</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>TTS Audio Alert:</Text>
              <Text style={styles.cueValue}>{cue}</Text>
            </View>
            <View style={styles.grid}>
              <View style={styles.gridBox}>
                <Text style={styles.gridLabel}>Reps</Text>
                <Text style={styles.gridVal}>{repCount}</Text>
              </View>
              <View style={styles.gridBox}>
                <Text style={styles.gridLabel}>Form Score</Text>
                <Text style={styles.gridVal}>{score}%</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity onPress={handleStopSet} style={styles.stopButton}>
            <Text style={styles.stopText}>STOP & SAVE SET</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.configCard}>
          <Text style={styles.configTitle}>Select Exercise</Text>
          <View style={styles.selectRow}>
            {['Squat', 'Deadlift', 'Bench'].map((ex) => (
              <TouchableOpacity
                key={ex}
                onPress={() => setExercise(ex)}
                style={[styles.selectBtn, exercise === ex ? styles.selectBtnActive : null]}
              >
                <Text style={[styles.selectText, exercise === ex ? styles.selectTextActive : null]}>{ex}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput value={weight} onChangeText={setWeight} keyboardType="numeric" style={styles.input} />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Reps</Text>
              <TextInput value={reps} onChangeText={setReps} keyboardType="numeric" style={styles.input} />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>RIR</Text>
              <TextInput value={rir} onChangeText={setRir} keyboardType="numeric" style={styles.input} />
            </View>
          </View>

          <TouchableOpacity onPress={() => setActive(true)} style={styles.startButton}>
            <Text style={styles.startText}>ACTIVATE HUD CAMERA</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Cues checklist */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Joint angle thresholds</Text>
        <View style={styles.thresholdRow}>
          <Text style={styles.thresholdLabel}>Bottom Squat Knee Angle:</Text>
          <Text style={styles.thresholdVal}>80° - 110°</Text>
        </View>
        <View style={styles.thresholdRow}>
          <Text style={styles.thresholdLabel}>Back Spine Angle Tolerance:</Text>
          <Text style={styles.thresholdVal}>&lt; 20° deviation</Text>
        </View>
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
  hudCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 16,
  },
  viewfinder: {
    height: 280,
    backgroundColor: '#020617',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    position: 'relative',
  },
  viewfinderText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  jointsOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  dot: {
    position: 'absolute',
    width: 8,
    height: 8,
    backgroundColor: '#22d3ee',
    borderRadius: 4,
  },
  statsPanel: {
    backgroundColor: '#09090b',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#94a3b8',
  },
  statValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#10b981',
    fontFamily: 'monospace',
  },
  cueValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#22d3ee',
  },
  grid: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 8,
    marginTop: 4,
  },
  gridBox: {
    flex: 1,
    alignItems: 'center',
  },
  gridLabel: {
    fontSize: 8,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  gridVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#f8fafc',
    marginTop: 2,
  },
  stopButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  stopText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 11,
    letterSpacing: 1,
  },
  configCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 16,
  },
  configTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  selectRow: {
    flexDirection: 'row',
    gap: 8,
  },
  selectBtn: {
    flex: 1,
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  selectBtnActive: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  selectText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: 'bold',
  },
  selectTextActive: {
    color: '#10b981',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 9,
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    paddingVertical: 8,
    textAlign: 'center',
    color: '#f8fafc',
    fontSize: 12,
  },
  startButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  startText: {
    color: '#09090b',
    fontWeight: 'bold',
    fontSize: 11,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingBottom: 8,
    marginBottom: 10,
  },
  thresholdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  thresholdLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  thresholdVal: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#cbd5e1',
  },
});
