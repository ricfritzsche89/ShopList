import { RecipeIngredient, ShoppingItem } from '../models/types';
import { normalizeAmount, denormalizeAmount, areUnitsCompatible } from './unitConverter';

export interface AggregatedIngredient {
  name: string;
  quantity: number | null;
  unit: string | null;
  originalNames: string[]; // Um die ursprüngliche Schreibweise zu behalten
}

/**
 * Normalisiert einen Zutatennamen, um Duplikate besser zu erkennen.
 * Entfernt führende/nachfolgende Leerzeichen und wandelt in Kleinbuchstaben um.
 */
export function normalizeIngredientName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Aggregiert ein Array von Zutaten. Gleiche Zutaten mit kompatiblen Einheiten
 * werden zusammengeführt und addiert.
 */
export function aggregateIngredients(ingredients: RecipeIngredient[]): RecipeIngredient[] {
  const map = new Map<string, RecipeIngredient[]>();

  // 1. Gruppieren nach normalisiertem Namen
  ingredients.forEach((ing) => {
    const normName = normalizeIngredientName(ing.name);
    if (!map.has(normName)) {
      map.set(normName, []);
    }
    map.get(normName)!.push(ing);
  });

  const result: RecipeIngredient[] = [];

  // 2. Innerhalb jeder Namensgruppe nach kompatiblen Einheiten aggregieren
  map.forEach((items, normName) => {
    const unmergedItems = [...items];

    while (unmergedItems.length > 0) {
      const current = unmergedItems.shift()!;
      let mergedQuantity = current.quantity;
      let mergedUnit = current.unit || '';
      
      // Nutze die am häufigsten/besten lesbare Schreibweise des Namens (z.B. mit Großbuchstaben)
      const displayName = current.name;

      // Finde alle verbleibenden Elemente in der Gruppe mit kompatibler Einheit
      let i = 0;
      while (i < unmergedItems.length) {
        const candidate = unmergedItems[i];

        if (areUnitsCompatible(mergedUnit, candidate.unit)) {
          // Beide haben eine Menge -> wir können sie addieren
          if (mergedQuantity !== null && candidate.quantity !== null) {
            // Normalisiere beide
            const norm1 = normalizeAmount(mergedQuantity, mergedUnit);
            const norm2 = normalizeAmount(candidate.quantity, candidate.unit);

            if (norm1 && norm2) {
              const sum = norm1.quantity + norm2.quantity;
              const unit = norm1.unit; // normalisierte Einheit (z.B. g oder ml)

              // Denormalisiere für bessere Lesbarkeit (z.B. g -> kg, falls >= 1000)
              const denorm = denormalizeAmount(sum, unit);
              mergedQuantity = denorm.quantity;
              mergedUnit = denorm.unit;
            }
          } else if (mergedQuantity === null) {
            // Wenn eines keine Menge hat, übernimmt es die Menge des anderen (oder bleibt null)
            mergedQuantity = candidate.quantity;
            mergedUnit = candidate.unit || '';
          }
          
          // Aus der Liste entfernen, da erfolgreich gemergt
          unmergedItems.splice(i, 1);
        } else {
          // Einheit inkompatibel -> nicht mergen, weitergehen
          i++;
        }
      }

      const finalUnit = mergedUnit ? mergedUnit.trim().toLowerCase() : null;
      result.push({
        name: displayName,
        quantity: mergedQuantity,
        unit: finalUnit,
      });
    }
  });

  return result;
}

/**
 * Führt neue Zutaten mit einer bereits bestehenden Einkaufsliste zusammen.
 * Gibt ein Array von geänderten oder neuen ShoppingItems zurück.
 */
export function mergeIngredientsWithShoppingItems(
  newIngredients: RecipeIngredient[],
  existingItems: ShoppingItem[],
  listId: string,
  addedByUserId: string
): { itemsToAdd: Omit<ShoppingItem, 'id'>[]; itemsToUpdate: ShoppingItem[] } {
  
  const itemsToAdd: Omit<ShoppingItem, 'id'>[] = [];
  const itemsToUpdate: ShoppingItem[] = [];

  newIngredients.forEach((newIng) => {
    const normNewName = normalizeIngredientName(newIng.name);
    
    // Finde ein passendes Element in der bestehenden Einkaufsliste (nicht gekauft)
    const match = existingItems.find(
      (item) => !item.isBought && normalizeIngredientName(item.name) === normNewName && areUnitsCompatible(item.unit, newIng.unit)
    );

    if (match) {
      // Zusammenführen
      if (match.quantity !== null && newIng.quantity !== null) {
        const norm1 = normalizeAmount(match.quantity, match.unit);
        const norm2 = normalizeAmount(newIng.quantity, newIng.unit);

        if (norm1 && norm2) {
          const sum = norm1.quantity + norm2.quantity;
          const denorm = denormalizeAmount(sum, norm1.unit);
          
          itemsToUpdate.push({
            ...match,
            quantity: denorm.quantity,
            unit: denorm.unit || null,
          });
        }
      } else if (match.quantity === null) {
        itemsToUpdate.push({
          ...match,
          quantity: newIng.quantity,
          unit: newIng.unit,
        });
      }
    } else {
      // Neu hinzufügen
      itemsToAdd.push({
        listId,
        name: newIng.name,
        quantity: newIng.quantity,
        unit: newIng.unit,
        category: 'Sonstiges', // Standardkategorie, kann später sortiert werden
        isBought: false,
        boughtAt: null,
        boughtBy: null,
        addedBy: addedByUserId,
        createdAt: new Date().toISOString(),
      });
    }
  });

  return { itemsToAdd, itemsToUpdate };
}
