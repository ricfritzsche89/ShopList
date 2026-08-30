import React from 'react';
import { StyleSheet, Text, View, ScrollView, Platform } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { isFirebaseConfigured } from './src/services/firebase';

export default function App() {
  if (!isFirebaseConfigured) {
    return (
      <View style={styles.errorContainer}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.logoText}>🛒 EINKAUFS- & KOCH-APP</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Konfiguration erforderlich ⚠️</Text>
            <Text style={styles.description}>
              Die App konnte nicht gestartet werden, weil die Verbindung zur Firebase-Datenbank nicht eingerichtet ist.
            </Text>

            <View style={styles.instructionBox}>
              <Text style={styles.instructionTitle}>So behebst du diesen Zustand:</Text>
              
              <Text style={styles.step}>
                <Text style={styles.stepNumber}>1.</Text> Erstelle eine Datei namens <Text style={styles.code}>.env</Text> im Hauptverzeichnis deines Projekts:
              </Text>
              <Text style={styles.path}>e:\Programmierung\List\.env</Text>

              <Text style={styles.step}>
                <Text style={styles.stepNumber}>2.</Text> Kopiere die Variablen aus <Text style={styles.code}>.env.example</Text> in diese Datei und trage deine Firebase-Zugangsdaten ein.
              </Text>

              <Text style={styles.step}>
                <Text style={styles.stepNumber}>3.</Text> Baue die Web-App in der PowerShell neu:
              </Text>
              <Text style={styles.command}>npm run build:web</Text>

              <Text style={styles.step}>
                <Text style={styles.stepNumber}>4.</Text> Starte den Server neu:
              </Text>
              <Text style={styles.command}>npm run serve:web</Text>
            </View>

            <Text style={styles.note}>
              Hinweis: Die Zugangsdaten findest du in deiner Firebase Console unter den Projekteinstellungen deiner Web-App.
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return <AppNavigator />;
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#0B0813',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#00F0FF',
    letterSpacing: 2,
    marginBottom: 30,
    textShadowColor: 'rgba(0, 240, 255, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#161224',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#26203D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF007F',
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 0, 127, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  description: {
    color: '#FFF',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  instructionBox: {
    backgroundColor: '#0F0B1E',
    borderWidth: 1,
    borderColor: '#2D254B',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  instructionTitle: {
    color: '#00F0FF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  step: {
    color: '#FFF',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  stepNumber: {
    color: '#FF007F',
    fontWeight: 'bold',
  },
  code: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    color: '#00F0FF',
    backgroundColor: '#161224',
    paddingHorizontal: 4,
  },
  path: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    color: '#9E97B2',
    fontSize: 12,
    backgroundColor: '#0B0813',
    padding: 8,
    borderRadius: 4,
    marginTop: 4,
    marginLeft: 16,
    borderWidth: 1,
    borderColor: '#26203D',
  },
  command: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    color: '#FFF',
    fontSize: 13,
    backgroundColor: '#161224',
    padding: 8,
    borderRadius: 4,
    marginTop: 4,
    marginLeft: 16,
    borderWidth: 1,
    borderColor: '#FF007F',
  },
  note: {
    color: '#9E97B2',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic',
  },
});
