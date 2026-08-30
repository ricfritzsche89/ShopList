import { scaleRecipe } from '../utils/recipeScaler';
import { Recipe } from '../models/types';

describe('recipeScaler', () => {
  const mockRecipe: Recipe = {
    id: '1',
    name: 'Test Rezept',
    description: 'Test',
    imageUrl: null,
    servings: 4,
    prepTime: 20,
    category: 'Test',
    ingredients: [
      { name: 'Mehl', quantity: 500, unit: 'g' },
      { name: 'Milch', quantity: 1, unit: 'l' },
      { name: 'Salz', quantity: null, unit: 'Prise' },
    ],
    steps: [],
    notes: '',
    isFavorite: false,
    createdAt: '',
    updatedAt: '',
  };

  test('sollte Zutaten korrekt herunterskalieren (4 -> 2 Personen)', () => {
    const scaled = scaleRecipe(mockRecipe, 2);
    expect(scaled.servings).toBe(2);
    expect(scaled.ingredients[0]).toEqual({ name: 'Mehl', quantity: 250, unit: 'g' });
    expect(scaled.ingredients[1]).toEqual({ name: 'Milch', quantity: 0.5, unit: 'l' });
    expect(scaled.ingredients[2]).toEqual({ name: 'Salz', quantity: null, unit: 'Prise' });
  });

  test('sollte Zutaten korrekt hochskalieren (4 -> 6 Personen)', () => {
    const scaled = scaleRecipe(mockRecipe, 6);
    expect(scaled.servings).toBe(6);
    expect(scaled.ingredients[0]).toEqual({ name: 'Mehl', quantity: 750, unit: 'g' });
    expect(scaled.ingredients[1]).toEqual({ name: 'Milch', quantity: 1.5, unit: 'l' });
  });

  test('sollte das Originalrezept nicht verändern', () => {
    scaleRecipe(mockRecipe, 8);
    expect(mockRecipe.servings).toBe(4);
    expect(mockRecipe.ingredients[0].quantity).toBe(500);
  });
});
