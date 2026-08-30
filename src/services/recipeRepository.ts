import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  getDocs,
  where
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import { Recipe, ShoppingItem } from '../models/types';
import { scaleRecipe } from '../utils/recipeScaler';
import { mergeIngredientsWithShoppingItems } from '../utils/ingredientAggregator';
import { addShoppingItem, updateShoppingItem } from './shoppingRepository';

/**
 * Lauscht in Echtzeit auf alle Rezepte des Haushalts.
 */
export function subscribeToRecipes(
  householdId: string,
  onUpdate: (recipes: Recipe[]) => void
) {
  const recipesRef = collection(db, 'households', householdId, 'recipes');
  const q = query(recipesRef, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const recipes: Recipe[] = [];
    snapshot.forEach((doc) => {
      recipes.push({
        id: doc.id,
        ...doc.data()
      } as Recipe);
    });
    onUpdate(recipes);
  }, (error) => {
    console.error("Fehler beim Abonnieren der Rezepte:", error);
  });
}

/**
 * Fügt ein neues Rezept hinzu.
 */
export async function addRecipe(
  householdId: string,
  recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const recipesRef = collection(db, 'households', householdId, 'recipes');
  
  const now = new Date().toISOString();
  const newRecipe = {
    ...recipe,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(recipesRef, newRecipe);
  return docRef.id;
}

/**
 * Aktualisiert ein bestehendes Rezept.
 */
export async function updateRecipe(
  householdId: string,
  recipeId: string,
  updates: Partial<Recipe>
): Promise<void> {
  const recipeRef = doc(db, 'households', householdId, 'recipes', recipeId);
  const updatedData = {
    ...updates,
    updatedAt: new Date().toISOString()
  };
  await updateDoc(recipeRef, updatedData);
}

/**
 * Löscht ein Rezept.
 */
export async function deleteRecipe(
  householdId: string,
  recipeId: string,
  imageUrl: string | null
): Promise<void> {
  const recipeRef = doc(db, 'households', householdId, 'recipes', recipeId);
  await deleteDoc(recipeRef);
}

/**
 * Gibt den übergebenen Base64-String als "Upload"-Ergebnis zurück (kein externer Storage nötig).
 */
export async function uploadRecipeImage(
  householdId: string,
  base64DataUri: string
): Promise<string> {
  return base64DataUri;
}

/**
 * Fügt alle Zutaten eines Rezepts, skaliert auf die Ziel-Personenanzahl,
 * der aktuellen Einkaufsliste hinzu (und führt sie mit Duplikaten zusammen).
 */
export async function addRecipeToShoppingList(
  householdId: string,
  recipe: Recipe,
  targetServings: number,
  userId: string
): Promise<void> {
  const listId = `list_${householdId}`;

  // 1. Rezept skalieren
  const scaledRecipe = scaleRecipe(recipe, targetServings);
  
  // 2. Aktuelle, offene Einkaufslisten-Artikel abrufen
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

  // 3. Mergen
  const { itemsToAdd, itemsToUpdate } = mergeIngredientsWithShoppingItems(
    scaledRecipe.ingredients,
    existingItems,
    listId,
    userId
  );

  // 4. In Firestore aktualisieren
  for (const item of itemsToUpdate) {
    await updateShoppingItem(householdId, item.id, {
      quantity: item.quantity,
      unit: item.unit
    });
  }

  for (const item of itemsToAdd) {
    await addShoppingItem(householdId, {
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: 'Sonstiges', // Kann später kategorisiert werden
    }, userId);
  }
}
