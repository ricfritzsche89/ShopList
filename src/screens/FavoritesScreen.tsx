import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { 
  subscribeToFavorites, 
  addFavorite, 
  deleteFavorite, 
  updateFavorite 
} from '../services/favoriteRepository';
import { FavoriteItem } from '../models/types';
import { Ionicons } from '@expo/vector-icons';

export default function FavoritesScreen() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Formular-Zustände (Erstellen & Bearbeiten)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('');
  const [category, setCategory] = useState('Sonstiges');

  const categories = ['Obst & Gemüse', 'Kühlregal', 'Fleisch', 'Getränke', 'Sonstiges'];

  useEffect(() => {
    if (!user?.householdId) return;

    const unsubscribe = subscribeToFavorites(user.householdId, (items) => {
      setFavorites(items);
    });

    return () => unsubscribe();
  }, [user?.householdId]);

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setQty('');
    setUnit('');
    setCategory('Sonstiges');
    setModalVisible(true);
  };

  const openEditModal = (item: FavoriteItem) => {
    setEditingId(item.id);
    setName(item.name);
    setQty(item.defaultQuantity ? item.defaultQuantity.toString() : '');
    setUnit(item.defaultUnit || '');
    setCategory(item.category || 'Sonstiges');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !user?.householdId) {
      Alert.alert('Fehler', 'Bitte gib einen Namen für den Favoriten an.');
      return;
    }

    const parsedQty = qty.trim() ? parseFloat(qty.replace(',', '.')) : null;

    try {
      const data = {
        name: name.trim(),
        defaultQuantity: parsedQty,
        defaultUnit: unit.trim() || null,
        category: category
      };

      if (editingId) {
        await updateFavorite(user.householdId, editingId, data);
      } else {
        await addFavorite(user.householdId, data);
      }

      setModalVisible(false);
    } catch (e) {
      console.error(e);
      Alert.alert('Fehler', 'Favorit konnte nicht gespeichert werden.');
    }
  };

  const handleDelete = (id: string, itemName: string) => {
    if (!user?.householdId) return;
    Alert.alert(
      'Favorit löschen?',
      `Möchtest du "${itemName}" wirklich aus den Favoriten löschen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Löschen', style: 'destructive', onPress: async () => {
            try {
              await deleteFavorite(user.householdId!, id);
            } catch (e) {
              console.error(e);
            }
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meine Favoriten ⭐</Text>
        <TouchableOpacity 
          style={styles.addBtn}
          onPress={openAddModal}
        >
          <Ionicons name="add" size={20} color="#FFF" />
          <Text style={styles.addBtnText}>Neu</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.favRow}>
            <View style={styles.favInfo}>
              <Text style={styles.favName}>{item.name}</Text>
              {(item.defaultQuantity || item.defaultUnit) && (
                <Text style={styles.favQty}>
                  Standard: {item.defaultQuantity} {item.defaultUnit}
                </Text>
              )}
              <Text style={styles.favCategory}>{item.category}</Text>
            </View>
            
            <View style={styles.favActions}>
              <TouchableOpacity 
                style={styles.actionBtn}
                onPress={() => openEditModal(item)}
              >
                <Ionicons name="create-outline" size={20} color="#00F0FF" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionBtn}
                onPress={() => handleDelete(item.id, item.name)}
              >
                <Ionicons name="trash-outline" size={20} color="#FF007F" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="star-outline" size={48} color="#4E4960" />
            <Text style={styles.emptyText}>Noch keine Favoriten gespeichert.</Text>
            <Text style={styles.emptySubText}>
              Füge Favoriten direkt aus der Einkaufsliste hinzu oder erstelle sie hier oben.
            </Text>
          </View>
        }
      />

      {/* Modal für Hinzufügen / Editieren */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingId ? 'Favorit bearbeiten' : 'Neuer Favorit'}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name des Artikels *</Text>
              <TextInput
                style={styles.input}
                placeholder="z.B. Milch"
                placeholderTextColor="#635B7A"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Standardmenge</Text>
                <TextInput
                  style={styles.input}
                  placeholder="z.B. 2"
                  placeholderTextColor="#635B7A"
                  keyboardType="numeric"
                  value={qty}
                  onChangeText={setQty}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Einheit</Text>
                <TextInput
                  style={styles.input}
                  placeholder="z.B. Liter"
                  placeholderTextColor="#635B7A"
                  value={unit}
                  onChangeText={setUnit}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Kategorie</Text>
              <View style={styles.categorySelector}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryTab,
                      category === cat && styles.categoryTabSelected
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[
                      styles.categoryTabText,
                      category === cat && styles.categoryTabTextSelected
                    ]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={handleSave}
              >
                <Text style={styles.saveBtnText}>Speichern</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0813',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#26203D',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF007F',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#FF007F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  listContent: {
    padding: 16,
  },
  favRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#161224',
    borderWidth: 1,
    borderColor: '#26203D',
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
  },
  favInfo: {
    flex: 1,
  },
  favName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  favQty: {
    color: '#9E97B2',
    fontSize: 12,
    marginTop: 4,
  },
  favCategory: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginTop: 6,
  },
  favActions: {
    flexDirection: 'row',
  },
  actionBtn: {
    padding: 8,
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubText: {
    color: '#9E97B2',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 8, 19, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#161224',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#26203D',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    color: '#9E97B2',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
    textTransform: 'uppercase',
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
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  categoryTab: {
    backgroundColor: '#0F0B1E',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2D254B',
    marginRight: 8,
    marginBottom: 8,
  },
  categoryTabSelected: {
    borderColor: '#FF007F',
    backgroundColor: 'rgba(255, 0, 127, 0.1)',
  },
  categoryTabText: {
    color: '#9E97B2',
    fontSize: 12,
  },
  categoryTabTextSelected: {
    color: '#FF007F',
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#0F0B1E',
    borderWidth: 1,
    borderColor: '#2D254B',
    marginRight: 8,
  },
  cancelBtnText: {
    color: '#9E97B2',
    fontSize: 16,
  },
  saveBtn: {
    backgroundColor: '#FF007F',
    marginLeft: 8,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
