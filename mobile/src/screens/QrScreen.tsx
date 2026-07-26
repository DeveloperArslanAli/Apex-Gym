import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import Svg, { Rect, Circle } from 'react-native-svg';

export default function QrScreen() {
  const [seconds, setSeconds] = useState(5);
  const [token, setToken] = useState('MOCK-QR-TOKEN-APP');

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          setToken(`MOCK-QR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Access Passkey</Text>
      <Text style={styles.subtitle}>Dynamic Backup Scanner Pass</Text>

      {/* Vector QR Representation */}
      <View style={styles.qrCard}>
        <Svg width="180" height="180" viewBox="0 0 100 100" color="#09090b">
          {/* Outer corners */}
          <Rect x="0" y="0" width="22" height="22" fill="none" stroke="#09090b" strokeWidth="6" />
          <Rect x="4" y="4" width="14" height="14" fill="#09090b" />

          <Rect x="78" y="0" width="22" height="22" fill="none" stroke="#09090b" strokeWidth="6" />
          <Rect x="82" y="4" width="14" height="14" fill="#09090b" />

          <Rect x="0" y="78" width="22" height="22" fill="none" stroke="#09090b" strokeWidth="6" />
          <Rect x="4" y="82" width="14" height="14" fill="#09090b" />

          {/* Random elements */}
          <Rect x="35" y="10" width="10" height="15" fill="#09090b" />
          <Rect x="55" y="5" width="12" height="8" fill="#09090b" />
          <Rect x="40" y="30" width="20" height="10" fill="#09090b" />
          <Rect x="70" y="35" width="10" height="15" fill="#09090b" />
          <Rect x="10" y="45" width="25" height="10" fill="#09090b" />
          <Rect x="30" y="55" width="15" height="20" fill="#09090b" />
          <Rect x="60" y="60" width="20" height="20" fill="#09090b" />
          <Rect x="85" y="78" width="10" height="10" fill="#09090b" />

          {/* Center core */}
          <Circle cx="50" cy="50" r="8" fill="#10b981" />
        </Svg>
      </View>

      <View style={styles.timerBadge}>
        <ActivityIndicator size="small" color="#10b981" style={{ marginRight: 6 }} />
        <Text style={styles.timerText}>Regenerating code: {seconds}s</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Instructions</Text>
        <Text style={styles.cardText}>
          Hold this QR Code in front of the kiosk tablet reader at the gym entrance. The gate triggers instantly on authorization.
        </Text>
        <Text style={styles.tokenText}>Key: {token}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
    alignItems: 'center',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
    marginTop: 4,
    letterSpacing: 1.5,
  },
  qrCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 24,
    marginVertical: 28,
    shadowColor: '#10b981',
    shadowOpacity: 0.1,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 4 },
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timerText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    fontFamily: 'monospace',
  },
  card: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 12,
    marginTop: 28,
    width: '100%',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#cbd5e1',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  cardText: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 14,
  },
  tokenText: {
    fontSize: 8,
    color: '#475569',
    marginTop: 8,
    fontFamily: 'monospace',
  },
});
