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
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const { login, register, loginWithGoogle } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setAuthLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error(err);
      let cleanMsg = 'Google-Anmeldung fehlgeschlagen. Bitte versuche es erneut.';
      if (err.code === 'auth/popup-blocked') {
        cleanMsg = 'Das Google-Popup-Fenster wurde blockiert. Bitte erlaube Popups für diese Seite.';
      }
      setErrorMsg(cleanMsg);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!email || !password || (isRegister && !name)) {
      setErrorMsg('Bitte alle Felder ausfüllen.');
      return;
    }
    setErrorMsg('');
    setAuthLoading(true);

    try {
      if (isRegister) {
        await register(email.trim(), password, name.trim());
      } else {
        await login(email.trim(), password);
      }
    } catch (err: any) {
      console.error(err);
      let cleanMsg = 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.';
      if (err.code === 'auth/invalid-email') cleanMsg = 'Ungültige E-Mail-Adresse.';
      else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        cleanMsg = 'E-Mail oder Passwort ist nicht korrekt.';
      } else if (err.code === 'auth/email-already-in-use') cleanMsg = 'Diese E-Mail-Adresse wird bereits verwendet.';
      else if (err.code === 'auth/weak-password') cleanMsg = 'Das Passwort muss mindestens 6 Zeichen haben.';
      
      setErrorMsg(cleanMsg);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.headerContainer}>
          <Text style={styles.logoText}>🛒 EINKAUFS- & KOCH-APP</Text>
          <Text style={styles.subtitleText}>Gemeinsam einkaufen & kochen</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {isRegister ? 'Registrieren' : 'Anmelden'}
          </Text>

          {errorMsg ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {isRegister && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput 
                style={styles.input}
                placeholder="Dein Name"
                placeholderTextColor="#635B7A"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-Mail</Text>
            <TextInput 
              style={styles.input}
              placeholder="name@beispiel.de"
              placeholderTextColor="#635B7A"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Passwort</Text>
            <TextInput 
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#635B7A"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, styles.neonPinkButton]}
            onPress={handleSubmit}
            disabled={authLoading}
          >
            {authLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>
                {isRegister ? 'Konto erstellen' : 'Einloggen'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ODER</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity 
            style={[styles.button, styles.googleButton]}
            onPress={handleGoogleLogin}
            disabled={authLoading}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="logo-google" size={18} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>Mit Google anmelden</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.switchButton}
            onPress={() => {
              setIsRegister(!isRegister);
              setErrorMsg('');
            }}
          >
            <Text style={styles.switchButtonText}>
              {isRegister 
                ? 'Bereits registriert? Hier einloggen' 
                : 'Noch kein Konto? Hier registrieren'}
            </Text>
          </TouchableOpacity>
        </View>
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
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#00F0FF',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 240, 255, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitleText: {
    fontSize: 14,
    color: '#9E97B2',
    marginTop: 8,
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
    textAlign: 'center',
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
    marginTop: 20,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  neonPinkButton: {
    backgroundColor: '#FF007F',
    shadowColor: '#FF007F',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#00F0FF',
    fontSize: 14,
  },
  googleButton: {
    backgroundColor: '#4285F4',
    shadowColor: '#4285F4',
    marginTop: 10,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#2D254B',
  },
  dividerText: {
    color: '#9E97B2',
    paddingHorizontal: 10,
    fontSize: 12,
    fontWeight: 'bold',
  },
});
