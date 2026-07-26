import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { apiClient, setAuthToken, updateBaseUrl, API_BASE_URL } from '../api/client';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Settings modal states
  const [showSettings, setShowSettings] = useState(false);
  const [serverUrl, setServerUrl] = useState(API_BASE_URL);

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const res = await apiClient.post('auth/signin', { email, password });
      const { access_token } = res.data;

      setAuthToken(access_token);
      navigation.navigate('MainTabs');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = () => {
    updateBaseUrl(serverUrl);
    setShowSettings(false);
    setError('');
  };

  return (
    <View style={styles.container}>
      {/* Settings gear icon */}
      <TouchableOpacity style={styles.settingsButton} onPress={() => setShowSettings(true)}>
        <Text style={styles.settingsIcon}>⚙️</Text>
      </TouchableOpacity>

      <View style={styles.logoContainer}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>⚡</Text>
        </View>
        <Text style={styles.title}>APEX-Gym</Text>
        <Text style={styles.subtitle}>Smart Operations & AI Coach</Text>
      </View>

      {error ? <Text style={styles.errorText}>⚠️ {error}</Text> : null}

      <View style={styles.form}>
        <Text style={styles.label}>Email Address</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="member@gym.com"
          placeholderTextColor="#334155"
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor="#334155"
          secureTextEntry
          style={styles.input}
          autoCapitalize="none"
        />

        <TouchableOpacity onPress={handleLogin} disabled={loading} style={styles.button}>
          {loading ? (
            <ActivityIndicator color="#0f172a" />
          ) : (
            <Text style={styles.buttonText}>SIGN IN</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Settings Modal */}
      <Modal visible={showSettings} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>API Server Settings</Text>
            <Text style={styles.modalSubtitle}>Configure endpoint for physical devices</Text>
            
            <TextInput
              value={serverUrl}
              onChangeText={setServerUrl}
              placeholder="http://192.168.1.15:3001/api"
              placeholderTextColor="#334155"
              style={styles.modalInput}
              autoCapitalize="none"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setShowSettings(false)}>
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnSave]} onPress={handleSaveSettings}>
                <Text style={styles.modalBtnSaveText}>Save URL</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
    justifyContent: 'center',
    padding: 24,
    position: 'relative',
  },
  settingsButton: {
    position: 'absolute',
    top: 40,
    right: 24,
    padding: 10,
    zIndex: 10,
  },
  settingsIcon: {
    fontSize: 22,
    color: '#94a3b8',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBadge: {
    width: 60,
    height: 60,
    backgroundColor: '#10b981',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    color: '#09090b',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: 'bold',
  },
  form: {
    gap: 16,
  },
  label: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#f8fafc',
    fontSize: 13,
  },
  button: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: '#09090b',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 1,
  },
  errorText: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    color: '#ef4444',
    padding: 12,
    borderRadius: 12,
    fontSize: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 9, 11, 0.85)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 24,
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  modalSubtitle: {
    fontSize: 10,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalInput: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#f8fafc',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancel: {
    backgroundColor: '#1e293b',
  },
  modalBtnCancelText: {
    color: '#cbd5e1',
    fontWeight: 'bold',
    fontSize: 12,
  },
  modalBtnSave: {
    backgroundColor: '#10b981',
  },
  modalBtnSaveText: {
    color: '#09090b',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
