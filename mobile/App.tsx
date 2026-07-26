import React, { useState } from 'react';
import { View, SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import TabNavigator from './src/navigation/TabNavigator';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Simple state router to toggle views cleanly
  const navigationMock = {
    navigate: (screen: string) => {
      if (screen === 'MainTabs') {
        setIsLoggedIn(true);
      } else if (screen === 'Login') {
        setIsLoggedIn(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      {isLoggedIn ? (
        <View style={styles.view}>
          <TabNavigator />
        </View>
      ) : (
        <LoginScreen navigation={navigationMock} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  view: {
    flex: 1,
  }
});
// 
