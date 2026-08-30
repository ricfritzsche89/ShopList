import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { subscribeToRecipes } from '../services/recipeRepository';
import {
  subscribeToWeeklyPlan,
  initializeWeeklyPlan,
  updateWeeklyPlanDay,
  addWeeklyPlanToShoppingList,
  getWeekId,
} from '../services/weeklyPlanRepository';
import { Recipe, WeeklyPlan } from '../models/types';
import { Ionicons } from '@expo/vector-icons';

const DAY_LABELS: { key: keyof WeeklyPlan['days']; label: string; short: string }[] = [
  { key: 'monday', label: 'Montag', short: 'Mo' },
  { key: 'tuesday', label: 'Dienstag', short: 'Di' },
  { key: 'wednesday', label: 'Mittwoch', short: 'Mi' },
  { key: 'thursday', label: 'Donnerstag', short: 'Do' },
  { key: 'friday', label: 'Freitag', short: 'Fr' },
  { key: 'saturday', label: 'Samstag', short: 'Sa' },
  { key: 'sunday', label: 'Sonntag', short: 'So' },
];

export default function WeeklyPlanScreen({ navigation }: any) {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToList, setAddingToList] = useState(false);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [selectedDayKey, setSelectedDayKey] = useState<keyof WeeklyPlan['days'] | null>(null);
  const [selectedDayLabel, setSelectedDayLabel] = useState('');

  const weekId = getWeekId();

  useEffect(() => {
    if (!user?.householdId) return;

    setLoading(true);

    // Wochenplan initialisieren falls nicht vorhanden
    initializeWeeklyPlan(user.householdId, weekId, 2).catch(console.error);

    // Rezepte abonnieren
    const unsubRecipes = subscribeToRecipes(user.householdId, (r) => setRecipes(r));

    // Wochenplan abonnieren
    const unsubPlan = subscribeToWeeklyPlan(user.householdId, weekId, (plan) => {
      setWeeklyPlan(plan);
      setLoading(false);
    });

    return () => {
      unsubRecipes();
      unsubPlan();
    };
  }, [user?.householdId]);

  /**
   * Wählt zufällig 7 verschiedene Rezepte aus,
   * vermeidet Wiederholungen zum vorherigen Wochenplan per Fisher-Yates-Shuffle
   */
  const handleRandomPlan = async () => {
    if (!user?.householdId || !weeklyPlan) return;
    if (recipes.length < 1) {
      Alert.alert('Keine Rezepte', 'Füge zuerst Rezepte in dein Kochbuch ein, damit sie hier eingeplant werden können.');
      return;
    }

    // Fisher-Yates Shuffle
    const shuffled = [...recipes].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, Math.min(7, shuffled.length));

    try {
      for (let i = 0; i < DAY_LABELS.length; i++) {
        const dayKey = DAY_LABELS[i].key;
        const recipe = picked[i] || null;
        await updateWeeklyPlanDay(
          user.householdId,
          weekId,
          dayKey,
          recipe?.id || null,
          recipe?.name || '',
          weeklyPlan.defaultServings
        );
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Fehler', 'Wochenplan konnte nicht erstellt werden.');
    }
  };

  const handleDayTap = (dayKey: keyof WeeklyPlan['days'], dayLabel: string) => {
    setSelectedDayKey(dayKey);
    setSelectedDayLabel(dayLabel);
    setPickerVisible(true);
  };

  const handlePickRecipe = async (recipe: Recipe | null) => {
    if (!user?.householdId || !selectedDayKey || !weeklyPlan) return;
    setPickerVisible(false);
    try {
      await updateWeeklyPlanDay(
        user.householdId,
        weekId,
        selectedDayKey,
        recipe?.id || null,
        recipe?.name || '',
        weeklyPlan.days[selectedDayKey].servings
      );
    } catch (e) {
      console.error(e);
      Alert.alert('Fehler', 'Tag konnte nicht aktualisiert werden.');
    }
  };

  const handleRandomDay = async (dayKey: keyof WeeklyPlan['days']) => {
    if (!user?.householdId || !weeklyPlan || recipes.length === 0) return;
    
    // Aktuell im Plan verwendete Rezepte ausschließen, damit keine Dopplung entsteht
    const usedIds = new Set(
      Object.values(weeklyPlan.days)
        .filter(d => d.recipeId)
        .map(d => d.recipeId!)
    );
    
    const available = recipes.filter(r => !usedIds.has(r.id));
    const pool = available.length > 0 ? available : recipes;
    const chosen = pool[Math.floor(Math.random() * pool.length)];

    try {
      await updateWeeklyPlanDay(
        user.householdId,
        weekId,
        dayKey,
        chosen.id,
        chosen.name,
        weeklyPlan.days[dayKey].servings
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddAllToShoppingList = async () => {
    if (!user?.householdId || !user?.id) return;

    Alert.alert(
      'Alle Zutaten einkaufen?',
      'Alle Zutaten des aktuellen Wochenplans werden skaliert und mit deiner Einkaufsliste zusammengeführt.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Hinzufügen',
          onPress: async () => {
            setAddingToList(true);
            try {
              await addWeeklyPlanToShoppingList(user.householdId!, weekId, user.id);
              Alert.alert('Fertig!', 'Alle Zutaten wurden deiner Einkaufsliste hinzugefügt.', [
                { text: 'Zur Einkaufsliste', onPress: () => navigation.navigate('Einkauf') },
                { text: 'OK' },
              ]);
            } catch (e) {
              console.error(e);
              Alert.alert('Fehler', 'Zutaten konnten nicht hinzugefügt werden.');
            } finally {
              setAddingToList(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF007F" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header mit Aktions-Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.randomBtn} onPress={handleRandomPlan}>
            <Ionicons name="shuffle" size={18} color="#00F0FF" />
            <Text style={styles.randomBtnText}>Zufällig planen</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buyBtn}
            onPress={handleAddAllToShoppingList}
            disabled={addingToList}
          >
            {addingToList ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="cart" size={18} color="#FFF" />
                <Text style={styles.buyBtnText}>Alle einkaufen</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* 7-Tage-Grid */}
        {DAY_LABELS.map(({ key, label, short }) => {
          const dayPlan = weeklyPlan?.days[key];
          const hasRecipe = !!dayPlan?.recipeId;

          return (
            <View key={key} style={styles.dayCard}>
              <View style={styles.dayLabelContainer}>
                <Text style={styles.dayShort}>{short}</Text>
                <Text style={styles.dayFull}>{label}</Text>
              </View>

              <TouchableOpacity
                style={[styles.recipePicker, !hasRecipe && styles.recipePickerEmpty]}
                onPress={() => handleDayTap(key, label)}
              >
                {hasRecipe ? (
                  <Text style={styles.recipePickedName} numberOfLines={1}>
                    {dayPlan?.recipeName}
                  </Text>
                ) : (
                  <Text style={styles.recipePickerPlaceholder}>Tippen zum Planen</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shuffleDayBtn}
                onPress={() => handleRandomDay(key)}
              >
                <Ionicons name="shuffle" size={18} color="#9E97B2" />
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      {/* Rezept-Picker Modal */}
      <Modal visible={pickerVisible} animationType="slide" transparent onRequestClose={() => setPickerVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedDayLabel}</Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)}>
                <Ionicons name="close" size={24} color="#9E97B2" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.clearDayBtn} onPress={() => handlePickRecipe(null)}>
              <Ionicons name="close-circle-outline" size={18} color="#FF007F" />
              <Text style={styles.clearDayText}>Kein Gericht (leer lassen)</Text>
            </TouchableOpacity>

            <FlatList
              data={recipes}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.recipePickerItem} onPress={() => handlePickRecipe(item)}>
                  <View>
                    <Text style={styles.recipePickerItemName}>{item.name}</Text>
                    <Text style={styles.recipePickerItemCat}>{item.category} • {item.servings} Pers.</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#4E4960" />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Noch keine Rezepte vorhanden.</Text>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0813' },
  loadingContainer: { flex: 1, backgroundColor: '#0B0813', justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  randomBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#00F0FF', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: 'rgba(0,240,255,0.05)' },
  randomBtnText: { color: '#00F0FF', marginLeft: 6, fontWeight: 'bold', fontSize: 14 },
  buyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF007F', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, shadowColor: '#FF007F', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 6 },
  buyBtnText: { color: '#FFF', marginLeft: 6, fontWeight: 'bold', fontSize: 14 },
  dayCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161224', borderWidth: 1, borderColor: '#26203D', borderRadius: 12, padding: 12, marginBottom: 10 },
  dayLabelContainer: { width: 44 },
  dayShort: { color: '#00F0FF', fontWeight: '900', fontSize: 14 },
  dayFull: { color: '#9E97B2', fontSize: 11 },
  recipePicker: { flex: 1, marginHorizontal: 10, backgroundColor: '#0F0B1E', borderWidth: 1, borderColor: '#2D254B', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  recipePickerEmpty: { borderStyle: 'dashed' },
  recipePickedName: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  recipePickerPlaceholder: { color: '#4E4960', fontSize: 13 },
  shuffleDayBtn: { padding: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(11,8,19,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#161224', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '75%', borderWidth: 1, borderColor: '#26203D' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  clearDayBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#26203D', marginBottom: 8 },
  clearDayText: { color: '#FF007F', marginLeft: 8, fontSize: 14 },
  recipePickerItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1D192C' },
  recipePickerItemName: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  recipePickerItemCat: { color: '#9E97B2', fontSize: 12, marginTop: 2 },
  emptyText: { color: '#9E97B2', textAlign: 'center', paddingVertical: 20 },
});
