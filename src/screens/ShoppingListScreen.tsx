import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import {
  subscribeToShoppingItems,
  addShoppingItem,
  toggleBoughtStatus,
  deleteShoppingItem,
  clearBoughtItems,
} from '../services/shoppingRepository';
import { subscribeToFavorites, addFavoriteToShoppingList, addFavorite } from '../services/favoriteRepository';
import { ShoppingItem, FavoriteItem } from '../models/types';
import { formatQuantity } from '../utils/unitConverter';
import { Ionicons } from '@expo/vector-icons';

export default function ShoppingListScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Formular-Zustände für schnelles Hinzufügen
  const [inputValue, setInputValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Sonstiges');

  const categories = ['Obst & Gemüse', 'Kühlregal', 'Fleisch', 'Getränke', 'Sonstiges'];

  useEffect(() => {
    if (!user?.householdId) return;

    setLoading(true);
    // 1. Abonniere Einkaufsliste
    const unsubscribeShopping = subscribeToShoppingItems(user.householdId, (shoppingItems) => {
      setItems(shoppingItems);
      setLoading(false);
    });

    // 2. Abonniere Favoriten
    const unsubscribeFavorites = subscribeToFavorites(user.householdId, (favs) => {
      setFavorites(favs);
    });

    return () => {
      unsubscribeShopping();
      unsubscribeFavorites();
    };
  }, [user?.householdId]);

  // Funktion zum Parsen der Schnelleingabe (z.B. "2 l Milch" oder "500 g Hackfleisch" oder "Brot")
  const parseInput = (text: string): { quantity: number | null; unit: string | null; name: string } => {
    const trimmed = text.trim();
    // Regex sucht nach: [Zahl] [Optionale Einheit] [Name]
    // Unterstützt Dezimalzahlen mit Komma oder Punkt
    const regex = /^(\d+([.,]\d+)?)\s*(g|kg|ml|l|liter|stück|stk|tl|el|prise|packung|dose|flasche|becher|pkg)?\s+(.+)$/i;
    const match = trimmed.match(regex);

    if (match) {
      const qtyStr = match[1].replace(',', '.');
      const quantity = parseFloat(qtyStr);
      const unit = match[3] ? match[3].toLowerCase() : null;
      const name = match[4].trim();
      return { quantity, unit, name };
    }

    return { quantity: null, unit: null, name: trimmed };
  };

  const handleAddItem = async () => {
    if (!inputValue.trim() || !user?.householdId || !user?.id) return;

    const { quantity, unit, name } = parseInput(inputValue);

    try {
      await addShoppingItem(user.householdId, {
        name,
        quantity,
        unit,
        category: selectedCategory,
      }, user.id);

      setInputValue('');
    } catch (e) {
      console.error(e);
      Alert.alert('Fehler', 'Artikel konnte nicht hinzugefügt werden.');
    }
  };

  const handleToggleBought = async (item: ShoppingItem) => {
    if (!user?.householdId || !user?.id) return;
    try {
      await toggleBoughtStatus(user.householdId, item.id, item.isBought, user.id, user.displayName);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!user?.householdId) return;
    try {
      await deleteShoppingItem(user.householdId, itemId);
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearBought = async () => {
    if (!user?.householdId) return;
    Alert.alert(
      'Gekaufte Artikel löschen?',
      'Möchtest du wirklich alle als gekauft markierten Artikel unwiderruflich von der Liste löschen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Löschen', style: 'destructive', onPress: async () => {
            try {
              if (user?.householdId) {
                await clearBoughtItems(user.householdId);
              }
            } catch (e) {
              console.error(e);
            }
          }
        }
      ]
    );
  };

  const handleAddToFavorites = async (item: ShoppingItem) => {
    if (!user?.householdId) return;
    try {
      // Prüfen, ob der Favorit schon existiert
      const exists = favorites.some(fav => fav.name.toLowerCase() === item.name.toLowerCase());
      if (exists) {
        Alert.alert('Info', 'Dieser Artikel ist bereits in deinen Favoriten.');
        return;
      }

      await addFavorite(user.householdId, {
        name: item.name,
        defaultQuantity: item.quantity,
        defaultUnit: item.unit,
        category: item.category
      });
      Alert.alert('Erfolg', `"${item.name}" wurde zu den Favoriten hinzugefügt.`);
    } catch (e) {
      console.error(e);
      Alert.alert('Fehler', 'Favorit konnte nicht gespeichert werden.');
    }
  };

  const handleQuickAddFav = async (fav: FavoriteItem) => {
    if (!user?.householdId || !user?.id) return;
    try {
      await addFavoriteToShoppingList(user.householdId, fav, user.id);
    } catch (e) {
      console.error(e);
    }
  };

  // Gruppieren der Elemente nach Kategorien und Sortierung (Gekaufte nach unten)
  const renderItem = ({ item }: { item: ShoppingItem }) => (
    <View style={[styles.itemRow, item.isBought && styles.itemRowBought]}>
      <TouchableOpacity 
        style={styles.checkboxContainer}
        onPress={() => handleToggleBought(item)}
      >
        <Ionicons 
          name={item.isBought ? 'checkbox' : 'square-outline'} 
          size={24} 
          color={item.isBought ? '#4E4960' : '#00F0FF'} 
        />
      </TouchableOpacity>

      <View style={styles.itemContent}>
        <Text style={[styles.itemName, item.isBought && styles.itemNameBought]}>
          {item.name}
        </Text>
        {(item.quantity || item.unit) && (
          <Text style={[styles.itemQuantity, item.isBought && styles.itemQuantityBought]}>
            {formatQuantity(item.quantity)} {item.unit}
          </Text>
        )}
      </View>

      <View style={styles.itemActions}>
        {!item.isBought && (
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => handleAddToFavorites(item)}
          >
            <Ionicons name="star-outline" size={18} color="#9E97B2" />
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => handleDelete(item.id)}
        >
          <Ionicons name="trash-outline" size={18} color="#FF007F" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Gruppieren der Elemente
  const openItems = items.filter(i => !i.isBought);
  const boughtItems = items.filter(i => i.isBought);

  // Nach Kategorien gruppieren für offene Artikel
  const groupedOpenItems: { [category: string]: ShoppingItem[] } = {};
  openItems.forEach(item => {
    const cat = item.category || 'Sonstiges';
    if (!groupedOpenItems[cat]) groupedOpenItems[cat] = [];
    groupedOpenItems[cat].push(item);
  });

  // FlatList Datenstruktur bauen
  const flatListData: any[] = [];
  
  // 1. Offene Artikel gruppiert nach Kategorie
  Object.keys(groupedOpenItems).sort().forEach(cat => {
    flatListData.push({ type: 'header', title: cat });
    groupedOpenItems[cat].forEach(item => {
      flatListData.push({ type: 'item', data: item });
    });
  });

  // 2. Gekaufte Artikel
  if (boughtItems.length > 0) {
    flatListData.push({ type: 'header', title: 'Bereits gekauft' });
    boughtItems.forEach(item => {
      flatListData.push({ type: 'item', data: item });
    });
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF007F" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {/* Favoriten Schnellleiste */}
      {favorites.length > 0 && (
        <View style={styles.favoritesBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {favorites.map((fav) => (
              <TouchableOpacity 
                key={fav.id} 
                style={styles.favoriteBadge}
                onPress={() => handleQuickAddFav(fav)}
              >
                <Text style={styles.favoriteBadgeText}>+ {fav.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Liste */}
      <FlatList
        data={flatListData}
        keyExtractor={(item, index) => item.type + (item.data?.id || item.title) + index}
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>{item.title}</Text>
              </View>
            );
          }
          return renderItem({ item: item.data });
        }}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color="#4E4960" />
            <Text style={styles.emptyText}>Deine Einkaufsliste ist leer.</Text>
            <Text style={styles.emptySubText}>Gib oben z.B. "2 l Milch" ein, um zu starten.</Text>
          </View>
        }
      />

      {/* Eingabebereich unten */}
      <View style={styles.inputArea}>
        <View style={styles.categorySelector}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryTab,
                selectedCategory === cat && styles.categoryTabSelected
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[
                styles.categoryTabText,
                selectedCategory === cat && styles.categoryTabTextSelected
              ]}>
                {cat.split(' ')[0]} {/* Zeige nur erstes Wort */}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="z.B. 2 l Milch oder Äpfel"
            placeholderTextColor="#635B7A"
            value={inputValue}
            onChangeText={setInputValue}
            onSubmitEditing={handleAddItem}
            returnKeyType="done"
          />
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddItem}
          >
            <Ionicons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Floating Action Button für Destruktive Aktionen (Gekaufte löschen) */}
      {boughtItems.length > 0 && (
        <TouchableOpacity 
          style={styles.clearBtn}
          onPress={handleClearBought}
        >
          <Ionicons name="trash-bin-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
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
  favoritesBar: {
    backgroundColor: '#161224',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: '#26203D',
  },
  favoriteBadge: {
    backgroundColor: '#0F0B1E',
    borderWidth: 1,
    borderColor: '#2D254B',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  favoriteBadgeText: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
    paddingBottom: 120, // Ausreichend Platz für Tastatur-Input unten
  },
  sectionHeader: {
    marginTop: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#26203D',
    paddingBottom: 4,
  },
  sectionHeaderText: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161224',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#26203D',
  },
  itemRowBought: {
    backgroundColor: '#0F0B1E',
    borderColor: '#1D192C',
  },
  checkboxContainer: {
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  itemNameBought: {
    color: '#4E4960',
    textDecorationLine: 'line-through',
  },
  itemQuantity: {
    color: '#9E97B2',
    fontSize: 12,
    marginTop: 2,
  },
  itemQuantityBought: {
    color: '#4E4960',
  },
  itemActions: {
    flexDirection: 'row',
  },
  actionBtn: {
    padding: 8,
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
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
  },
  inputArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#161224',
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#26203D',
  },
  categorySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryTab: {
    backgroundColor: '#0F0B1E',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2D254B',
  },
  categoryTabSelected: {
    borderColor: '#FF007F',
    backgroundColor: 'rgba(255, 0, 127, 0.1)',
  },
  categoryTabText: {
    color: '#9E97B2',
    fontSize: 11,
  },
  categoryTabTextSelected: {
    color: '#FF007F',
    fontWeight: 'bold',
  },
  inputRow: {
    flexDirection: 'row',
  },
  input: {
    flex: 1,
    backgroundColor: '#0F0B1E',
    borderWidth: 1,
    borderColor: '#2D254B',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFF',
    fontSize: 16,
    marginRight: 8,
  },
  addButton: {
    width: 48,
    height: 48,
    backgroundColor: '#FF007F',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF007F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  clearBtn: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    width: 52,
    height: 52,
    backgroundColor: '#FF007F',
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});
