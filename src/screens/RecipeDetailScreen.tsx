import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Platform
} from 'react-native';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { deleteRecipe, addRecipeToShoppingList, updateRecipe } from '../services/recipeRepository';
import { Recipe } from '../models/types';
import { scaleRecipe } from '../utils/recipeScaler';
import { formatQuantity } from '../utils/unitConverter';
import { Ionicons } from '@expo/vector-icons';

export default function RecipeDetailScreen({ route, navigation }: any) {
  const { recipeId } = route.params;
  const { user } = useAuth();
  
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [targetServings, setTargetServings] = useState(4);

  useEffect(() => {
    if (!user?.householdId || !recipeId) return;

    const recipeRef = doc(db, 'households', user.householdId, 'recipes', recipeId);
    
    const unsubscribe = onSnapshot(recipeRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data() as Recipe;
        setRecipe({
          ...data,
          id: docSnapshot.id,
        });
        setTargetServings(data.servings);
      } else {
        setRecipe(null);
      }
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.householdId, recipeId]);

  const handleToggleFavorite = async () => {
    if (!user?.householdId || !recipe) return;
    try {
      await updateRecipe(user.householdId, recipe.id, {
        isFavorite: !recipe.isFavorite
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddToShoppingList = async () => {
    if (!user?.householdId || !recipe || !user?.id) return;
    
    try {
      await addRecipeToShoppingList(user.householdId, recipe, targetServings, user.id);
      Alert.alert(
        'Erfolg', 
        `Die Zutaten für ${targetServings} Personen wurden erfolgreich mit deiner Einkaufsliste zusammengeführt!`,
        [{ text: 'OK', onPress: () => navigation.navigate('Einkauf') }]
      );
    } catch (e) {
      console.error(e);
      Alert.alert('Fehler', 'Zutaten konnten nicht hinzugefügt werden.');
    }
  };

  const handleDelete = () => {
    if (!user?.householdId || !recipe) return;

    Alert.alert(
      'Rezept löschen?',
      `Möchtest du das Rezept "${recipe.name}" wirklich löschen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { 
          text: 'Löschen', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await deleteRecipe(user.householdId!, recipe.id, recipe.imageUrl);
              navigation.goBack();
            } catch (e) {
              console.error(e);
              Alert.alert('Fehler', 'Das Rezept konnte nicht gelöscht werden.');
            }
          } 
        }
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

  if (!recipe) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Das Rezept konnte nicht gefunden werden.</Text>
      </View>
    );
  }

  // Skaliere das Rezept lokal für die Anzeige
  const scaledRecipe = scaleRecipe(recipe, targetServings);

  return (
    <ScrollView style={styles.container}>
      {/* Rezept-Bild */}
      {recipe.imageUrl ? (
        <Image source={{ uri: recipe.imageUrl }} style={styles.image} />
      ) : (
        <View style={styles.placeholderImage}>
          <Ionicons name="fast-food-outline" size={60} color="#4E4960" />
        </View>
      )}

      {/* Header Actions */}
      <View style={styles.actionHeader}>
        <TouchableOpacity 
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        
        <View style={styles.rightActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleToggleFavorite}>
            <Ionicons 
              name={recipe.isFavorite ? 'heart' : 'heart-outline'} 
              size={24} 
              color={recipe.isFavorite ? '#FF007F' : '#FFF'} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconBtn} 
            onPress={() => navigation.navigate('RecipeEdit', { recipeId: recipe.id })}
          >
            <Ionicons name="create-outline" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={24} color="#FF007F" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {/* Titel */}
        <Text style={styles.title}>{recipe.name}</Text>
        <Text style={styles.category}>{recipe.category}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={18} color="#00F0FF" />
            <Text style={styles.metaText}>{recipe.prepTime} Minuten</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="restaurant-outline" size={18} color="#00F0FF" />
            <Text style={styles.metaText}>Original: {recipe.servings} Pers.</Text>
          </View>
        </View>

        {/* Portionen-Skalierer */}
        <View style={styles.servingsCard}>
          <Text style={styles.servingsTitle}>Portionen anpassen</Text>
          <View style={styles.servingsControl}>
            <TouchableOpacity 
              style={styles.servingsBtn}
              onPress={() => setTargetServings(Math.max(1, targetServings - 1))}
            >
              <Ionicons name="remove" size={24} color="#00F0FF" />
            </TouchableOpacity>
            <Text style={styles.servingsNumber}>{targetServings}</Text>
            <TouchableOpacity 
              style={styles.servingsBtn}
              onPress={() => setTargetServings(targetServings + 1)}
            >
              <Ionicons name="add" size={24} color="#00F0FF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Button: In Einkaufsliste übernehmen */}
        <TouchableOpacity 
          style={styles.buyButton}
          onPress={handleAddToShoppingList}
        >
          <Ionicons name="cart-outline" size={22} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.buyButtonText}>Zutaten einkaufen</Text>
        </TouchableOpacity>

        {/* Zutaten-Sektion */}
        <Text style={styles.sectionTitle}>Zutaten</Text>
        <View style={styles.ingredientsList}>
          {scaledRecipe.ingredients.map((ing, index) => (
            <View key={index} style={styles.ingredientRow}>
              <Text style={styles.ingredientName}>• {ing.name}</Text>
              {(ing.quantity !== null || ing.unit) && (
                <Text style={styles.ingredientAmount}>
                  {formatQuantity(ing.quantity)} {ing.unit || ''}
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* Zubereitungsschritte */}
        <Text style={styles.sectionTitle}>Zubereitung</Text>
        {recipe.steps.length > 0 ? (
          recipe.steps.map((step, index) => (
            <View key={index} style={styles.stepRow}>
              <View style={styles.stepNumberCircle}>
                <Text style={styles.stepNumber}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Keine Zubereitungsschritte angegeben.</Text>
        )}

        {/* Persönliche Notizen */}
        {recipe.notes ? (
          <View style={styles.notesContainer}>
            <Text style={styles.notesTitle}>Notizen</Text>
            <Text style={styles.notesText}>{recipe.notes}</Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0813',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0B0813',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0B0813',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FF007F',
    fontSize: 16,
    textAlign: 'center',
  },
  image: {
    width: '100%',
    height: 250,
  },
  placeholderImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#161224',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : 20,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    backgroundColor: 'rgba(11, 8, 19, 0.6)',
    borderRadius: 20,
    padding: 8,
  },
  rightActions: {
    flexDirection: 'row',
  },
  iconBtn: {
    backgroundColor: 'rgba(11, 8, 19, 0.6)',
    borderRadius: 20,
    padding: 8,
    marginLeft: 8,
  },
  content: {
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#0B0813',
    marginTop: -24,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
  },
  category: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#00F0FF',
    textTransform: 'uppercase',
    marginTop: 6,
    letterSpacing: 1,
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  metaText: {
    color: '#9E97B2',
    fontSize: 14,
    marginLeft: 6,
  },
  servingsCard: {
    backgroundColor: '#161224',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#26203D',
    alignItems: 'center',
    marginBottom: 20,
  },
  servingsTitle: {
    color: '#9E97B2',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  servingsControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  servingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#2D254B',
    backgroundColor: '#0F0B1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  servingsNumber: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginHorizontal: 24,
  },
  buyButton: {
    backgroundColor: '#FF007F',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF007F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    marginBottom: 24,
  },
  buyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#26203D',
    paddingBottom: 6,
  },
  ingredientsList: {
    backgroundColor: '#161224',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#26203D',
    padding: 16,
    marginBottom: 20,
  },
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#26203D',
  },
  ingredientName: {
    color: '#FFF',
    fontSize: 15,
  },
  ingredientAmount: {
    color: '#00F0FF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF007F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumber: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  stepText: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
    lineHeight: 22,
  },
  emptyText: {
    color: '#9E97B2',
    fontSize: 14,
    fontStyle: 'italic',
  },
  notesContainer: {
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
    borderLeftWidth: 3,
    borderLeftColor: '#00F0FF',
    borderRadius: 8,
    padding: 16,
    marginVertical: 20,
  },
  notesTitle: {
    color: '#00F0FF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  notesText: {
    color: '#FFF',
    fontSize: 14,
    lineHeight: 20,
  },
});
