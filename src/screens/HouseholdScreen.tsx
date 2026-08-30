import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView 
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function HouseholdScreen() {
  const { createHousehold, joinHousehold, logout, user } = useAuth();
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [householdName, setHouseholdName] = useState('');
  const [householdId, setHouseholdId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreate = async () => {
    if (!householdName.trim()) {
      setErrorMsg('Bitte gib einen Haushaltsnamen an.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      await createHousehold(householdName.trim());
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Fehler beim Erstellen des Haushalts.');
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!householdId.trim()) {
      setErrorMsg('Bitte gib eine gültige Haushalts-ID an.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      await joinHousehold(householdId.trim());
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Fehler beim Beitreten. Prüfe bitte die ID.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF007F" />
        <Text style={styles.loadingText}>Verarbeite Anfrage...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.welcomeText}>Hallo {user?.displayName}! 👋</Text>
          <Text style={styles.subtitleText}>Du bist aktuell in keinem Haushalt.</Text>
        </View>

        {errorMsg ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {mode === 'select' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Wie möchtest du starten?</Text>
            
            <TouchableOpacity 
              style={[styles.button, styles.neonPinkButton]}
              onPress={() => setMode('create')}
            >
              <Text style={styles.buttonText}>Haushalt erstellen</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.neonCyanButton]}
              onPress={() => setMode('join')}
            >
              <Text style={styles.buttonText}>Haushalt beitreten</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={logout}
            >
              <Text style={styles.logoutButtonText}>Abmelden</Text>
            </TouchableOpacity>
          </View>
        )}

        {mode === 'create' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Haushalt erstellen</Text>
            <Text style={styles.labelDescription}>
              Erstelle eine neue gemeinsame Gruppe für deine Einkaufslisten und Rezepte.
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name des Haushalts</Text>
              <TextInput 
                style={styles.input}
                placeholder="z.B. Familie Müller"
                placeholderTextColor="#635B7A"
                value={householdName}
                onChangeText={setHouseholdName}
                autoFocus
              />
            </View>

            <TouchableOpacity 
              style={[styles.button, styles.neonPinkButton]}
              onPress={handleCreate}
            >
              <Text style={styles.buttonText}>Jetzt erstellen</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => {
                setMode('select');
                setErrorMsg('');
              }}
            >
              <Text style={styles.backButtonText}>Zurück</Text>
            </TouchableOpacity>
          </View>
        )}

        {mode === 'join' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Haushalt beitreten</Text>
            <Text style={styles.labelDescription}>
              Gib die Haushalts-ID ein, die du von einem Haushaltsmitglied erhalten hast.
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Haushalts-ID</Text>
              <TextInput 
                style={styles.input}
                placeholder="z.B. xY79BdaLk12..."
                placeholderTextColor="#635B7A"
                value={householdId}
                onChangeText={setHouseholdId}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />
            </View>

            <TouchableOpacity 
              style={[styles.button, styles.neonCyanButton]}
              onPress={handleJoin}
            >
              <Text style={styles.buttonText}>Beitreten</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => {
                setMode('select');
                setErrorMsg('');
              }}
            >
              <Text style={styles.backButtonText}>Zurück</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0813',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0B0813',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9E97B2',
    marginTop: 16,
    fontSize: 16,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subtitleText: {
    fontSize: 14,
    color: '#9E97B2',
    marginTop: 8,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 0, 127, 0.1)',
    borderWidth: 1,
    borderColor: '#FF007F',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#FF007F',
    fontSize: 14,
    textAlign: 'center',
  },
  card: {
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
    color: '#FFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  labelDescription: {
    color: '#9E97B2',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#9E97B2',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#0F0B1E',
    borderWidth: 1,
    borderColor: '#2D254B',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFF',
    fontSize: 16,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginVertical: 8,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  neonPinkButton: {
    backgroundColor: '#FF007F',
    shadowColor: '#FF007F',
  },
  neonCyanButton: {
    backgroundColor: '#00F0FF',
    shadowColor: '#00F0FF',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  logoutButton: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 8,
  },
  logoutButtonText: {
    color: '#FF007F',
    fontSize: 14,
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#00F0FF',
    fontSize: 14,
  },
});
