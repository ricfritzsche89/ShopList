import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  writeBatch,
  getDocs,
  where
} from 'firebase/firestore';
import { db } from './firebase';
import { ShoppingItem } from '../models/types';

const getListId = (householdId: string) => `list_${householdId}`;

/**
 * Lauscht in Echtzeit auf die Einkaufslisten-Artikel eines Haushalts.
 */
export function subscribeToShoppingItems(
  householdId: string,
  onUpdate: (items: ShoppingItem[]) => void,
  onError?: (error: Error) => void
) {
  const listId = getListId(householdId);
  const itemsRef = collection(db, 'shopping_lists', listId, 'items');
  const q = query(itemsRef, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const items: ShoppingItem[] = [];
    snapshot.forEach((doc) => {
      items.push({
        id: doc.id,
        listId,
        ...doc.data()
      } as ShoppingItem);
    });
    onUpdate(items);
  }, (error) => {
    console.error("Fehler beim Abonnieren der Einkaufsliste:", error);
    if (onError) onError(error);
  });
}

/**
 * Fügt einen neuen Artikel zur Einkaufsliste hinzu.
 */
export async function addShoppingItem(
  householdId: string,
  item: { name: string; quantity: number | null; unit: string | null; category: string },
  userId: string
): Promise<void> {
  const listId = getListId(householdId);
  const itemsRef = collection(db, 'shopping_lists', listId, 'items');
  
  const newItem = {
    ...item,
    isBought: false,
    boughtAt: null,
    boughtBy: null,
    addedBy: userId,
    createdAt: new Date().toISOString(),
  };

  await addDoc(itemsRef, newItem);
}

/**
 * Aktualisiert ein bestehendes Element in der Einkaufsliste.
 */
export async function updateShoppingItem(
  householdId: string,
  itemId: string,
  updates: Partial<ShoppingItem>
): Promise<void> {
  const listId = getListId(householdId);
  const itemRef = doc(db, 'shopping_lists', listId, 'items', itemId);
  await updateDoc(itemRef, updates);
}

/**
 * Löscht einen Artikel aus der Einkaufsliste.
 */
export async function deleteShoppingItem(
  householdId: string,
  itemId: string
): Promise<void> {
  const listId = getListId(householdId);
  const itemRef = doc(db, 'shopping_lists', listId, 'items', itemId);
  await deleteDoc(itemRef);
}

/**
 * Markiert ein Element als gekauft oder nicht gekauft.
 */
export async function toggleBoughtStatus(
  householdId: string,
  itemId: string,
  currentStatus: boolean,
  userId: string,
  userName: string | null
): Promise<void> {
  const updates: Partial<ShoppingItem> = {
    isBought: !currentStatus,
    boughtAt: !currentStatus ? new Date().toISOString() : null,
    boughtBy: !currentStatus ? userName : null,
  };

  await updateShoppingItem(householdId, itemId, updates);
}

/**
 * Löscht alle als gekauft markierten Artikel.
 */
export async function clearBoughtItems(householdId: string): Promise<void> {
  const listId = getListId(householdId);
  const itemsRef = collection(db, 'shopping_lists', listId, 'items');
  
  // Alle gekauften Artikel abrufen
  const q = query(itemsRef, where('isBought', '==', true));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return;

  const batch = writeBatch(db);
  snapshot.forEach((docSnapshot) => {
    batch.delete(docSnapshot.ref);
  });

  await batch.commit();
}

/**
 * Fügt mehrere Zutaten/Artikel auf einmal der Einkaufsliste hinzu und aggregiert Duplikate.
 */
export async function addMultipleShoppingItems(
  householdId: string,
  newItems: Omit<ShoppingItem, 'id' | 'listId' | 'createdAt'>[],
  userId: string
): Promise<void> {
  const listId = getListId(householdId);
  const itemsRef = collection(db, 'shopping_lists', listId, 'items');
  
  const batch = writeBatch(db);
  
  newItems.forEach((item) => {
    const docRef = doc(itemsRef);
    batch.set(docRef, {
      ...item,
      createdAt: new Date().toISOString()
    });
  });

  await batch.commit();
}
