import { 
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  getDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from './firebase';
import { WeeklyPlan, Recipe, ShoppingItem, RecipeIngredient } from '../models/types';
import { scaleRecipe } from '../utils/recipeScaler';
import { aggregateIngredients, mergeIngredientsWithShoppingItems } from '../utils/ingredientAggregator';
import { addShoppingItem, updateShoppingItem } from './shoppingRepository';

/**
 * Generiert die Week-ID im Format "YYYY-WW" (z.B. "2026-35").
 */
export function getWeekId(date: Date = new Date()): string {
  const target = new Date(date.valueOf());
  const dayNumber = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNumber + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  const year = new Date(firstThursday).getFullYear();
  return `${year}-${weekNumber.toString().padStart(2, '0')}`;
}

/**
 * Lauscht in Echtzeit auf den Wochenplan eines bestimmten Haushalts und einer bestimmten Woche.
 */
export function subscribeToWeeklyPlan(
  householdId: string,
  weekId: string,
  onUpdate: (plan: WeeklyPlan | null) => void
) {
  const planRef = doc(db, 'households', householdId, 'weekly_plans', weekId);

  return onSnapshot(planRef, (docSnapshot) => {
    if (docSnapshot.exists()) {
      onUpdate({
        id: docSnapshot.id,
        ...docSnapshot.data()
      } as WeeklyPlan);
    } else {
      onUpdate(null);
    }
  }, (error) => {
    console.error("Fehler beim Abonnieren des Wochenplans:", error);
  });
}

/**
 * Initialisiert einen leeren Wochenplan für eine bestimmte Woche, falls dieser noch nicht existiert.
 */
export async function initializeWeeklyPlan(
  householdId: string,
  weekId: string,
  defaultServings: number = 2
): Promise<WeeklyPlan> {
  const planRef = doc(db, 'households', householdId, 'weekly_plans', weekId);
  const docSnapshot = await getDoc(planRef);

  if (docSnapshot.exists()) {
    return {
      id: docSnapshot.id,
      ...docSnapshot.data()
    } as WeeklyPlan;
  }

  const newPlan: WeeklyPlan = {
    id: weekId,
    householdId,
    defaultServings,
    days: {
      monday: { recipeId: null, recipeName: '', servings: defaultServings },
      tuesday: { recipeId: null, recipeName: '', servings: defaultServings },
      wednesday: { recipeId: null, recipeName: '', servings: defaultServings },
      thursday: { recipeId: null, recipeName: '', servings: defaultServings },
      friday: { recipeId: null, recipeName: '', servings: defaultServings },
      saturday: { recipeId: null, recipeName: '', servings: defaultServings },
      sunday: { recipeId: null, recipeName: '', servings: defaultServings },
    }
  };

  await setDoc(planRef, newPlan);
  return newPlan;
}

/**
 * Aktualisiert ein Gericht für einen bestimmten Wochentag.
 */
export async function updateWeeklyPlanDay(
  householdId: string,
  weekId: string,
  day: keyof WeeklyPlan['days'],
  recipeId: string | null,
  recipeName: string,
  servings: number
): Promise<void> {
  const planRef = doc(db, 'households', householdId, 'weekly_plans', weekId);
  
  const updateKey = `days.${day}`;
  await updateDoc(planRef, {
    [updateKey]: {
      recipeId,
      recipeName,
      servings
    }
  });
}

/**
 * Kopiert alle Zutaten aller Rezepte des Wochenplans in die Einkaufsliste.
 * Dabei werden die Portionen der einzelnen Tage berücksichtigt und die Mengen summiert.
 */
export async function addWeeklyPlanToShoppingList(
  householdId: string,
  weekId: string,
  userId: string
): Promise<void> {
  const listId = `list_${householdId}`;
  
  // 1. Wochenplan abrufen
  const planRef = doc(db, 'households', householdId, 'weekly_plans', weekId);
  const planSnapshot = await getDoc(planRef);
  if (!planSnapshot.exists()) throw new Error('Wochenplan existiert nicht');
  
  const plan = planSnapshot.data() as WeeklyPlan;
  const days = plan.days;
  
  const allScaledIngredients: RecipeIngredient[] = [];

  // 2. Für jeden Wochentag mit geplantem Rezept die Zutaten laden und skalieren
  for (const dayKey of Object.keys(days) as Array<keyof typeof days>) {
    const dayPlan = days[dayKey];
    if (dayPlan.recipeId) {
      // Rezept-Dokument abrufen
      const recipeRef = doc(db, 'households', householdId, 'recipes', dayPlan.recipeId);
      const recipeSnapshot = await getDoc(recipeRef);
      
      if (recipeSnapshot.exists()) {
        const recipe = recipeSnapshot.data() as Recipe;
        // Auf die für diesen Tag eingestellten Portionen skalieren
        const scaledRecipe = scaleRecipe(recipe, dayPlan.servings);
        allScaledIngredients.push(...scaledRecipe.ingredients);
      }
    }
  }

  if (allScaledIngredients.length === 0) return; // Nichts zu tun

  // 3. Alle skalierten Zutaten des Wochenplans untereinander aggregieren (Mehl + Mehl = 800g)
  const consolidatedIngredients = aggregateIngredients(allScaledIngredients);

  // 4. Aktuelle offene Einkaufslisten-Artikel abrufen
  const itemsRef = collection(db, 'shopping_lists', listId, 'items');
  const q = query(itemsRef, where('isBought', '==', false));
  const shoppingSnapshot = await getDocs(q);

  const existingItems: ShoppingItem[] = [];
  shoppingSnapshot.forEach((doc) => {
    existingItems.push({
      id: doc.id,
      ...doc.data()
    } as ShoppingItem);
  });

  // 5. Mit Einkaufsliste zusammenführen
  const { itemsToAdd, itemsToUpdate } = mergeIngredientsWithShoppingItems(
    consolidatedIngredients,
    existingItems,
    listId,
    userId
  );

  // 6. In Firestore speichern
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
      category: 'Sonstiges',
    }, userId);
  }
}
