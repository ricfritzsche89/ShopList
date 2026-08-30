import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

export default function ProfileScreen() {
  const { user, household, logout, leaveHousehold } = useAuth();

  const memberCount = household ? Object.keys(household.members).length : 0;
  const members = household ? Object.entries(household.members) : [];

  const handleCopyId = async () => {
    if (user?.householdId) {
      await Clipboard.setStringAsync(user.householdId);
      Alert.alert('Kopiert!', 'Die Haushalts-ID wurde in die Zwischenablage kopiert. Gib sie einer anderen Person, damit sie beitreten kann.');
    }
  };

  const handleLeave = () => {
    Alert.alert(
      'Haushalt verlassen?',
      'Möchtest du wirklich den Haushalt verlassen? Du verlierst den Zugriff auf alle gemeinsamen Daten.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Verlassen',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveHousehold();
            } catch (e) {
              console.error(e);
              Alert.alert('Fehler', 'Der Haushalt konnte nicht verlassen werden.');
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Abmelden?',
      'Möchtest du dich wirklich abmelden?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Abmelden', onPress: logout },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Benutzer-Karte */}
      <View style={styles.userCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitial}>
            {(user?.displayName || 'U')[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.displayName}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>
      </View>

      {/* Haushalt-Sektion */}
      {household && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Haushalt</Text>

          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.cardRowIcon}>
                <Ionicons name="home-outline" size={20} color="#00F0FF" />
              </View>
              <View style={styles.cardRowContent}>
                <Text style={styles.cardRowLabel}>Name</Text>
                <Text style={styles.cardRowValue}>{household.name}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardRow}>
              <View style={styles.cardRowIcon}>
                <Ionicons name="people-outline" size={20} color="#00F0FF" />
              </View>
              <View style={styles.cardRowContent}>
                <Text style={styles.cardRowLabel}>Mitglieder ({memberCount})</Text>
                {members.map(([uid, member]) => (
                  <Text key={uid} style={styles.memberText}>
                    {member.name} {member.role === 'admin' ? '👑' : ''}
                  </Text>
                ))}
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardRow}>
              <View style={styles.cardRowIcon}>
                <Ionicons name="key-outline" size={20} color="#00F0FF" />
              </View>
              <View style={styles.cardRowContent}>
                <Text style={styles.cardRowLabel}>Haushalts-ID (zum Einladen)</Text>
                <Text style={styles.householdId} numberOfLines={1} ellipsizeMode="middle">
                  {user?.householdId}
                </Text>
              </View>
              <TouchableOpacity onPress={handleCopyId} style={styles.copyBtn}>
                <Ionicons name="copy-outline" size={20} color="#FF007F" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave}>
            <Ionicons name="exit-outline" size={18} color="#FF007F" />
            <Text style={styles.leaveBtnText}>Haushalt verlassen</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* App-Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Über die App</Text>
        <View style={styles.card}>
          <Text style={styles.appInfoText}>
            Gemeinsame Einkaufslisten- &amp; Kochbuch-App
          </Text>
          <Text style={styles.appVersionText}>Version 1.0.0</Text>
          <Text style={styles.appInfoSubText}>
            Alle Daten werden sicher in der Cloud gespeichert und in Echtzeit synchronisiert.
            Änderungen sind auch offline verfügbar und werden bei Wiederherstellung der
            Verbindung automatisch synchronisiert.
          </Text>
        </View>
      </View>

      {/* Abmelden */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#FFF" />
        <Text style={styles.logoutBtnText}>Abmelden</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0813' },
  content: { padding: 20, paddingTop: 40, paddingBottom: 60 },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161224', borderWidth: 1, borderColor: '#26203D', borderRadius: 16, padding: 20, marginBottom: 28 },
  avatarCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FF007F', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarInitial: { color: '#FFF', fontSize: 24, fontWeight: '900' },
  userInfo: { flex: 1 },
  userName: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  userEmail: { color: '#9E97B2', fontSize: 13, marginTop: 4 },
  section: { marginBottom: 24 },
  sectionTitle: { color: '#9E97B2', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 },
  card: { backgroundColor: '#161224', borderWidth: 1, borderColor: '#26203D', borderRadius: 12, overflow: 'hidden' },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 16 },
  cardRowIcon: { width: 36, alignItems: 'center', paddingTop: 2 },
  cardRowContent: { flex: 1 },
  cardRowLabel: { color: '#9E97B2', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  cardRowValue: { color: '#FFF', fontSize: 15 },
  memberText: { color: '#FFF', fontSize: 14, marginTop: 4 },
  householdId: { color: '#00F0FF', fontSize: 13, fontFamily: 'monospace', marginTop: 4 },
  copyBtn: { padding: 8 },
  divider: { height: 1, backgroundColor: '#26203D', marginHorizontal: 16 },
  leaveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, paddingVertical: 10 },
  leaveBtnText: { color: '#FF007F', marginLeft: 6, fontWeight: 'bold' },
  appInfoText: { color: '#FFF', fontWeight: 'bold', padding: 16, paddingBottom: 4 },
  appVersionText: { color: '#00F0FF', fontSize: 12, paddingHorizontal: 16, paddingBottom: 8 },
  appInfoSubText: { color: '#9E97B2', fontSize: 13, paddingHorizontal: 16, paddingBottom: 16, lineHeight: 20 },
  logoutBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#26203D', borderRadius: 12, paddingVertical: 14, marginTop: 8 },
  logoutBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
});
