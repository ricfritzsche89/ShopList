import { Recipe, RecipeIngredient } from '../models/types';

/**
 * Skaliert die Zutaten eines Rezepts auf eine neue Personenanzahl.
 * Erstellt eine tiefe Kopie des Rezepts, sodass das Original nicht verändert wird.
 */
export function scaleRecipe(recipe: Recipe, targetServings: number): Recipe {
  if (targetServings <= 0 || recipe.servings <= 0) {
    return { ...recipe };
  }

  const factor = targetServings / recipe.servings;

  const scaledIngredients = recipe.ingredients.map((ingredient): RecipeIngredient => {
    if (ingredient.quantity === null || ingredient.quantity === undefined) {
      return { ...ingredient };
    }

    const scaledQuantity = ingredient.quantity * factor;
    return {
      ...ingredient,
      quantity: scaledQuantity,
    };
  });

  return {
    ...recipe,
    servings: targetServings,
    ingredients: scaledIngredients,
  };
}

/**
 * Skaliert ein einzelnes Zutat-Array auf einen bestimmten Skalierungsfaktor.
 */
export function scaleIngredients(ingredients: RecipeIngredient[], factor: number): RecipeIngredient[] {
  if (factor <= 0) return ingredients;
  
  return ingredients.map((ing) => {
    if (ing.quantity === null || ing.quantity === undefined) {
      return { ...ing };
    }
    return {
      ...ing,
      quantity: ing.quantity * factor,
    };
  });
}
