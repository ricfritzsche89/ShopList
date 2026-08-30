import { aggregateIngredients, mergeIngredientsWithShoppingItems } from '../utils/ingredientAggregator';
import { RecipeIngredient, ShoppingItem } from '../models/types';

describe('ingredientAggregator', () => {
  describe('aggregateIngredients', () => {
    test('sollte gleiche Zutaten mit identischen Einheiten addieren', () => {
      const ingredients: RecipeIngredient[] = [
        { name: 'Mehl', quantity: 500, unit: 'g' },
        { name: 'Mehl', quantity: 300, unit: 'g' },
      ];
      const result = aggregateIngredients(ingredients);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ name: 'Mehl', quantity: 800, unit: 'g' });
    });

    test('sollte kompatible Einheiten umrechnen und addieren (g und kg)', () => {
      const ingredients: RecipeIngredient[] = [
        { name: 'Mehl', quantity: 500, unit: 'g' },
        { name: 'Mehl', quantity: 1.2, unit: 'kg' },
      ];
      const result = aggregateIngredients(ingredients);
      expect(result).toHaveLength(1);
      // 500g + 1200g = 1700g = 1.7kg
      expect(result[0]).toEqual({ name: 'Mehl', quantity: 1.7, unit: 'kg' });
    });

    test('sollte kompatible Einheiten umrechnen und addieren (ml und l)', () => {
      const ingredients: RecipeIngredient[] = [
        { name: 'Milch', quantity: 500, unit: 'ml' },
        { name: 'Milch', quantity: 0.5, unit: 'l' },
      ];
      const result = aggregateIngredients(ingredients);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ name: 'Milch', quantity: 1, unit: 'l' });
    });

    test('sollte inkompatible Einheiten getrennt lassen', () => {
      const ingredients: RecipeIngredient[] = [
        { name: 'Tomaten', quantity: 1, unit: 'Dose' },
        { name: 'Tomaten', quantity: 3, unit: 'Stück' },
      ];
      const result = aggregateIngredients(ingredients);
      expect(result).toHaveLength(2);
      expect(result).toContainEqual({ name: 'Tomaten', quantity: 1, unit: 'dose' });
      expect(result).toContainEqual({ name: 'Tomaten', quantity: 3, unit: 'stück' });
    });

    test('sollte Zutatennamen case-insensitive zusammenführen', () => {
      const ingredients: RecipeIngredient[] = [
        { name: 'Milch', quantity: 1, unit: 'l' },
        { name: 'milch', quantity: 1, unit: 'l' },
      ];
      const result = aggregateIngredients(ingredients);
      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBe(2);
    });
  });

  describe('mergeIngredientsWithShoppingItems', () => {
    test('sollte zu bestehendem Artikel addieren, wenn kompatibel', () => {
      const existing: ShoppingItem[] = [
        {
          id: 'item1',
          listId: 'list1',
          name: 'Milch',
          quantity: 1,
          unit: 'l',
          category: 'Kühlregal',
          isBought: false,
          boughtAt: null,
          boughtBy: null,
          addedBy: 'user1',
          createdAt: '',
        },
      ];
      const newIng: RecipeIngredient[] = [{ name: 'Milch', quantity: 500, unit: 'ml' }];
      
      const { itemsToAdd, itemsToUpdate } = mergeIngredientsWithShoppingItems(newIng, existing, 'list1', 'user1');
      
      expect(itemsToAdd).toHaveLength(0);
      expect(itemsToUpdate).toHaveLength(1);
      expect(itemsToUpdate[0].quantity).toBe(1.5);
      expect(itemsToUpdate[0].unit).toBe('l');
    });

    test('sollte neuen Artikel anlegen, wenn Zutat noch nicht auf der Liste steht', () => {
      const existing: ShoppingItem[] = [];
      const newIng: RecipeIngredient[] = [{ name: 'Butter', quantity: 250, unit: 'g' }];
      
      const { itemsToAdd, itemsToUpdate } = mergeIngredientsWithShoppingItems(newIng, existing, 'list1', 'user1');
      
      expect(itemsToUpdate).toHaveLength(0);
      expect(itemsToAdd).toHaveLength(1);
      expect(itemsToAdd[0].name).toBe('Butter');
      expect(itemsToAdd[0].quantity).toBe(250);
      expect(itemsToAdd[0].unit).toBe('g');
    });
  });
});
