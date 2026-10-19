import { Ingredient, RecognitionItem, Recipe, UserPreference } from '../types';

export interface HealthResponse {
  status: string;
  hasApiKey: boolean;
  timestamp: string;
}

export interface RecognizeResponse {
  items: RecognitionItem[];
  modelUsed?: string;
  warning?: string;
  error?: string;
}

export interface GenerateRecipesResponse {
  recipes: Recipe[];
  modelUsed?: string;
  warning?: string;
  error?: string;
}

export interface TweakRecipeResponse {
  recipe?: Recipe;
  modelUsed?: string;
  warning?: string;
  error?: string;
}

export async function checkServerHealth(): Promise<HealthResponse> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('Health check failed');
    return await res.json();
  } catch (err: any) {
    return {
      status: 'offline',
      hasApiKey: false,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function recognizeIngredientsFromImage(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<RecognizeResponse> {
  const res = await fetch('/api/ai/recognize-ingredients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mimeType }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`辨識失敗 (${res.status}): ${errorText}`);
  }

  return await res.json();
}

export async function generatePersonalizedRecipes(
  ingredients: Ingredient[],
  preferences: UserPreference
): Promise<GenerateRecipesResponse> {
  const res = await fetch('/api/ai/generate-recipes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ingredients, preferences }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`食譜生成失敗 (${res.status}): ${errorText}`);
  }

  return await res.json();
}

export async function tweakSingleRecipe(params: {
  targetRecipe: Recipe;
  userPrompt: string;
  allRecipes: Recipe[];
  ingredients: Ingredient[];
  preferences: UserPreference;
}): Promise<TweakRecipeResponse> {
  const res = await fetch('/api/ai/tweak-recipe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`換菜微調失敗 (${res.status}): ${errorText}`);
  }

  return await res.json();
}
