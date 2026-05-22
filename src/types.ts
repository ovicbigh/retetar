/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type RecipeCategory = 'appetizer' | 'soups' | 'entree' | 'main' | 'desert';

export type RecipeBase = 'vegetable' | 'meat';

export interface Recipe {
  id: string;
  title: string;
  url: string;
  category: RecipeCategory;
  base: RecipeBase;
  subCategory: string; // e.g. "chicken", "beef", "pork", "broccoli", "potato", etc.
  source: 'uploaded' | 'preloaded';
}

export interface CategorizationResult {
  title: string;
  url: string;
  category: RecipeCategory;
  base: RecipeBase;
  subCategory: string;
}

export interface GroupedSubRecipes {
  [subCategory: string]: Recipe[];
}

export interface GroupedBaseRecipes {
  vegetables: GroupedSubRecipes;
  meat: GroupedSubRecipes;
}
