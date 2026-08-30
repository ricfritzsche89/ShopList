export interface User {
  id: string;
  email: string;
  displayName: string;
  householdId: string | null;
  createdAt: string;
}

export interface HouseholdMember {
  role: 'admin' | 'member';
  name: string;
}

export interface Household {
  id: string;
  name: string;
  createdBy: string;
  members: { [userId: string]: HouseholdMember };
  createdAt: string;
}

export interface ShoppingList {
  id: string;
  householdId: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
}

export interface ShoppingItem {
  id: string;
  listId: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  category: string;
  isBought: boolean;
  boughtAt: string | null;
  boughtBy: string | null;
  addedBy: string;
  createdAt: string;
}

export interface FavoriteItem {
  id: string;
  name: string;
  defaultQuantity: number | null;
  defaultUnit: string | null;
  category: string;
}

export interface RecipeIngredient {
  name: string;
  quantity: number | null;
  unit: string | null;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  servings: number;
  prepTime: number; // in Minuten
  category: string;
  ingredients: RecipeIngredient[];
  steps: string[];
  notes: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyPlanDay {
  recipeId: string | null;
  recipeName: string;
  servings: number;
}

export interface WeeklyPlan {
  id: string; // z.B. "2026-35"
  householdId: string;
  defaultServings: number;
  days: {
    monday: WeeklyPlanDay;
    tuesday: WeeklyPlanDay;
    wednesday: WeeklyPlanDay;
    thursday: WeeklyPlanDay;
    friday: WeeklyPlanDay;
    saturday: WeeklyPlanDay;
    sunday: WeeklyPlanDay;
  };
}
