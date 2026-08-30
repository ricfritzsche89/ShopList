import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { subscribeToRecipes } from '../services/recipeRepository';
import { Recipe } from '../models/types';
import { Ionicons } from '@expo/vector-icons';

// Hilfsfunktion zur Umlaut-Normalisierung bei der Suche
export function normalizeSearch(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ß/g, 'ss');
}

export default function RecipeListScreen({ navigation }: any) {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const categories = [
    'Fleisch', 'Fisch', 'Vegetarisch', 'Pasta', 'Pizza', 
    'Suppen', 'Salate', 'Beilagen', 'Desserts', 'Frühstück', 
    'Grillen', 'Schnell & einfach'
  ];

  useEffect(() => {
    if (!user?.householdId) return;

    setLoading(true);
    const unsubscribe = subscribeToRecipes(user.householdId, (items) => {
      setRecipes(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.householdId]);

  // Filterung der Rezepte lokal
  const filteredRecipes = recipes.filter(recipe => {
    // 1. Kategoriefilter
    if (selectedCategory && recipe.category !== selectedCategory) {
      return false;
    }

    // 2. Textsuche
    if (searchQuery.trim()) {
      const normQuery = normalizeSearch(searchQuery);
      const normName = normalizeSearch(recipe.name);
      const normDesc = normalizeSearch(recipe.description || '');
      
      // Sucht im Namen oder in der Beschreibung
      return normName.includes(normQuery) || normDesc.includes(normQuery);
    }

    return true;
  });

  const renderRecipeCard = ({ item }: { item: Recipe }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('RecipeDetail', { recipeId: item.id })}
    >
      {item.imageUrl ? (
        <Image 
          source={{ uri: item.imageUrl }} 
          style={styles.cardImage} 
          resizeMode="cover"
        />
      ) : (
        <View style={styles.placeholderImage}>
          <Ionicons name="fast-food-outline" size={40} color="#4E4960" />
        </View>
      )}

      {item.isFavorite && (
        <View style={styles.favoriteBadge}>
          <Ionicons name="heart" size={16} color="#FF007F" />
        </View>
      )}

      <View style={styles.cardContent}>
        <Text style={styles.recipeName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.recipeCategory}>{item.category}</Text>
        
        <View style={styles.recipeInfo}>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={14} color="#9E97B2" />
            <Text style={styles.infoText}>{item.prepTime} Min.</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="people-outline" size={14} color="#9E97B2" />
            <Text style={styles.infoText}>{item.servings} Pers.</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Suche */}
      <View style={styles.searchBarContainer}>
        <Ionicons name="search" size={20} color="#635B7A" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rezept suchen..."
          placeholderTextColor="#635B7A"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#635B7A" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Kategorien */}
      <View style={styles.categoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.categoryBadge,
              selectedCategory === null && styles.categoryBadgeSelected
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[
              styles.categoryBadgeText,
              selectedCategory === null && styles.categoryBadgeTextSelected
            ]}>
              Alle
            </Text>
          </TouchableOpacity>

          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryBadge,
                selectedCategory === cat && styles.categoryBadgeSelected
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[
                styles.categoryBadgeText,
                selectedCategory === cat && styles.categoryBadgeTextSelected
              ]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Liste */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF007F" />
        </View>
      ) : (
        <FlatList
          data={filteredRecipes}
          keyExtractor={(item) => item.id}
          renderItem={renderRecipeCard}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="book-outline" size={48} color="#4E4960" />
              <Text style={styles.emptyText}>Dein Kochbuch ist noch leer.</Text>
              <Text style={styles.emptySubText}>
                Erstelle dein erstes Rezept, indem du unten auf das Plus klickst.
              </Text>
              <TouchableOpacity 
                style={styles.createBtn}
                onPress={() => navigation.navigate('RecipeEdit', { recipeId: null })}
              >
                <Text style={styles.createBtnText}>Rezept erstellen</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Floating Action Button zum Erstellen eines neuen Rezepts */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('RecipeEdit', { recipeId: null })}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0813',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161224',
    borderWidth: 1,
    borderColor: '#26203D',
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
  },
  categoriesContainer: {
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  categoryBadge: {
    backgroundColor: '#161224',
    borderWidth: 1,
    borderColor: '#26203D',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  categoryBadgeSelected: {
    borderColor: '#FF007F',
    backgroundColor: 'rgba(255, 0, 127, 0.1)',
  },
  categoryBadgeText: {
    color: '#9E97B2',
    fontSize: 12,
  },
  categoryBadgeTextSelected: {
    color: '#FF007F',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 8,
    paddingBottom: 80,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  card: {
    width: '48%',
    backgroundColor: '#161224',
    borderWidth: 1,
    borderColor: '#26203D',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 120,
  },
  placeholderImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#0F0B1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(11, 8, 19, 0.75)',
    borderRadius: 12,
    padding: 6,
  },
  cardContent: {
    padding: 12,
  },
  recipeName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  recipeCategory: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  recipeInfo: {
    flexDirection: 'row',
    marginTop: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  infoText: {
    color: '#9E97B2',
    fontSize: 11,
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    width: '100%',
  },
  emptyText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubText: {
    color: '#9E97B2',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  createBtn: {
    backgroundColor: '#FF007F',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 20,
  },
  createBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 56,
    height: 56,
    backgroundColor: '#FF007F',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF007F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 5,
  },
});
