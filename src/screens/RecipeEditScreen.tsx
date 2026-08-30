import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { addRecipe, updateRecipe, uploadRecipeImage } from '../services/recipeRepository';
import { Recipe, RecipeIngredient } from '../models/types';
import { Ionicons } from '@expo/vector-icons';

const RECIPE_CATEGORIES = [
  'Fleisch', 'Fisch', 'Vegetarisch', 'Pasta', 'Pizza',
  'Suppen', 'Salate', 'Beilagen', 'Desserts', 'Frühstück',
  'Grillen', 'Schnell & einfach'
];

const UNITS = ['g', 'kg', 'ml', 'l', 'Stück', 'TL', 'EL', 'Prise', 'Packung', 'Dose', 'Flasche', 'Becher'];

export default function RecipeEditScreen({ route, navigation }: any) {
  const { recipeId } = route.params || {};
  const { user } = useAuth();
  const isEditing = !!recipeId;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  // Formular-Zustand
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Sonstiges');
  const [servings, setServings] = useState('4');
  const [prepTime, setPrepTime] = useState('30');
  const [notes, setNotes] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  // Zutaten-Zustand
  const [ingredients, setIngredients] = useState<Array<{ name: string; quantity: string; unit: string }>>([
    { name: '', quantity: '', unit: 'g' },
  ]);

  // Schritte-Zustand
  const [steps, setSteps] = useState<string[]>(['']);

  useEffect(() => {
    if (!isEditing || !user?.householdId) return;

    const loadRecipe = async () => {
      try {
        const recipeRef = doc(db, 'households', user.householdId!, 'recipes', recipeId);
        const docSnap = await getDoc(recipeRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as Recipe;
          setName(data.name);
          setDescription(data.description || '');
          setCategory(data.category);
          setServings(data.servings.toString());
          setPrepTime(data.prepTime.toString());
          setNotes(data.notes || '');
          setIsFavorite(data.isFavorite);
          setExistingImageUrl(data.imageUrl);
          setIngredients(
            data.ingredients.length > 0
              ? data.ingredients.map(ing => ({
                  name: ing.name,
                  quantity: ing.quantity !== null ? ing.quantity.toString() : '',
                  unit: ing.unit || 'g',
                }))
              : [{ name: '', quantity: '', unit: 'g' }]
          );
          setSteps(data.steps.length > 0 ? data.steps : ['']);
        }
      } catch (e) {
        console.error(e);
        Alert.alert('Fehler', 'Rezept konnte nicht geladen werden.');
      } finally {
        setLoading(false);
      }
    };

    loadRecipe();
  }, [recipeId, user?.householdId]);

  const pickImage = async (source: 'camera' | 'gallery') => {
    let result;

    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Erlaubnis fehlt', 'Die App benötigt Kamerazugriff, um ein Foto aufzunehmen.');
        return;
      }
      result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.9 });
    } else {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Erlaubnis fehlt', 'Die App benötigt Zugriff auf die Galerie.');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.9 });
    }

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      // Komprimierung: Größe auf max. 500px Breite reduzieren und Base64 anfordern
      const compressed = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 500 } }],
        { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      if (compressed.base64) {
        setImageUri(`data:image/jpeg;base64,${compressed.base64}`);
      } else {
        setImageUri(compressed.uri);
      }
    }
  };

  const showImagePicker = () => {
    Alert.alert('Bild hinzufügen', 'Wähle eine Quelle aus', [
      { text: 'Kamera', onPress: () => pickImage('camera') },
      { text: 'Galerie', onPress: () => pickImage('gallery') },
      { text: 'Abbrechen', style: 'cancel' },
    ]);
  };

  const addIngredientRow = () => {
    setIngredients([...ingredients, { name: '', quantity: '', unit: 'g' }]);
  };

  const removeIngredientRow = (index: number) => {
    if (ingredients.length <= 1) return;
    const updated = ingredients.filter((_, i) => i !== index);
    setIngredients(updated);
  };

  const updateIngredient = (index: number, field: 'name' | 'quantity' | 'unit', value: string) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const addStepRow = () => setSteps([...steps, '']);
  const removeStepRow = (index: number) => {
    if (steps.length <= 1) return;
    setSteps(steps.filter((_, i) => i !== index));
  };
  const updateStep = (index: number, value: string) => {
    const updated = [...steps];
    updated[index] = value;
    setSteps(updated);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Pflichtfeld', 'Bitte gib einen Rezeptnamen ein.');
      return;
    }
    if (!user?.householdId) return;

    setSaving(true);
    try {
      // Bild hochladen (falls neu ausgewählt)
      let imageUrl: string | null = existingImageUrl;
      if (imageUri) {
        imageUrl = await uploadRecipeImage(user.householdId, imageUri);
      }

      // Zutaten parsen
      const parsedIngredients: RecipeIngredient[] = ingredients
        .filter(ing => ing.name.trim())
        .map(ing => ({
          name: ing.name.trim(),
          quantity: ing.quantity ? parseFloat(ing.quantity.replace(',', '.')) : null,
          unit: ing.unit || null,
        }));

      // Schritte bereinigen
      const cleanedSteps = steps.filter(s => s.trim());

      const recipeData: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'> = {
        name: name.trim(),
        description: description.trim(),
        category,
        servings: parseInt(servings, 10) || 4,
        prepTime: parseInt(prepTime, 10) || 30,
        notes: notes.trim(),
        isFavorite,
        imageUrl,
        ingredients: parsedIngredients,
        steps: cleanedSteps,
      };

      if (isEditing) {
        await updateRecipe(user.householdId, recipeId, recipeData);
        Alert.alert('Gespeichert', 'Das Rezept wurde erfolgreich aktualisiert.');
        navigation.goBack();
      } else {
        const newId = await addRecipe(user.householdId, recipeData);
        Alert.alert('Erstellt', 'Das Rezept wurde erfolgreich gespeichert.');
        navigation.replace('RecipeDetail', { recipeId: newId });
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Fehler', 'Das Rezept konnte nicht gespeichert werden. Prüfe bitte deine Internetverbindung.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF007F" />
      </View>
    );
  }

  const previewImageUri = imageUri || existingImageUrl;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? 'Rezept bearbeiten' : 'Neues Rezept'}</Text>
          <TouchableOpacity onPress={() => setIsFavorite(!isFavorite)} style={styles.favBtn}>
            <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={24} color={isFavorite ? '#FF007F' : '#FFF'} />
          </TouchableOpacity>
        </View>

        {/* Bild */}
        <TouchableOpacity style={styles.imagePicker} onPress={showImagePicker}>
          {previewImageUri ? (
            <Image source={{ uri: previewImageUri }} style={styles.previewImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera-outline" size={40} color="#4E4960" />
              <Text style={styles.imagePlaceholderText}>Bild hinzufügen</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Grunddaten */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Grunddaten</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name *</Text>
            <TextInput style={styles.input} placeholder="z.B. Spaghetti Bolognese" placeholderTextColor="#635B7A"
              value={name} onChangeText={setName} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Beschreibung</Text>
            <TextInput style={[styles.input, styles.multilineInput]} placeholder="Kurze Beschreibung..." placeholderTextColor="#635B7A"
              value={description} onChangeText={setDescription} multiline numberOfLines={3} />
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Portionen</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={servings}
                onChangeText={setServings} placeholderTextColor="#635B7A" />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Zeit (Min.)</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={prepTime}
                onChangeText={setPrepTime} placeholderTextColor="#635B7A" />
            </View>
          </View>
        </View>

        {/* Kategorie */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kategorie</Text>
          <View style={styles.tagSelector}>
            {RECIPE_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.tag, category === cat && styles.tagSelected]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.tagText, category === cat && styles.tagTextSelected]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Zutaten */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Zutaten</Text>
          {ingredients.map((ing, i) => (
            <View key={i} style={styles.ingredientRow}>
              <TextInput
                style={[styles.input, { flex: 3, marginRight: 4 }]}
                placeholder="Zutat"
                placeholderTextColor="#635B7A"
                value={ing.name}
                onChangeText={v => updateIngredient(i, 'name', v)}
              />
              <TextInput
                style={[styles.input, { flex: 1.2, marginRight: 4 }]}
                placeholder="Menge"
                placeholderTextColor="#635B7A"
                keyboardType="numeric"
                value={ing.quantity}
                onChangeText={v => updateIngredient(i, 'quantity', v)}
              />
              <TextInput
                style={[styles.input, { flex: 1.2 }]}
                placeholder="Einh."
                placeholderTextColor="#635B7A"
                value={ing.unit}
                onChangeText={v => updateIngredient(i, 'unit', v)}
              />
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeIngredientRow(i)}>
                <Ionicons name="close-circle" size={22} color="#FF007F" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.addRowBtn} onPress={addIngredientRow}>
            <Ionicons name="add-circle-outline" size={20} color="#00F0FF" />
            <Text style={styles.addRowBtnText}>Zutat hinzufügen</Text>
          </TouchableOpacity>
        </View>

        {/* Zubereitung */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Zubereitung</Text>
          {steps.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{i + 1}</Text>
              </View>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 8 }]}
                placeholder={`Schritt ${i + 1}...`}
                placeholderTextColor="#635B7A"
                value={step}
                onChangeText={v => updateStep(i, v)}
                multiline
              />
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeStepRow(i)}>
                <Ionicons name="close-circle" size={22} color="#FF007F" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.addRowBtn} onPress={addStepRow}>
            <Ionicons name="add-circle-outline" size={20} color="#00F0FF" />
            <Text style={styles.addRowBtnText}>Schritt hinzufügen</Text>
          </TouchableOpacity>
        </View>

        {/* Notizen */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Persönliche Notizen</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Tipps, Variationen, Erinnerungen..."
            placeholderTextColor="#635B7A"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Speichern-Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="save-outline" size={22} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.saveButtonText}>
                {isEditing ? 'Änderungen speichern' : 'Rezept erstellen'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0813' },
  loadingContainer: { flex: 1, backgroundColor: '#0B0813', justifyContent: 'center', alignItems: 'center' },
  content: { paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: Platform.OS === 'ios' ? 44 : 16 },
  backBtn: { padding: 8 },
  favBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  imagePicker: { marginHorizontal: 16, marginBottom: 16, borderRadius: 12, overflow: 'hidden' },
  previewImage: { width: '100%', height: 200, borderRadius: 12 },
  imagePlaceholder: { height: 180, backgroundColor: '#161224', borderWidth: 1, borderColor: '#26203D', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  imagePlaceholderText: { color: '#4E4960', marginTop: 8, fontSize: 14 },
  section: { marginHorizontal: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFF', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#26203D', paddingBottom: 6 },
  inputGroup: { marginBottom: 12 },
  label: { color: '#9E97B2', fontSize: 11, fontWeight: 'bold', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
  input: { backgroundColor: '#161224', borderWidth: 1, borderColor: '#26203D', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: '#FFF', fontSize: 15 },
  multilineInput: { minHeight: 80, textAlignVertical: 'top' },
  rowInputs: { flexDirection: 'row' },
  tagSelector: { flexDirection: 'row', flexWrap: 'wrap' },
  tag: { backgroundColor: '#161224', borderWidth: 1, borderColor: '#26203D', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, marginBottom: 8 },
  tagSelected: { borderColor: '#FF007F', backgroundColor: 'rgba(255,0,127,0.1)' },
  tagText: { color: '#9E97B2', fontSize: 12 },
  tagTextSelected: { color: '#FF007F', fontWeight: 'bold' },
  ingredientRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FF007F', justifyContent: 'center', alignItems: 'center', marginRight: 8, marginTop: 10 },
  stepNumberText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  removeBtn: { paddingHorizontal: 4 },
  addRowBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  addRowBtnText: { color: '#00F0FF', marginLeft: 6, fontSize: 14 },
  saveButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FF007F', borderRadius: 12, paddingVertical: 16, marginHorizontal: 16, marginTop: 8, shadowColor: '#FF007F', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 10 },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
