import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  getDocs,
  where
} from 'firebase/firestore';
import { db } from './firebase';
import { FavoriteItem, ShoppingItem } from '../models/types';
import { addShoppingItem, updateShoppingItem } from './shoppingRepository';
import { mergeIngredientsWithShoppingItems } from '../utils/ingredientAggregator';

/**
 * Lauscht in Echtzeit auf die Einkaufs-Favoriten eines Haushalts.
 */
export function subscribeToFavorites(
  householdId: string,
  onUpdate: (items: FavoriteItem[]) => void
) {
  const favsRef = collection(db, 'households', householdId, 'favorite_items');
  
  return onSnapshot(favsRef, (snapshot) => {
    const items: FavoriteItem[] = [];
    snapshot.forEach((doc) => {
      items.push({
        id: doc.id,
        ...doc.data()
      } as FavoriteItem);
    });
    onUpdate(items);
  }, (error) => {
    console.error("Fehler beim Abonnieren der Favoriten:", error);
  });
}

/**
 * Fügt einen neuen Favoriten hinzu.
 */
export async function addFavorite(
  householdId: string,
  item: Omit<FavoriteItem, 'id'>
): Promise<void> {
  const favsRef = collection(db, 'households', householdId, 'favorite_items');
  await addDoc(favsRef, item);
}

/**
 * Löscht einen Favoriten.
 */
export async function deleteFavorite(
  householdId: string,
  favId: string
): Promise<void> {
  const favRef = doc(db, 'households', householdId, 'favorite_items', favId);
  await deleteDoc(favRef);
}

/**
 * Aktualisiert einen Favoriten.
 */
export async function updateFavorite(
  householdId: string,
  favId: string,
  updates: Partial<FavoriteItem>
): Promise<void> {
  const favRef = doc(db, 'households', householdId, 'favorite_items', favId);
  await updateDoc(favRef, updates);
}

/**
 * Fügt einen Favoriten-Artikel mit einem Klick zur Einkaufsliste hinzu
 * und berücksichtigt dabei Duplikate durch Zusammenführen.
 */
export async function addFavoriteToShoppingList(
  householdId: string,
  favorite: FavoriteItem,
  userId: string
): Promise<void> {
  const listId = `list_${householdId}`;
  
  // 1. Alle aktuellen (nicht gekauften) Einkaufslisten-Artikel abrufen
  const itemsRef = collection(db, 'shopping_lists', listId, 'items');
  const q = query(itemsRef, where('isBought', '==', false));
  const snapshot = await getDocs(q);
  
  const existingItems: ShoppingItem[] = [];
  snapshot.forEach((doc) => {
    existingItems.push({
      id: doc.id,
      ...doc.data()
    } as ShoppingItem);
  });

  // 2. Zutaten-Aggregator nutzen
  const ingredientToMerge = [{
    name: favorite.name,
    quantity: favorite.defaultQuantity,
    unit: favorite.defaultUnit,
  }];

  const { itemsToAdd, itemsToUpdate } = mergeIngredientsWithShoppingItems(
    ingredientToMerge,
    existingItems,
    listId,
    userId
  );

  // 3. Änderungen in Firestore speichern
  if (itemsToUpdate.length > 0) {
    const match = itemsToUpdate[0];
    await updateShoppingItem(householdId, match.id, {
      quantity: match.quantity,
      unit: match.unit,
    });
  } else if (itemsToAdd.length > 0) {
    const newItem = itemsToAdd[0];
    await addShoppingItem(householdId, {
      name: newItem.name,
      quantity: newItem.quantity,
      unit: newItem.unit,
      category: favorite.category || 'Sonstiges',
    }, userId);
  }
}
