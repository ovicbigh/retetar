/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware to parse JSON payloads
app.use(express.json({ limit: "5mb" }));

// Initialize Gemini API client
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

function getAiClient() {
  if (!aiClient) {
    if (!apiKey) {
      console.warn("GEMINI_API_KEY environment variable is missing.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// REST API endpoint: Categorize user uploaded recipes
app.post("/api/categorize-recipes", async (req, res) => {
  try {
    const { recipes } = req.body;
    if (!Array.isArray(recipes) || recipes.length === 0) {
      return res.status(400).json({ error: "Invalid recipe list provided" });
    }

    const ai = getAiClient();
    if (!ai) {
      return res.status(500).json({
        error: "Gemini API key is not configured in this applet. Complete the configuration in Settings.",
      });
    }

    // Call Gemini to classify the recipe list
    const prompt = `Analyze this list of recipes (with titles and URLs) and categorize each of them perfectly into a structured format.
    
Recipes to classify:
${JSON.stringify(recipes, null, 2)}

Strict classification rules:
1. "category" MUST be exactly one of: "appetizer", "soups", "entree", "main", "desert".
   - Select the most appropriate category based on the title.
2. "base" MUST be green or meat-based. It MUST be exactly one of: "vegetable" or "meat".
   - If the key ingredient of the recipe is meat, poultry, seafood, or fish, select "meat".
   - If the main ingredient is vegetable, grain, dairy, fruit, egg, or sweet (for desserts), select "vegetable".
3. "subCategory" is a single neat capitalized noun in English representing the primary core ingredient.
   - For meat: e.g. "Chicken", "Beef", "Pork", "Salmon", "Shrimp", "Duck", "Turkey", "Lamb".
   - For vegetables/desserts: e.g. "Broccoli", "Potato", "Mushroom", "Tomato", "Chocolate", "Apple", "Spinach", "Cheese". Make sure it is clean.

Return a JSON array where each item matches the schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              url: { type: Type.STRING },
              category: { 
                type: Type.STRING, 
                description: 'Must stand for appetizer, soups, entree, main, or desert' 
              },
              base: { 
                type: Type.STRING, 
                description: 'Must be exactly vegetable or meat' 
              },
              subCategory: { 
                type: Type.STRING, 
                description: 'The primary ingredient name capitalized (e.g., Chicken, Beef, Pork, Potato, Broccoli, Strawberry)' 
              }
            },
            required: ["title", "url", "category", "base", "subCategory"]
          }
        }
      }
    });

    const parsedResult = JSON.parse(response.text || "[]");
    return res.json({ success: true, recipes: parsedResult });
  } catch (error: any) {
    console.error("Error categorizing recipes:", error);
    return res.status(500).json({ error: error.message || "Failed to categorize recipes" });
  }
});

// REST API endpoint: AI Chef Recipe Assistant
app.post("/api/recipe-details", async (req, res) => {
  try {
    const { title, url } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Recipe title is required" });
    }

    const ai = getAiClient();
    if (!ai) {
      return res.status(500).json({
        error: "Gemini API key is not configured.",
      });
    }

    const prompt = `You are a world-class professional head chef.
The user clicked on a recipe bookmark titled "${title}" (URL: ${url || "not specified"}).
Since the user is just browsing their list, generate a beautiful, concise, mouth-watering overview of what this typical recipe is, how it's prepared, and what makes it special.

Include the following sections clearly formatted in markdown:
1. **Description**: 2 sentences on the flavor profile and presentation.
2. **Core Ingredients**: list 4-6 primary ingredients needed.
3. **Chef's Pro Tip**: One secret culinary tip to take this dish to the next level.

Keep it very structured, inviting, and professional. Avoid long introductory text. Go straight to the bullet points.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    return res.json({ success: true, overview: response.text });
  } catch (error: any) {
    console.error("Error generating recipe details:", error);
    return res.status(500).json({ error: error.message || "Failed to generate recipe companion overview" });
  }
});

// Setup Vite Dev Server / Static Asset Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
